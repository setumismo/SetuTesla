import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Navigation2, Locate, CornerDownLeft } from 'lucide-react';
import maplibregl from 'maplibre-gl';

// ─── CONSTANTS ────────────────────────────────────────────────
const DEFAULT_CENTER = [2.2803, 41.6208]; // Canovelles [lng, lat]
const DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const DEBOUNCE_MS = 400;

// ─── HELPERS ──────────────────────────────────────────────────
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

async function fetchRoute(originCoords, destCoords) {
    // OSRM expects lng,lat
    const url = `${OSRM_URL}/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?overview=full&geometries=geojson`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
            return data.routes[0].geometry;
        }
    } catch (e) {
        console.error('Route fetch error:', e);
    }
    return null;
}

// ─── CAR MARKER (SVG triangle) ────────────────────────────────
function createCarMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '36px';
    el.style.height = '36px';
    el.innerHTML = `
        <svg viewBox="0 0 36 36" width="36" height="36">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <circle cx="18" cy="18" r="14" fill="#3B82F6" opacity="0.25"/>
            <polygon points="18,4 28,28 18,22 8,28" fill="#3B82F6" filter="url(#glow)"/>
        </svg>
    `;
    el.style.transition = 'transform 0.3s ease';
    return el;
}

function createDestMarkerElement() {
    const el = document.createElement('div');
    el.style.width = '28px';
    el.style.height = '40px';
    el.innerHTML = `
        <svg viewBox="0 0 28 40" width="28" height="40">
            <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#EF4444"/>
            <circle cx="14" cy="14" r="6" fill="white"/>
        </svg>
    `;
    return el;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
const Navigation = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const carMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const watchIdRef = useRef(null);
    const followModeRef = useRef(false);

    const [originText, setOriginText] = useState('Mi ubicación');
    const [destText, setDestText] = useState('');
    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [originCoords, setOriginCoords] = useState(null); // [lng, lat]
    const [destCoords, setDestCoords] = useState(null);
    const [currentPos, setCurrentPos] = useState(null); // [lng, lat]
    const [currentHeading, setCurrentHeading] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [useGpsAsOrigin, setUseGpsAsOrigin] = useState(true);
    const [routeReady, setRouteReady] = useState(false);

    // ── Initialize map ──────────────────────────────────────
    useEffect(() => {
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: DARK_STYLE,
            center: DEFAULT_CENTER,
            zoom: 13,
            pitch: 0,
            attributionControl: false,
        });

        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

        // Car marker
        const carEl = createCarMarkerElement();
        const carMarker = new maplibregl.Marker({ element: carEl, rotationAlignment: 'map' })
            .setLngLat(DEFAULT_CENTER)
            .addTo(map);

        mapRef.current = map;
        carMarkerRef.current = carMarker;

        // When user interacts with map, break follow mode
        map.on('dragstart', () => {
            followModeRef.current = false;
            setIsFollowing(false);
        });

        return () => {
            map.remove();
        };
    }, []);

    // ── GPS watchPosition ───────────────────────────────────
    useEffect(() => {
        if (!navigator.geolocation) return;

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const lng = pos.coords.longitude;
                const lat = pos.coords.latitude;
                const heading = pos.coords.heading || 0;

                setCurrentPos([lng, lat]);
                setCurrentHeading(heading);

                // Move car marker
                if (carMarkerRef.current) {
                    carMarkerRef.current.setLngLat([lng, lat]);
                    const el = carMarkerRef.current.getElement();
                    el.style.transform = `${el.style.transform.replace(/rotate\([^)]*\)/, '')} rotate(${heading}deg)`;
                }

                // Follow mode camera
                if (followModeRef.current && mapRef.current) {
                    mapRef.current.easeTo({
                        center: [lng, lat],
                        bearing: heading,
                        duration: 1000,
                    });
                }
            },
            (err) => console.error('GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        );

        watchIdRef.current = id;
        return () => navigator.geolocation.clearWatch(id);
    }, []);

    // ── Center on first GPS fix ─────────────────────────────
    const firstFixDone = useRef(false);
    useEffect(() => {
        if (currentPos && mapRef.current && !firstFixDone.current) {
            firstFixDone.current = true;
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

    // ── Handle origin change ────────────────────────────────
    const handleOriginChange = (value) => {
        setOriginText(value);
        setUseGpsAsOrigin(false);
        if (value.length >= 3) {
            debouncedOriginSearch(value);
        } else {
            setOriginSuggestions([]);
        }
    };

    const selectOriginSuggestion = (item) => {
        setOriginText(item.display_name);
        setOriginCoords([parseFloat(item.lon), parseFloat(item.lat)]);
        setOriginSuggestions([]);
        setUseGpsAsOrigin(false);
        document.activeElement.blur();
    };

    const clearOrigin = () => {
        setOriginText('Mi ubicación');
        setOriginCoords(null);
        setOriginSuggestions([]);
        setUseGpsAsOrigin(true);
    };

    // ── Handle dest change ──────────────────────────────────
    const handleDestChange = (value) => {
        setDestText(value);
        if (value.length >= 3) {
            debouncedDestSearch(value);
        } else {
            setDestSuggestions([]);
        }
    };

    const selectDestSuggestion = (item) => {
        setDestText(item.display_name);
        const coords = [parseFloat(item.lon), parseFloat(item.lat)];
        setDestCoords(coords);
        setDestSuggestions([]);
        document.activeElement.blur();

        // Place destination marker
        if (destMarkerRef.current) destMarkerRef.current.remove();
        const destEl = createDestMarkerElement();
        const marker = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
            .setLngLat(coords)
            .addTo(mapRef.current);
        destMarkerRef.current = marker;

        // Fly to dest
        mapRef.current.flyTo({ center: coords, zoom: 14 });

        // Calculate route
        calculateRoute(coords);
    };

    const clearDest = () => {
        setDestText('');
        setDestCoords(null);
        setDestSuggestions([]);
        setRouteReady(false);
        if (destMarkerRef.current) {
            destMarkerRef.current.remove();
            destMarkerRef.current = null;
        }
        // Remove route from map
        if (mapRef.current) {
            if (mapRef.current.getSource('route')) {
                mapRef.current.removeLayer('route-line');
                mapRef.current.removeSource('route');
            }
        }
    };

    // ── Calculate route ─────────────────────────────────────
    const calculateRoute = async (dest) => {
        const origin = useGpsAsOrigin ? currentPos : originCoords;
        if (!origin || !dest) return;

        const geometry = await fetchRoute(origin, dest);
        if (!geometry || !mapRef.current) return;

        const map = mapRef.current;

        // Remove previous route
        if (map.getSource('route')) {
            map.removeLayer('route-line');
            map.removeSource('route');
        }

        map.addSource('route', {
            type: 'geojson',
            data: { type: 'Feature', geometry },
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
                'line-width': 6,
                'line-opacity': 0.85,
            },
        });

        // Fit bounds to route
        const coords = geometry.coordinates;
        const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new maplibregl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 80 });

        setRouteReady(true);
    };

    // ── Search button (for origin) ──────────────────────────
    const handleOriginSearchButton = async () => {
        if (!originText || originText === 'Mi ubicación') return;
        const results = await searchAddress(originText);
        if (results.length > 0) {
            selectOriginSuggestion(results[0]);
        }
    };

    const handleDestSearchButton = async () => {
        if (!destText) return;
        const results = await searchAddress(destText);
        if (results.length > 0) {
            selectDestSuggestion(results[0]);
        }
    };

    // ── Start navigation (3D follow) ────────────────────────
    const startNavigation = () => {
        if (!mapRef.current) return;
        const center = currentPos || DEFAULT_CENTER;

        followModeRef.current = true;
        setIsFollowing(true);

        mapRef.current.easeTo({
            center,
            zoom: 17,
            pitch: 60,
            bearing: currentHeading,
            duration: 1500,
        });
    };

    // ── Locate me ───────────────────────────────────────────
    const handleLocateMe = () => {
        if (currentPos && mapRef.current) {
            mapRef.current.flyTo({ center: currentPos, zoom: 15 });
        }
    };

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────
    return (
        <div className="h-full w-full relative bg-black overflow-hidden">
            {/* Map container */}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* ─── Input Panel ─────────────────────────────── */}
            <div
                className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2"
                style={{ maxWidth: 480 }}
            >
                {/* Origin */}
                <div className="relative">
                    <div className="bg-black/85 backdrop-blur-xl border border-zinc-700 rounded-2xl flex items-center px-3 py-2 shadow-2xl">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-2 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <input
                            type="text"
                            value={originText}
                            onChange={(e) => handleOriginChange(e.target.value)}
                            onFocus={() => { if (originText === 'Mi ubicación') setOriginText(''); }}
                            onBlur={() => { if (!originText) clearOrigin(); }}
                            placeholder="Origen"
                            className="bg-transparent border-none outline-none text-white text-base w-full placeholder-zinc-500 font-medium"
                        />
                        {originText && originText !== 'Mi ubicación' && (
                            <button
                                onClick={clearOrigin}
                                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white shrink-0"
                            >
                                <X size={22} />
                            </button>
                        )}
                        <button
                            onClick={handleOriginSearchButton}
                            className="w-10 h-10 flex items-center justify-center text-blue-500 hover:text-blue-400 shrink-0"
                        >
                            <Search size={20} />
                        </button>
                    </div>
                    {/* Origin Suggestions */}
                    {originSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl z-20">
                            {originSuggestions.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => selectOriginSuggestion(item)}
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 border-b border-zinc-800 last:border-0 transition-colors"
                                >
                                    {item.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Destination */}
                <div className="relative">
                    <div className="bg-black/85 backdrop-blur-xl border border-zinc-700 rounded-2xl flex items-center px-3 py-2 shadow-2xl">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-2 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                        <input
                            type="text"
                            value={destText}
                            onChange={(e) => handleDestChange(e.target.value)}
                            placeholder="Destino"
                            className="bg-transparent border-none outline-none text-white text-base w-full placeholder-zinc-500 font-medium"
                        />
                        {destText && (
                            <button
                                onClick={clearDest}
                                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white shrink-0"
                            >
                                <X size={22} />
                            </button>
                        )}
                        <button
                            onClick={handleDestSearchButton}
                            className="w-10 h-10 flex items-center justify-center text-blue-500 hover:text-blue-400 shrink-0"
                        >
                            <Search size={20} />
                        </button>
                    </div>
                    {/* Dest Suggestions */}
                    {destSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-xl border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl z-20">
                            {destSuggestions.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => selectDestSuggestion(item)}
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 border-b border-zinc-800 last:border-0 transition-colors"
                                >
                                    {item.display_name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Start Navigation Button ─────────────────── */}
            {routeReady && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                    <button
                        onClick={startNavigation}
                        className={`
                            px-10 py-4 rounded-full text-lg font-bold tracking-wide
                            flex items-center gap-3 shadow-2xl
                            transition-all duration-300 active:scale-95
                            ${isFollowing
                                ? 'bg-green-500 text-black hover:bg-green-400'
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            }
                        `}
                    >
                        <Navigation2 size={24} fill="currentColor" />
                        {isFollowing ? 'NAVEGANDO...' : 'INICIAR NAVEGACIÓN'}
                    </button>
                </div>
            )}

            {/* ─── Map Controls (bottom-right) ─────────────── */}
            <div className="absolute bottom-8 right-6 flex flex-col gap-3 z-10">
                <button
                    onClick={handleLocateMe}
                    className="w-14 h-14 bg-zinc-900/90 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-zinc-800 shadow-xl border border-zinc-700 active:scale-95 transition-all"
                >
                    <Locate size={26} />
                </button>
            </div>
        </div>
    );
};

export default Navigation;
