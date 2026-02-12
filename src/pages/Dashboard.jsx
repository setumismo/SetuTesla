import React, { useState, useEffect } from 'react';
import { CloudSun } from 'lucide-react';

const Dashboard = () => {
    const [time, setTime] = useState(new Date());

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

    return (
        <div className="h-full w-full p-8 flex flex-col gap-8">
            {/* Header / Greeting */}
            <h1 className="text-4xl font-bold text-white mb-4">Buenas Tardes</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Clock Widget */}
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center aspect-video">
                    <div className="text-8xl font-thin tracking-tighter text-white">
                        {formatTime(time)}
                    </div>
                    <div className="text-xl text-zinc-400 mt-2 capitalize">
                        {formatDate(time)}
                    </div>
                </div>

                {/* Weather Widget (Mock) */}
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center aspect-video relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CloudSun className="w-24 h-24 text-yellow-500 mb-4" />
                    <div className="text-6xl font-light">22°</div>
                    <div className="text-zinc-400 mt-2">Parcialmente Nublado</div>
                    <div className="text-sm text-zinc-500 mt-1">Max: 24° Min: 18°</div>
                </div>

                {/* Status / Car Info */}
                <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 flex flex-col justify-between aspect-video relative">
                    <h3 className="text-xl text-zinc-400">Model Y</h3>
                    <div className="flex items-end justify-between">
                        <div>
                            <div className="text-5xl font-bold text-green-500">284<span className="text-2xl ml-1">km</span></div>
                            <div className="text-sm text-zinc-500 mt-1">Autonomía</div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-bold">68%</div>
                            <div className="text-sm text-zinc-500 mt-1">Batería</div>
                        </div>
                    </div>
                    {/* Battery bar */}
                    <div className="w-full bg-zinc-800 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-green-500 h-full w-[68%]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
