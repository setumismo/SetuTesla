import React, { useState, useEffect, useRef } from 'react';
import { CloudSun, Navigation as NavigationIcon, Play, Pause, Square } from 'lucide-react';

// Quick-access radio stations for Dashboard
const RADIO_API = 'https://de1.api.radio-browser.info/json/stations';
const gLogo = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const DASHBOARD_RADIOS = [
    { name: 'LOS40', domain: 'los40.com' },
    { name: 'LOS40 Classic', domain: 'los40classic.com' },
    { name: 'Flaixbac', domain: 'flaixbac.cat' },
    { name: 'Kiss FM', domain: 'kissfm.es' },
];

const Dashboard = ({ setView }) => {
    const [time, setTime] = useState(new Date());
    const audioRef = useRef(null);
    const [playingRadio, setPlayingRadio] = useState(null);
    const [radioLoading, setRadioLoading] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const getGreeting = () => {
        const h = time.getHours();
        if (h < 7) return 'Buenas Noches';
        if (h < 13) return 'Buenos Días';
        if (h < 20) return 'Buenas Tardes';
        return 'Buenas Noches';
    };

    const playRadio = async (station) => {
        if (playingRadio === station.name) {
            // Toggle pause/play
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
                setPlayingRadio(null);
            } else if (audioRef.current) {
                audioRef.current.play();
                setPlayingRadio(station.name);
            }
            return;
        }

        setRadioLoading(station.name);
        try {
            const res = await fetch(
                `${RADIO_API}/search?name=${encodeURIComponent(station.name)}&limit=5&order=votes&reverse=true`,
                { headers: { 'User-Agent': 'SetuTesla/1.0' } }
            );
            const data = await res.json();
            const match = data.find(s =>
                s.url_resolved && s.name.toLowerCase().includes(station.name.toLowerCase().split(' ')[0])
            ) || data[0];

            if (match?.url_resolved && audioRef.current) {
                audioRef.current.src = match.url_resolved;
                await audioRef.current.play();
                setPlayingRadio(station.name);
            }
        } catch (e) {
            console.error('Radio error:', e);
        }
        setRadioLoading(null);
    };

    const stopRadio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            setPlayingRadio(null);
        }
    };

    return (
        <div className="h-full w-full p-6 flex flex-col gap-5 overflow-auto">
            <audio ref={audioRef} preload="none" />

            {/* Header / Greeting */}
            <h1 className="text-3xl font-bold text-white">{getGreeting()}</h1>

            {/* Clock + Weather – compact row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 px-6 py-5 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
                    <div className="text-5xl font-thin tracking-tighter text-white">
                        {formatTime(time)}
                    </div>
                    <div className="text-sm text-zinc-400 mt-1 capitalize">
                        {formatDate(time)}
                    </div>
                </div>

                <div className="bg-zinc-900/50 px-6 py-5 rounded-2xl border border-zinc-800 flex items-center justify-center gap-5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CloudSun className="w-14 h-14 text-yellow-500 shrink-0" />
                    <div className="flex flex-col items-center">
                        <div className="text-4xl font-light text-white">22°</div>
                        <div className="text-xs text-zinc-400 mt-0.5">Parcialmente Nublado</div>
                        <div className="text-[10px] text-zinc-500">Max: 24° Min: 18°</div>
                    </div>
                </div>
            </div>

            {/* Radio Quick Access */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-white">Radio</h2>
                    <div className="flex items-center gap-2">
                        {playingRadio && (
                            <button
                                onClick={stopRadio}
                                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white border border-zinc-700 transition-all active:scale-90"
                            >
                                <Square size={12} fill="currentColor" />
                            </button>
                        )}
                        <button
                            onClick={() => setView('radio')}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1"
                        >
                            Ver todas →
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {DASHBOARD_RADIOS.map((station) => {
                        const isActive = playingRadio === station.name;
                        const isLoading = radioLoading === station.name;
                        return (
                            <button
                                key={station.name}
                                onClick={() => playRadio(station)}
                                className={`bg-zinc-900/60 hover:bg-zinc-800 rounded-2xl border p-3 flex items-center gap-3 transition-all active:scale-[0.97]
                                    ${isActive ? 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'border-zinc-800 hover:border-zinc-600'}`}
                            >
                                <div className={`w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0
                                    ${isActive ? 'ring-2 ring-blue-400' : ''}`}>
                                    <img src={gLogo(station.domain)} alt={station.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{station.name}</div>
                                    {isActive && (
                                        <div className="text-[10px] text-blue-400 font-medium">▶ En directo</div>
                                    )}
                                </div>
                                {isLoading && (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <h2 className="text-lg font-bold text-white">Navegación Externa</h2>
            <div className="grid grid-cols-3 gap-4">
                <a
                    href="https://www.google.com/maps"
                    target="_blank"
                    className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-2xl flex items-center gap-3 transition-colors group border border-zinc-700 hover:border-blue-500"
                >
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-lg group-hover:scale-110 transition-transform shrink-0">
                        G
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-white">Google Maps</div>
                        <div className="text-xs text-zinc-400">Tráfico en tiempo real</div>
                    </div>
                </a>

                <button
                    onClick={() => setView('navigation')}
                    className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-2xl flex items-center gap-3 transition-colors group border border-zinc-700 hover:border-green-500 text-left"
                >
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform shrink-0">
                        <NavigationIcon size={22} fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-white">Navegación</div>
                        <div className="text-xs text-zinc-400">Navegación integrada</div>
                    </div>
                </button>

                <a
                    href="https://www.waze.com/live-map"
                    target="_blank"
                    className="bg-zinc-800 hover:bg-zinc-700 p-4 rounded-2xl flex items-center gap-3 transition-colors group border border-zinc-700 hover:border-cyan-400"
                >
                    <div className="w-12 h-12 rounded-full bg-cyan-400 flex items-center justify-center text-black text-lg font-bold shadow-lg group-hover:scale-110 transition-transform shrink-0">
                        W
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-white">Waze</div>
                        <div className="text-xs text-zinc-400">Avisos de comunidad</div>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default Dashboard;
