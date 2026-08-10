import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Search, X, Navigation2, Locate, AlertTriangle, ArrowUpRight, 
    ArrowUpLeft, ArrowUp, CornerUpRight, CornerUpLeft, RotateCcw, 
    Flag, RefreshCw, Compass, Zap, Home, Briefcase, Coffee, Fuel, 
    Layers, Plus, Minus, MapPin, Gauge
} from 'lucide-react';
import maplibregl from 'maplibre-gl';

// ─── MAP STYLES & CONSTANTS ────────────────────────────────────
const DEFAULT_CENTER = [2.2803, 41.6208]; // Canovelles / Granollers [lng, lat]
const MAP_STYLES = {
    dark: 'https://tiles.openfreemap.org/styles/dark',
    bright: 'https://tiles.openfreemap.org/styles/bright',
    liberty: 'https://tiles.openfreemap.org/styles/liberty',
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const DEBOUNCE_MS = 350;

// Predefined Tesla Superchargers list around the area
const NEARBY_SUPERCHARGERS = [
    { name: 'Supercargador Canovelles V3', power: '250 kW', stalls: '8 libres', distance: '3.8 km', coords: [2.2845, 41.6240] },
    { name: 'Supercargador Granollers Norte', power: '250 kW', stalls: '12 libres', distance: '8.5 km', coords: [2.2980, 41.6110] },
    { name: 'Supercargador Mataró Coast', power: '150 kW', stalls: '6 libres', distance: '18.2 km', coords: [2.4445, 41.5381] },
    { name: 'Supercargador La Roca Village', power: '250 kW', stalls: '10 libres', distance: '11.4 km', coords: [2.3320, 41.6050] },
];

function formatDistance(meters) {
    if (!meters || isNaN(meters)) return '0 m';
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0 min';
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs} h ${remMins} min`;
    }
    return `${mins} min`;
}

function formatETA(durationSeconds) {
    if (!durationSeconds) return '--:--';
    const now = new Date();
    const etaDate = new Date(now.getTime() + durationSeconds * 1000);
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getManeuverIcon(type, modifier) {
    if (type === 'arrive') return Flag;
    if (modifier?.includes('right')) return CornerUpRight;
    if (modifier?.includes('left')) return CornerUpLeft;
    if (type?.includes('roundabout') || modifier?.includes('u-turn')) return RotateCcw;
    if (modifier?.includes('slight right')) return ArrowUpRight;
    if (modifier?.includes('slight left')) return ArrowUpLeft;
    return ArrowUp;
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

async function searchAddress(query) {
    if (!query || query.length < 3) return [];
    try {
        const res = await fetch(
            `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=6&accept-language=es`
        );
        return await res.json();
    } catch {
        return [];
    }
}

// Tesla Vehicle SVG Marker
function createCarMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '44px';
    el.style.height = '44px';
    el.innerHTML = `
        <svg viewBox="0 0 44 44" width="44" height="44">
            <defs>
                <filter id="tesla-glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <circle cx="22" cy="22" r="18" fill="#3B82F6" opacity="0.3"/>
            <polygon points="22,4 35,36 22,28 9,36" fill="#2563EB" filter="url(#tesla-glow)"/>
            <polygon points="22,8 31,33 22,27 13,33" fill="#60A5FA"/>
        </svg>
    `;
    el.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    return el;
}

function createDestMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '36px';
    el.style.height = '48px';
    el.innerHTML = `
        <svg viewBox="0 0 28 40" width="36" height="48">
            <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#EF4444"/>
            <circle cx="14" cy="14" r="6" fill="white"/>
        </svg>
    `;
    return el;
}

// ─── GOOGLE MAPS STYLE TESLA NAVIGATOR ────────────────────────
const Navigation = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const carMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const followModeRef = useRef(false);

    // Geolocation & Status
    const [gpsStatus, setGpsStatus] = useState('pending'); // 'pending' | 'granted' | 'denied' | 'unavailable'
    const [gpsErrorMessage, setGpsErrorMessage] = useState('');
    const [currentPos, setCurrentPos] = useState(null); // [lng, lat]
    const [speed, setSpeed] = useState(0); // km/h
    const [currentHeading, setCurrentHeading] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [is3DView, setIs3DView] = useState(false);
    const [currentMapStyle, setCurrentMapStyle] = useState('dark');

    // Navigation Inputs & Results
    const [destText, setDestText] = useState('');
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [showSuperchargersList, setShowSuperchargersList] = useState(false);

    // Turn-by-Turn Route Guidance
    const [routeData, setRouteData] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);

    // Initialize Maplibre GL Map
    useEffect(() => {
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: MAP_STYLES.dark,
            center: DEFAULT_CENTER,
            zoom: 14,
            pitch: 0,
            attributionControl: false,
        });

        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

        const carEl = createCarMarkerElement();
        const carMarker = new maplibregl.Marker({ element: carEl, rotationAlignment: 'map' })
            .setLngLat(DEFAULT_CENTER)
            .addTo(map);

        mapRef.current = map;
        carMarkerRef.current = carMarker;

        map.on('dragstart', () => {
            followModeRef.current = false;
            setIsFollowing(false);
        });

        return () => {
            map.remove();
        };
    }, []);

    // Geolocation watchPosition
    const initGpsTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsStatus('unavailable');
            setGpsErrorMessage('El navegador no soporta la API de Geolocalización.');
            return;
        }

        setGpsStatus('pending');

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const lng = pos.coords.longitude;
                const lat = pos.coords.latitude;
                const head = pos.coords.heading || 0;
                const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;

                setGpsStatus('granted');
                setCurrentPos([lng, lat]);
                setCurrentHeading(head);
                setSpeed(spd);

                // Move Car Marker
                if (carMarkerRef.current) {
                    carMarkerRef.current.setLngLat([lng, lat]);
                    const el = carMarkerRef.current.getElement();
                    el.style.transform = `${el.style.transform.replace(/rotate\([^)]*\)/, '')} rotate(${head}deg)`;
                }

                // Follow Camera
                if (followModeRef.current && mapRef.current) {
                    mapRef.current.easeTo({
                        center: [lng, lat],
                        bearing: head,
                        duration: 800,
                    });
                }
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setGpsStatus('denied');
                    setGpsErrorMessage('Permiso de ubicación denegado. Permite el acceso a la ubicación en el navegador de tu Tesla.');
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    setGpsStatus('unavailable');
                    setGpsErrorMessage('Señal GPS no disponible actualmente.');
                }
            },
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
        );

        return () => navigator.geolocation.clearWatch(id);
    }, []);

    useEffect(() => {
        const cleanup = initGpsTracking();
        return cleanup;
    }, [initGpsTracking]);

    // Initial center on GPS
    const firstFixRef = useRef(false);
    useEffect(() => {
        if (currentPos && mapRef.current && !firstFixRef.current) {
            firstFixRef.current = true;
            mapRef.current.flyTo({ center: currentPos, zoom: 15 });
        }
    }, [currentPos]);

    // Address Search Debounce
    const debouncedDestSearch = useCallback(
        debounce(async (q) => {
            const results = await searchAddress(q);
            setDestSuggestions(results);
        }, DEBOUNCE_MS),
        []
    );

    const handleDestInputChange = (val) => {
        setDestText(val);
        setShowSuperchargersList(false);
        if (val.length >= 3) debouncedDestSearch(val);
        else setDestSuggestions([]);
    };

    // Calculate OSRM Route
    const calculateRouteToCoords = async (coords, name) => {
        const origin = currentPos || DEFAULT_CENTER;
        try {
            const url = `${OSRM_URL}/${origin[0]},${origin[1]};${coords[0]},${coords[1]}?overview=full&geometries=geojson&steps=true`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                setRouteData(route);
                setSteps(route.legs[0].steps || []);
                setCurrentStepIndex(0);
                setSelectedDestination({ coords, name });

                // Render Destination Marker
                if (destMarkerRef.current) destMarkerRef.current.remove();
                const destEl = createDestMarkerElement();
                const marker = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
                    .setLngLat(coords)
                    .addTo(mapRef.current);
                destMarkerRef.current = marker;

                // Render Route Line
                const map = mapRef.current;
                if (map.getSource('route')) {
                    map.removeLayer('route-line');
                    map.removeSource('route');
                }

                map.addSource('route', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: route.geometry },
                });

                map.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: { 'line-color': '#3B82F6', 'line-width': 7, 'line-opacity': 0.9 },
                });

                // Fit bounds
                const routeCoords = route.geometry.coordinates;
                const bounds = routeCoords.reduce(
                    (b, c) => b.extend(c),
                    new maplibregl.LngLatBounds(routeCoords[0], routeCoords[0])
                );
                map.fitBounds(bounds, { padding: 90 });
            }
        } catch (e) {
            console.error('Error fetching OSRM route:', e);
        }
    };

    const selectSuggestion = (item) => {
        const coords = [parseFloat(item.lon), parseFloat(item.lat)];
        setDestText(item.display_name);
        setDestSuggestions([]);
        calculateRouteToCoords(coords, item.display_name);
    };

    const selectSupercharger = (sc) => {
        setDestText(sc.name);
        setShowSuperchargersList(false);
        calculateRouteToCoords(sc.coords, sc.name);
    };

    const clearDestination = () => {
        setDestText('');
        setDestSuggestions([]);
        setRouteData(null);
        setSteps([]);
        setSelectedDestination(null);
        setIsNavigating(false);
        followModeRef.current = false;
        setIsFollowing(false);
        setShowSuperchargersList(false);

        if (destMarkerRef.current) {
            destMarkerRef.current.remove();
            destMarkerRef.current = null;
        }

        if (mapRef.current && mapRef.current.getSource('route')) {
            mapRef.current.removeLayer('route-line');
            mapRef.current.removeSource('route');
        }
    };

    // Navigation Controls
    const startNavigationMode = () => {
        if (!mapRef.current) return;
        setIsNavigating(true);
        followModeRef.current = true;
        setIsFollowing(true);

        const center = currentPos || DEFAULT_CENTER;
        mapRef.current.easeTo({
            center,
            zoom: 17,
            pitch: 60,
            bearing: currentHeading,
            duration: 1200,
        });
    };

    const stopNavigationMode = () => {
        setIsNavigating(false);
        followModeRef.current = false;
        setIsFollowing(false);
        if (mapRef.current) {
            mapRef.current.easeTo({ pitch: 0, zoom: 14 });
        }
    };

    const handleLocateMe = () => {
        if (currentPos && mapRef.current) {
            followModeRef.current = true;
            setIsFollowing(true);
            mapRef.current.flyTo({ center: currentPos, zoom: 16 });
        }
    };

    const toggle3DView = () => {
        if (!mapRef.current) return;
        const next3D = !is3DView;
        setIs3DView(next3D);
        mapRef.current.easeTo({ pitch: next3D ? 60 : 0, duration: 800 });
    };

    const toggleMapStyle = () => {
        if (!mapRef.current) return;
        const nextStyle = currentMapStyle === 'dark' ? 'bright' : 'dark';
        setCurrentMapStyle(nextStyle);
        mapRef.current.setStyle(MAP_STYLES[nextStyle]);
    };

    const zoomIn = () => mapRef.current?.zoomIn();
    const zoomOut = () => mapRef.current?.zoomOut();

    const activeStep = steps[currentStepIndex] || null;
    const ManeuverIcon = activeStep ? getManeuverIcon(activeStep.maneuver.type, activeStep.maneuver.modifier) : ArrowUp;

    return (
        <div className="h-full w-full relative bg-black font-sans select-none overflow-hidden">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* ── Geolocation Warning Header Banner ── */}
            {gpsStatus !== 'granted' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-11/12 bg-zinc-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={22} className="text-amber-400 shrink-0" />
                        <div className="text-xs text-zinc-300">
                            <span className="font-bold text-amber-300">Permiso GPS: </span>
                            {gpsErrorMessage || 'Activa la ubicación en el navegador Tesla para rastreo en directo.'}
                        </div>
                    </div>
                    <button
                        onClick={initGpsTracking}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 p-2 rounded-xl border border-amber-500/40 text-xs font-bold shrink-0 ml-2"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            )}

            {/* ── Top Navigation Maneuver HUD (When Navigating) ── */}
            {isNavigating && activeStep && (
                <div className="absolute top-6 left-6 z-20 bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl flex items-center gap-5 max-w-lg w-full animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shrink-0">
                        <ManeuverIcon size={38} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-2xl font-black text-white tracking-tight">
                            {formatDistance(activeStep.distance)}
                        </div>
                        <div className="text-sm font-bold text-zinc-200 truncate mt-0.5">
                            {activeStep.name || activeStep.maneuver.instruction || 'Sigue la carretera'}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Google Maps / Tesla Search Bar Header (When NOT Navigating) ── */}
            {!isNavigating && (
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-3 max-w-lg w-full">
                    {/* Main Search Input */}
                    <div className="relative">
                        <div className="bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-3 flex items-center shadow-2xl backdrop-blur-2xl">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center mr-3 shrink-0 text-blue-400">
                                <Search size={22} />
                            </div>
                            <input
                                type="text"
                                value={destText}
                                onChange={(e) => handleDestInputChange(e.target.value)}
                                placeholder="¿A dónde quieres ir? (Buscar en Google Maps GPS)..."
                                className="bg-transparent border-none outline-none text-white text-base w-full placeholder-zinc-500 font-medium"
                            />
                            {destText && (
                                <button onClick={clearDestination} className="p-2 text-zinc-400 hover:text-white shrink-0">
                                    <X size={22} />
                                </button>
                            )}
                        </div>

                        {/* Search Autocomplete Suggestions */}
                        {destSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 border border-zinc-700 rounded-3xl overflow-hidden shadow-2xl z-30 max-h-72 overflow-auto divide-y divide-zinc-800">
                                {destSuggestions.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectSuggestion(item)}
                                        className="w-full text-left px-5 py-4 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-3"
                                    >
                                        <MapPin size={18} className="text-red-400 shrink-0" />
                                        <span className="truncate">{item.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Category Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        <button
                            onClick={() => setShowSuperchargersList(!showSuperchargersList)}
                            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg border transition-all active:scale-95 shrink-0 ${
                                showSuperchargersList
                                    ? 'bg-red-600 text-white border-red-400'
                                    : 'bg-zinc-900/90 text-red-400 border-zinc-700 hover:bg-zinc-800'
                            }`}
                        >
                            <Zap size={16} className="fill-current" /> Supercargadores
                        </button>
                        <button
                            onClick={() => handleDestInputChange('Canovelles')}
                            className="px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 bg-zinc-900/90 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 shadow-lg active:scale-95 shrink-0"
                        >
                            <Home size={16} className="text-blue-400" /> Casa
                        </button>
                        <button
                            onClick={() => handleDestInputChange('Granollers')}
                            className="px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 bg-zinc-900/90 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 shadow-lg active:scale-95 shrink-0"
                        >
                            <Briefcase size={16} className="text-purple-400" /> Trabajo
                        </button>
                        <button
                            onClick={() => handleDestInputChange('Cafetería')}
                            className="px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 bg-zinc-900/90 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 shadow-lg active:scale-95 shrink-0"
                        >
                            <Coffee size={16} className="text-amber-400" /> Cafés
                        </button>
                        <button
                            onClick={() => handleDestInputChange('Gasolinera')}
                            className="px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 bg-zinc-900/90 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 shadow-lg active:scale-95 shrink-0"
                        >
                            <Fuel size={16} className="text-emerald-400" /> Gasolineras
                        </button>
                    </div>

                    {/* Superchargers Nearby Drawer */}
                    {showSuperchargersList && (
                        <div className="bg-zinc-900/95 border border-zinc-700 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl flex flex-col gap-2 max-h-72 overflow-auto">
                            <div className="text-xs font-bold text-red-400 uppercase tracking-wider px-2 py-1">
                                Supercargadores Tesla Cercanos
                            </div>
                            {NEARBY_SUPERCHARGERS.map((sc) => (
                                <button
                                    key={sc.name}
                                    onClick={() => selectSupercharger(sc)}
                                    className="bg-zinc-800/80 hover:bg-zinc-700 p-3 rounded-2xl border border-zinc-700 flex items-center justify-between transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                                            <Zap size={20} className="fill-current" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{sc.name}</div>
                                            <div className="text-xs text-zinc-400 mt-0.5">{sc.power} • <span className="text-emerald-400 font-semibold">{sc.stalls}</span></div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-zinc-300 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-700">
                                        {sc.distance}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Floating "Iniciar Ruta" Action Button ── */}
            {routeData && !isNavigating && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onClick={startNavigationMode}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full text-lg font-black tracking-wide shadow-2xl flex items-center gap-3 active:scale-95 transition-all border border-blue-400/40"
                    >
                        <Navigation2 size={24} fill="currentColor" />
                        INICIAR RUTA ({formatDuration(routeData.duration)})
                    </button>
                </div>
            )}

            {/* ── Bottom Navigation HUD (During Active Navigation) ── */}
            {isNavigating && routeData && (
                <div className="absolute bottom-6 left-6 right-24 z-20 max-w-xl bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">LLEGADA</div>
                            <div className="text-3xl font-black text-emerald-400 tracking-tight">
                                {formatETA(routeData.duration)}
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-zinc-800" />
                        <div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TIEMPO / DISTANCIA</div>
                            <div className="text-base font-bold text-white">
                                {formatDuration(routeData.duration)} • {formatDistance(routeData.distance)}
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-zinc-800" />
                        <div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">VELOCIDAD</div>
                            <div className="text-base font-bold text-blue-400 flex items-center gap-1">
                                <Gauge size={16} /> {speed} <span className="text-xs text-zinc-500 font-normal">km/h</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={stopNavigationMode}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 px-5 py-3 rounded-2xl font-bold text-xs tracking-wider transition-colors shrink-0 ml-4"
                    >
                        CANCELAR
                    </button>
                </div>
            )}

            {/* ── Google Maps / Tesla Map Control Toolbar (Bottom-Right) ── */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-20">
                <button
                    onClick={handleLocateMe}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border transition-all active:scale-90 ${
                        isFollowing
                            ? 'bg-blue-600 text-white border-blue-400 shadow-blue-600/50'
                            : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                    }`}
                    title="Centrar en mi ubicación"
                >
                    <Locate size={26} />
                </button>

                <button
                    onClick={toggle3DView}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border transition-all active:scale-90 ${
                        is3DView
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                    }`}
                    title="Vista 3D / 2D"
                >
                    <Compass size={26} />
                </button>

                <button
                    onClick={toggleMapStyle}
                    className="w-14 h-14 bg-zinc-900/90 text-zinc-300 border border-zinc-700 hover:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90"
                    title="Cambiar estilo de mapa"
                >
                    <Layers size={24} />
                </button>

                <div className="bg-zinc-900/90 border border-zinc-700 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
                    <button
                        onClick={zoomIn}
                        className="w-14 h-12 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 border-b border-zinc-800 transition-colors"
                    >
                        <Plus size={22} />
                    </button>
                    <button
                        onClick={zoomOut}
                        className="w-14 h-12 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <Minus size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Navigation;
