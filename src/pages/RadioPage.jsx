import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Search, X, Radio, Antenna, Volume2 } from 'lucide-react';

// ── Predefined favorite stations ────────────────────────────
// Logos via Google Favicon service (reliable, always correct)
const gLogo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const FAVORITES = [
    { name: 'LOS40', genre: 'Pop', country: 'ES', logo: gLogo('los40.com') },
    { name: 'LOS40 Classic', genre: 'Clásicos', country: 'ES', logo: gLogo('los40classic.com') },
    { name: 'Cadena SER', genre: 'Noticias', country: 'ES', logo: gLogo('cadenaser.com') },
    { name: 'Cadena COPE', genre: 'Noticias', country: 'ES', logo: gLogo('cope.es') },
    { name: 'Rock FM', genre: 'Rock', country: 'ES', logo: gLogo('rockfm.fm') },
    { name: 'Europa FM', genre: 'Pop/Dance', country: 'ES', logo: gLogo('europafm.com') },
    { name: 'Kiss FM', genre: 'Dance', country: 'ES', logo: gLogo('kissfm.es') },
    { name: 'Cadena Dial', genre: 'Español', country: 'ES', logo: gLogo('cadenadial.com') },
    { name: 'RAC1', genre: 'Catalunya', country: 'ES', logo: gLogo('rac1.cat') },
    { name: 'Flaixbac', genre: 'Catalunya', country: 'ES', logo: gLogo('flaixbac.cat') },
    { name: 'BBC Radio 1', genre: 'Pop/Rock', country: 'GB', logo: gLogo('bbc.co.uk') },
    { name: 'NRJ', genre: 'Electrónica', country: 'FR', logo: gLogo('nrj.fr') },
];

const RADIO_API = 'https://de1.api.radio-browser.info/json/stations';

async function resolveStation(stationName) {
    try {
        const res = await fetch(
            `${RADIO_API}/search?name=${encodeURIComponent(stationName)}&limit=5&order=votes&reverse=true`,
            { headers: { 'User-Agent': 'SetuTesla/1.0' } }
        );
        const data = await res.json();
        const match = data.find(s =>
            s.url_resolved && s.name.toLowerCase().includes(stationName.toLowerCase().split(' ')[0])
        ) || data[0];
        return {
            url: match?.url_resolved || '',
            logo: match?.favicon || '',
        };
    } catch (e) {
        console.error('Radio API error:', e);
        return { url: '', logo: '' };
    }
}

const RadioPage = () => {
    const audioRef = useRef(null);
    const [stations, setStations] = useState(FAVORITES.map(s => ({ ...s, url: '' })));
    const [currentStation, setCurrentStation] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // ── Resolve stream URLs on mount (logos are hardcoded) ───
    useEffect(() => {
        const resolveAll = async () => {
            const resolved = await Promise.all(
                FAVORITES.map(async (station) => {
                    const { url } = await resolveStation(station.name);
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
            const resolved = await resolveStation(station.name);
            streamUrl = resolved.url;
            if (!streamUrl) {
                setLoading(false);
                alert(`No se encontró stream para ${station.name}`);
                return;
            }
            station = { ...station, ...resolved };
        }

        setCurrentStation(station);
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

    // ── Logo Button component ───────────────────────────────
    const StationButton = ({ station, onClick, isActive }) => (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all hover:scale-105 active:scale-95
                ${isActive ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-white/5'}`}
        >
            <div className={`w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-zinc-800 shrink-0
                ${isActive && isPlaying ? 'ring-2 ring-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.4)]' : ''}`}>
                {station.logo ? (
                    <img
                        src={station.logo}
                        alt={station.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                ) : null}
                <div className={`w-full h-full items-center justify-center text-white/60 ${station.logo ? 'hidden' : 'flex'}`}>
                    <Radio size={28} />
                </div>
            </div>
            <span className="text-[11px] text-zinc-300 font-medium text-center leading-tight max-w-[80px] line-clamp-2">
                {station.name}
            </span>
        </button>
    );

    // ─────────────────────────────────────────────────────────
    return (
        <div className="h-full w-full bg-black flex flex-col overflow-hidden">
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
                        <div className="flex flex-wrap gap-4 mb-6">
                            {searchResults.map((station, i) => (
                                <StationButton
                                    key={`search-${i}`}
                                    station={{
                                        name: station.name,
                                        genre: station.tags || 'Radio',
                                        country: station.countrycode,
                                        url: station.url_resolved,
                                        logo: station.favicon || '',
                                    }}
                                    isActive={currentStation?.name === station.name}
                                    onClick={() => playStation({
                                        name: station.name,
                                        genre: station.tags || 'Radio',
                                        country: station.countrycode,
                                        url: station.url_resolved,
                                        logo: station.favicon || '',
                                    })}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Favorites */}
                <h2 className="text-lg font-bold text-zinc-400 mb-3 mt-2">Favoritas</h2>
                <div className="flex flex-wrap gap-4">
                    {stations.map((station, i) => (
                        <StationButton
                            key={`fav-${i}`}
                            station={station}
                            isActive={currentStation?.name === station.name}
                            onClick={() => playStation(station)}
                        />
                    ))}
                </div>
            </div>

            {/* ── Playback Controls (fixed bottom) ─────────── */}
            <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 px-6 py-4 flex items-center gap-4 z-10">
                <div className="flex-1 min-w-0">
                    {currentStation ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                                {currentStation.logo ? (
                                    <img src={currentStation.logo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Radio size={18} className={isPlaying ? 'text-white animate-pulse' : 'text-white/60'} />
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
