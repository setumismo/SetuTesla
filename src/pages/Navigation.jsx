import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Search, X, Navigation2, Locate, AlertTriangle, ArrowUpRight, 
    ArrowUpLeft, ArrowUp, CornerUpRight, CornerUpLeft, RotateCcw, 
    Flag, ShieldAlert, RefreshCw, Compass
} from 'lucide-react';
import maplibregl from 'maplibre-gl';

// ─── CONSTANTS ────────────────────────────────────────────────
const DEFAULT_CENTER = [2.2803, 41.6208]; // Canovelles / Granollers area [lng, lat]
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const DEBOUNCE_MS = 400;

// Helper: Calculate distance between two lat/lng points in meters (Haversine)
function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// Helper: Format distance to readable string (m or km)
function formatDistance(meters) {
    if (!meters || isNaN(meters)) return '0 m';
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

// Helper: Format duration to readable string (min or h min)
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

// Helper: Calculate ETA time
function formatETA(durationSeconds) {
    if (!durationSeconds) return '--:--';
    const now = new Date();
    const etaDate = new Date(now.getTime() + durationSeconds * 1000);
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper: Pick Lucide icon based on OSRM maneuver type/modifier
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
            `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=es`
        );
        return await res.json();
    } catch {
        return [];
    }
}

// Car marker SVG
function createCarMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '42px';
    el.style.height = '42px';
    el.innerHTML = `
        <svg viewBox="0 0 42 42" width="42" height="42">
            <defs>
                <filter id="glow-tesla">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <circle cx="21" cy="21" r="17" fill="#3B82F6" opacity="0.25"/>
            <polygon points="21,5 33,34 21,27 9,34" fill="#3B82F6" filter="url(#glow-tesla)"/>
            <polygon points="21,9 29,31 21,26 13,31" fill="#60A5FA"/>
        </svg>
    `;
    el.style.transition = 'transform 0.3s ease';
    return el;
}

function createDestMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '32px';
    el.style.height = '44px';
    el.innerHTML = `
        <svg viewBox="0 0 28 40" width="32" height="44">
            <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#EF4444"/>
            <circle cx="14" cy="14" r="6" fill="white"/>
        </svg>
    `;
    return el;
}

// ─── MAIN NAVIGATION COMPONENT ────────────────────────────────
const Navigation = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const carMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const followModeRef = useRef(false);

    // Geolocation states
    const [gpsStatus, setGpsStatus] = useState('pending'); // 'pending' | 'granted' | 'denied' | 'unavailable' | 'timeout'
    const [gpsErrorMessage, setGpsErrorMessage] = useState('');
    const [currentPos, setCurrentPos] = useState(null); // [lng, lat]
    const [speed, setSpeed] = useState(0); // km/h
    const [currentHeading, setCurrentHeading] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);

    // Inputs & Routing
    const [originText, setOriginText] = useState('Mi ubicación actual');
    const [destText, setDestText] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [originCoords, setOriginCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [useGpsAsOrigin, setUseGpsAsOrigin] = useState(true);

    // Route & Step-by-step guidance
    const [routeData, setRouteData] = useState(null);
    const [steps, setSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);

    // ── Initialize Maplibre Map ─────────────────────────────
    useEffect(() => {
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: DARK_STYLE,
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

    // ── Real-Time GPS Tracking with watchPosition ───────────
    const initGpsTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsStatus('unavailable');
            setGpsErrorMessage('Tu navegador no es compatible con la API de Geolocalización.');
            return;
        }

        setGpsStatus('pending');

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const lng = pos.coords.longitude;
                const lat = pos.coords.latitude;
                const head = pos.coords.heading || 0;
                const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0; // m/s to km/h

                setGpsStatus('granted');
                setCurrentPos([lng, lat]);
                setCurrentHeading(head);
                setSpeed(spd);

                // Update car marker
                if (carMarkerRef.current) {
                    carMarkerRef.current.setLngLat([lng, lat]);
                    const el = carMarkerRef.current.getElement();
                    el.style.transform = `${el.style.transform.replace(/rotate\([^)]*\)/, '')} rotate(${head}deg)`;
                }

                // Camera Follow mode
                if (followModeRef.current && mapRef.current) {
                    mapRef.current.easeTo({
                        center: [lng, lat],
                        bearing: head,
                        duration: 800,
                    });
                }
            },
            (err) => {
                console.warn('GPS Error code:', err.code, err.message);
                if (err.code === err.PERMISSION_DENIED) {
                    setGpsStatus('denied');
                    setGpsErrorMessage('Permiso de ubicación denegado por el navegador de Tesla. Autorízalo desde la barra de direcciones.');
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    setGpsStatus('unavailable');
                    setGpsErrorMessage('Señala GPS no disponible. Verifica que estás en una zona abierta.');
                } else if (err.code === err.TIMEOUT) {
                    setGpsStatus('timeout');
                    setGpsErrorMessage('Tiempo de espera agotado al conectar con el GPS vehicular.');
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 15000
            }
        );

        return () => navigator.geolocation.clearWatch(id);
    }, []);

    useEffect(() => {
        const cleanup = initGpsTracking();
        return cleanup;
    }, [initGpsTracking]);

    // Center map on initial GPS fix
    const firstFixRef = useRef(false);
    useEffect(() => {
        if (currentPos && mapRef.current && !firstFixRef.current) {
            firstFixRef.current = true;
            mapRef.current.flyTo({ center: currentPos, zoom: 15 });
        }
    }, [currentPos]);

    // ── Debounced address search ────────────────────────────
    const debouncedOriginSearch = useCallback(
        debounce(async (q) => {
            const results = await searchAddress(q);
            setOriginSuggestions(results);
        }, DEBOUNCE_MS),
        []
    );

    const debouncedDestSearch = useCallback(
        debounce(async (q) => {
            const results = await searchAddress(q);
            setDestSuggestions(results);
        }, DEBOUNCE_MS),
        []
    );

    const handleOriginChange = (val) => {
        setOriginText(val);
        setUseGpsAsOrigin(false);
        if (val.length >= 3) debouncedOriginSearch(val);
        else setOriginSuggestions([]);
    };

    const selectOriginSuggestion = (item) => {
        setOriginText(item.display_name);
        setOriginCoords([parseFloat(item.lon), parseFloat(item.lat)]);
        setOriginSuggestions([]);
        setUseGpsAsOrigin(false);
    };

    const clearOrigin = () => {
        setOriginText('Mi ubicación actual');
        setOriginCoords(null);
        setOriginSuggestions([]);
        setUseGpsAsOrigin(true);
    };

    const handleDestChange = (val) => {
        setDestText(val);
        if (val.length >= 3) debouncedDestSearch(val);
        else setDestSuggestions([]);
    };

    const selectDestSuggestion = (item) => {
        setDestText(item.display_name);
        const coords = [parseFloat(item.lon), parseFloat(item.lat)];
        setDestCoords(coords);
        setDestSuggestions([]);

        // Add Destination Marker
        if (destMarkerRef.current) destMarkerRef.current.remove();
        const destEl = createDestMarkerElement();
        const marker = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
            .setLngLat(coords)
            .addTo(mapRef.current);
        destMarkerRef.current = marker;

        // Calculate OSRM Route
        calculateRoute(coords);
    };

    const clearDest = () => {
        setDestText('');
        setDestCoords(null);
        setDestSuggestions([]);
        setRouteData(null);
        setSteps([]);
        setIsNavigating(false);
        followModeRef.current = false;
        setIsFollowing(false);

        if (destMarkerRef.current) {
            destMarkerRef.current.remove();
            destMarkerRef.current = null;
        }

        if (mapRef.current && mapRef.current.getSource('route')) {
            mapRef.current.removeLayer('route-line');
            mapRef.current.removeSource('route');
        }
    };

    // ── Calculate Route with Step-by-Step Maneuvers ─────────
    const calculateRoute = async (destination) => {
        const origin = useGpsAsOrigin ? currentPos : originCoords;
        if (!origin || !destination) return;

        try {
            // Request OSRM route with full geometries and steps
            const url = `${OSRM_URL}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson&steps=true`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                setRouteData(route);

                if (route.legs && route.legs[0].steps) {
                    setSteps(route.legs[0].steps);
                    setCurrentStepIndex(0);
                }

                // Render Route line on Map
                const map = mapRef.current;
                if (!map) return;

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
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: {
                        'line-color': '#3B82F6',
                        'line-width': 7,
                        'line-opacity': 0.85,
                    },
                });

                // Fit bounds
                const coords = route.geometry.coordinates;
                const bounds = coords.reduce(
                    (b, c) => b.extend(c),
                    new maplibregl.LngLatBounds(coords[0], coords[0])
                );
                map.fitBounds(bounds, { padding: 90 });
            }
        } catch (e) {
            console.error('Error fetching OSRM route:', e);
        }
    };

    // Start turn-by-turn guidance
    const startNavigationMode = () => {
        if (!mapRef.current) return;
        setIsNavigating(true);
        followModeRef.current = true;
        setIsFollowing(true);

        const center = currentPos || DEFAULT_CENTER;
        mapRef.current.easeTo({
            center,
            zoom: 17,
            pitch: 55,
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

    // Current Maneuver Step calculation
    const activeStep = steps[currentStepIndex] || null;
    const nextManeuverIcon = activeStep 
        ? getManeuverIcon(activeStep.maneuver.type, activeStep.maneuver.modifier)
        : ArrowUp;

    return (
        <div className="h-full w-full relative bg-black overflow-hidden font-sans select-none">
            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* ── Geolocation Permission / Error Warning Banner ── */}
            {gpsStatus !== 'granted' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-lg w-11/12 bg-zinc-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3">
                    <AlertTriangle size={24} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                        <div className="font-bold text-amber-300">
                            {gpsStatus === 'denied' ? 'Permiso GPS Requerido en Tesla' : 'Buscando señal GPS...'}
                        </div>
                        <div className="text-zinc-300 text-xs mt-1">
                            {gpsErrorMessage || 'Por favor otorga permiso de ubicación en la barra de navegación del vehículo para permitir el rastreo en tiempo real.'}
                        </div>
                    </div>
                    <button
                        onClick={initGpsTracking}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 p-2 rounded-xl border border-amber-500/40 shrink-0 transition-colors"
                        title="Reintentar GPS"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            )}

            {/* ── Top Turn-by-Turn Instruction Banner (Active Navigation) ── */}
            {isNavigating && activeStep && (
                <div className="absolute top-6 left-6 z-20 bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl flex items-center gap-5 max-w-md w-full animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shrink-0">
                        {React.createElement(nextManeuverIcon, { size: 38, strokeWidth: 2.5 })}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-2xl font-black text-white tracking-tight">
                            {formatDistance(activeStep.distance)}
                        </div>
                        <div className="text-sm font-semibold text-zinc-300 truncate mt-0.5">
                            {activeStep.name || activeStep.maneuver.instruction || 'Sigue la ruta marcada'}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Search & Input Panel (When NOT Navigating) ── */}
            {!isNavigating && (
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-3 max-w-md w-full">
                    {/* Origin Input */}
                    <div className="relative">
                        <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-2.5 flex items-center shadow-2xl backdrop-blur-xl">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center mr-3 shrink-0">
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            </div>
                            <input
                                type="text"
                                value={originText}
                                onChange={(e) => handleOriginChange(e.target.value)}
                                onFocus={() => { if (originText === 'Mi ubicación actual') setOriginText(''); }}
                                onBlur={() => { if (!originText) clearOrigin(); }}
                                placeholder="Origen..."
                                className="bg-transparent border-none outline-none text-white text-base w-full placeholder-zinc-500 font-medium"
                            />
                            {originText && originText !== 'Mi ubicación actual' && (
                                <button onClick={clearOrigin} className="p-2 text-zinc-400 hover:text-white shrink-0">
                                    <X size={20} />
                                </button>
                            )}
                            <Search size={18} className="text-zinc-500 mx-2 shrink-0" />
                        </div>
                        {/* Origin Suggestions */}
                        {originSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl z-30">
                                {originSuggestions.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectOriginSuggestion(item)}
                                        className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 border-b border-zinc-800/80 last:border-0 truncate"
                                    >
                                        {item.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Destination Input */}
                    <div className="relative">
                        <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-2.5 flex items-center shadow-2xl backdrop-blur-xl">
                            <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center mr-3 shrink-0">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                            </div>
                            <input
                                type="text"
                                value={destText}
                                onChange={(e) => handleDestChange(e.target.value)}
                                placeholder="Introduce destino en Tesla GPS..."
                                className="bg-transparent border-none outline-none text-white text-base w-full placeholder-zinc-500 font-medium"
                            />
                            {destText && (
                                <button onClick={clearDest} className="p-2 text-zinc-400 hover:text-white shrink-0">
                                    <X size={20} />
                                </button>
                            )}
                            <Search size={18} className="text-zinc-500 mx-2 shrink-0" />
                        </div>
                        {/* Destination Suggestions */}
                        {destSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl z-30 max-h-60 overflow-auto">
                                {destSuggestions.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectDestSuggestion(item)}
                                        className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 border-b border-zinc-800/80 last:border-0 truncate"
                                    >
                                        {item.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Start Navigation Floating Button ── */}
            {routeData && !isNavigating && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <button
                        onClick={startNavigationMode}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full text-lg font-bold tracking-wide shadow-2xl flex items-center gap-3 active:scale-95 transition-all border border-blue-400/40"
                    >
                        <Navigation2 size={24} fill="currentColor" />
                        INICIAR RUTA ({formatDuration(routeData.duration)})
                    </button>
                </div>
            )}

            {/* ── Bottom Route Stats Card (Active Navigation) ── */}
            {isNavigating && routeData && (
                <div className="absolute bottom-6 left-6 right-24 z-20 max-w-xl bg-zinc-900/95 border border-zinc-700/80 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div>
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">LLEGADA</div>
                            <div className="text-3xl font-black text-emerald-400 tracking-tight">
                                {formatETA(routeData.duration)}
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-zinc-800" />
                        <div>
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">TIEMPO / DISTANCIA</div>
                            <div className="text-lg font-bold text-white">
                                {formatDuration(routeData.duration)} • {formatDistance(routeData.distance)}
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-zinc-800" />
                        <div>
                            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">VELOCIDAD</div>
                            <div className="text-lg font-bold text-blue-400">
                                {speed} <span className="text-xs text-zinc-500 font-normal">km/h</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={stopNavigationMode}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 px-5 py-3 rounded-2xl font-bold text-xs tracking-wider transition-colors shrink-0 ml-4"
                    >
                        FINALIZAR
                    </button>
                </div>
            )}

            {/* ── Map Controls (Bottom-Right) ── */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-20">
                <button
                    onClick={handleLocateMe}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border transition-all active:scale-90 ${
                        isFollowing
                            ? 'bg-blue-600 text-white border-blue-400 shadow-blue-600/40'
                            : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                    }`}
                    title="Centrar en mi ubicación"
                >
                    <Locate size={26} />
                </button>
            </div>
        </div>
    );
};

export default Navigation;
