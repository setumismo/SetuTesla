import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Search, X, Radio, Antenna, Volume2 } from 'lucide-react';

// ── Predefined favorite stations ────────────────────────────
const FAVORITES = [
    { name: 'LOS40', genre: 'Pop', country: 'ES', color: 'from-yellow-700 to-yellow-900', url: '', logo: 'https://play.los40.com/apple-touch-icon.png' },
    { name: 'LOS40 Classic', genre: 'Clásicos', country: 'ES', color: 'from-amber-700 to-amber-900', url: '', logo: 'https://play.los40classic.com/apple-touch-icon.png' },
    { name: 'Cadena SER', genre: 'Noticias', country: 'ES', color: 'from-blue-700 to-blue-900', url: '', logo: 'https://cadenaser.com/apple-touch-icon.png' },
    { name: 'Cadena COPE', genre: 'Noticias', country: 'ES', color: 'from-sky-700 to-sky-900', url: '', logo: 'https://www.cope.es/apple-touch-icon.png' },
    { name: 'Rock FM', genre: 'Rock', country: 'ES', color: 'from-red-700 to-red-900', url: '', logo: 'https://www.rockfm.fm/apple-touch-icon.png' },
    { name: 'Europa FM', genre: 'Pop/Dance', country: 'ES', color: 'from-green-700 to-green-900', url: '', logo: 'https://www.europafm.com/apple-touch-icon.png' },
    { name: 'Kiss FM', genre: 'Dance', country: 'ES', color: 'from-pink-700 to-pink-900', url: '', logo: 'https://www.kissfm.es/apple-touch-icon.png' },
    { name: 'Cadena Dial', genre: 'Español', country: 'ES', color: 'from-orange-700 to-orange-900', url: '', logo: 'https://www.cadenadial.com/apple-touch-icon.png' },
    { name: 'RAC1', genre: 'Catalunya', country: 'ES', color: 'from-indigo-700 to-indigo-900', url: '', logo: 'https://www.rac1.cat/apple-touch-icon.png' },
    { name: 'Flaixbac', genre: 'Catalunya', country: 'ES', color: 'from-purple-700 to-purple-900', url: '', logo: 'https://www.flaixbac.cat/apple-touch-icon.png' },
    { name: 'BBC Radio 1', genre: 'Pop/Rock', country: 'GB', color: 'from-zinc-700 to-zinc-900', url: '', logo: 'https://sounds.files.bbci.co.uk/3.5.2/networks/bbc_radio_one/colour_default.svg' },
    { name: 'NRJ', genre: 'Electrónica', country: 'FR', color: 'from-teal-700 to-teal-900', url: '', logo: 'https://www.nrj.fr/apple-touch-icon.png' },
];

const RADIO_API = 'https://de1.api.radio-browser.info/json/stations';

async function resolveStationUrl(stationName) {
    try {
        const res = await fetch(
            `${RADIO_API}/search?name=${encodeURIComponent(stationName)}&limit=5&order=votes&reverse=true`,
            { headers: { 'User-Agent': 'SetuTesla/1.0' } }
        );
        const data = await res.json();
        // Find best match with a working URL
        const match = data.find(s =>
            s.url_resolved && s.name.toLowerCase().includes(stationName.toLowerCase().split(' ')[0])
        ) || data[0];
        return match?.url_resolved || null;
    } catch (e) {
        console.error('Radio API error:', e);
        return null;
    }
}

const RadioPage = () => {
    const audioRef = useRef(null);
    const [stations, setStations] = useState(FAVORITES);
    const [currentStation, setCurrentStation] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // ── Resolve stream URLs for favorites on mount ──────────
    useEffect(() => {
        const resolveAll = async () => {
            const resolved = await Promise.all(
                FAVORITES.map(async (station) => {
                    const url = await resolveStationUrl(station.name);
                    return { ...station, url: url || '' };
                })
            );
            setStations(resolved);
        };
        resolveAll();
    }, []);

    // ── Play a station ──────────────────────────────────────
    const playStation = async (station) => {
        let streamUrl = station.url;

        if (!streamUrl) {
            setLoading(true);
            streamUrl = await resolveStationUrl(station.name);
            if (!streamUrl) {
                setLoading(false);
                alert(`No se encontró stream para ${station.name}`);
                return;
            }
        }

        setCurrentStation({ ...station, url: streamUrl });
        setLoading(true);

        if (audioRef.current) {
            audioRef.current.src = streamUrl;
            try {
                await audioRef.current.play();
                setIsPlaying(true);
            } catch (e) {
                console.error('Play error:', e);
            }
        }
        setLoading(false);
        document.activeElement.blur();
    };

    const togglePlayPause = () => {
        if (!audioRef.current || !currentStation) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const stopPlayback = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            setIsPlaying(false);
            setCurrentStation(null);
        }
    };

    // ── Search stations ─────────────────────────────────────
    const handleSearch = async () => {
        if (!searchQuery || searchQuery.length < 2) return;
        setSearching(true);
        try {
            const res = await fetch(
                `${RADIO_API}/search?name=${encodeURIComponent(searchQuery)}&limit=12&order=votes&reverse=true`,
                { headers: { 'User-Agent': 'SetuTesla/1.0' } }
            );
            const data = await res.json();
            setSearchResults(data.filter(s => s.url_resolved));
        } catch (e) {
            console.error('Search error:', e);
        }
        setSearching(false);
        document.activeElement.blur();
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
    };

    // ─────────────────────────────────────────────────────────
    return (
        <div className="h-full w-full bg-black flex flex-col overflow-hidden">
            {/* Hidden audio element */}
            <audio ref={audioRef} preload="none" />

            {/* ── Header + Search ──────────────────────────── */}
            <div className="p-6 pb-3 shrink-0">
                <h1 className="text-3xl font-bold text-white mb-4">Radio Online</h1>
                <div className="flex gap-2 max-w-lg">
                    <div className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center px-3">
                        <Search size={18} className="text-zinc-500 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar emisoras..."
                            className="bg-transparent border-none outline-none text-white text-sm w-full px-3 py-3 placeholder-zinc-500"
                        />
                        {searchQuery && (
                            <button onClick={clearSearch} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white shrink-0">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm active:scale-95 transition-all shrink-0"
                    >
                        {searching ? '...' : 'Buscar'}
                    </button>
                </div>
            </div>

            {/* ── Station Grid ─────────────────────────────── */}
            <div className="flex-1 overflow-auto px-6 pb-28">
                {/* Search Results */}
                {searchResults.length > 0 && (
                    <>
                        <h2 className="text-lg font-bold text-zinc-400 mb-3 mt-2">Resultados</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                            {searchResults.map((station, i) => (
                                <button
                                    key={`search-${i}`}
                                    onClick={() => playStation({
                                        name: station.name,
                                        genre: station.tags || 'Radio',
                                        country: station.countrycode,
                                        color: 'from-zinc-700 to-zinc-900',
                                        url: station.url_resolved,
                                        logo: station.favicon || '',
                                    })}
                                    className={`
                                        rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900
                                        border ${currentStation?.name === station.name ? 'border-blue-500' : 'border-white/10'}
                                        hover:border-white/30 p-4
                                        flex flex-col items-center justify-center gap-2
                                        hover:scale-[1.03] active:scale-[0.97] transition-all
                                        min-h-[100px]
                                    `}
                                >
                                    {station.favicon ? (
                                        <img src={station.favicon} alt={station.name} className="w-10 h-10 rounded-lg object-contain bg-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <Antenna size={24} className="text-white/80" />
                                    )}
                                    <div className="text-xs font-bold text-white text-center leading-tight line-clamp-2">{station.name}</div>
                                    <div className="text-[10px] text-zinc-400">{station.countrycode}</div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Favorites */}
                <h2 className="text-lg font-bold text-zinc-400 mb-3 mt-2">Favoritas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {stations.map((station, i) => (
                        <button
                            key={`fav-${i}`}
                            onClick={() => playStation(station)}
                            className={`
                                rounded-2xl bg-gradient-to-br ${station.color}
                                border ${currentStation?.name === station.name ? 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'border-white/10'}
                                hover:border-white/30 p-4
                                flex flex-col items-center justify-center gap-2
                                hover:scale-[1.03] active:scale-[0.97] transition-all
                                min-h-[100px]
                            `}
                        >
                            {station.logo ? (
                                <img src={station.logo} alt={station.name} className="w-12 h-12 rounded-lg object-contain bg-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                                <Radio size={24} className="text-white/80" />
                            )}
                            <div className="text-xs font-bold text-white text-center leading-tight">{station.name}</div>
                            <div className="text-[10px] text-zinc-400">{station.genre}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Playback Controls (fixed bottom) ─────────── */}
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 px-6 py-4 flex items-center gap-4 z-10">
                {/* Now playing info */}
                <div className="flex-1 min-w-0">
                    {currentStation ? (
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${currentStation.color || 'from-blue-600 to-blue-800'} flex items-center justify-center shrink-0 overflow-hidden`}>
                                {currentStation.logo ? (
                                    <img src={currentStation.logo} alt="" className={`w-full h-full object-contain p-1 ${isPlaying ? 'animate-pulse' : 'opacity-60'}`} />
                                ) : isPlaying ? (
                                    <Volume2 size={18} className="text-white animate-pulse" />
                                ) : (
                                    <Radio size={18} className="text-white/60" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-white truncate">{currentStation.name}</div>
                                <div className="text-xs text-zinc-400 truncate">{currentStation.genre}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-zinc-500">Selecciona una emisora</div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={togglePlayPause}
                        disabled={!currentStation}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90
                            ${currentStation
                                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            }`}
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={28} fill="currentColor" />
                        ) : (
                            <Play size={28} fill="currentColor" className="ml-1" />
                        )}
                    </button>
                    <button
                        onClick={stopPlayback}
                        disabled={!currentStation}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90
                            ${currentStation
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                                : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                            }`}
                    >
                        <Square size={22} fill="currentColor" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RadioPage;
