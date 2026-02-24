import React, { useState } from 'react';
import { Play, ArrowLeft, Music, Radio, Headphones } from 'lucide-react';

const SERVICES = [
    {
        id: 'hyperpipe',
        name: 'Hyperpipe',
        description: 'YouTube Music (sin anuncios)',
        url: 'https://hyperpipe.surge.sh',
        icon: Music,
        gradient: 'from-purple-900 to-purple-950',
        accent: 'border-purple-500',
    },
    {
        id: 'beatbump',
        name: 'Beatbump',
        description: 'Streaming alternativo',
        url: 'https://beatbump.io',
        icon: Headphones,
        gradient: 'from-orange-900 to-orange-950',
        accent: 'border-orange-500',
    },
    {
        id: 'ytmusic',
        name: 'YouTube Music',
        description: 'Servicio oficial',
        url: 'https://music.youtube.com',
        icon: Radio,
        gradient: 'from-red-900 to-red-950',
        accent: 'border-red-500',
    },
];

const Media = () => {
    const [activeService, setActiveService] = useState(null);

    const selectService = (service) => {
        setActiveService(service);
    };

    const goBack = () => {
        setActiveService(null);
    };

    // ── Fullscreen iframe view ──────────────────────────────
    if (activeService) {
        return (
            <div className="h-full w-full relative bg-black overflow-hidden">
                {/* Back button — large touch target */}
                <button
                    onClick={goBack}
                    className="absolute top-4 left-4 z-20 w-16 h-16 bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl"
                >
                    <ArrowLeft size={28} />
                </button>

                {/* Service name pill */}
                <div className="absolute top-5 left-24 z-20 px-4 py-2 bg-black/60 backdrop-blur-md border border-zinc-700 rounded-full">
                    <span className="text-sm text-zinc-300 font-medium">{activeService.name}</span>
                </div>

                {/* Iframe */}
                <iframe
                    src={activeService.url}
                    title={activeService.name}
                    allow="autoplay; encrypted-media"
                    className="w-full h-full border-0"
                    style={{
                        background: '#000',
                        colorScheme: 'dark',
                    }}
                />
            </div>
        );
    }

    // ── Service selector view ───────────────────────────────
    return (
        <div className="h-full w-full p-8 bg-black">
            <h1 className="text-3xl font-bold text-white mb-2">Música</h1>
            <p className="text-zinc-500 mb-8">Selecciona un servicio de streaming. La música seguirá sonando al cambiar de sección.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SERVICES.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => selectService(service)}
                        className={`
                            aspect-[4/3] rounded-3xl bg-gradient-to-br ${service.gradient}
                            border border-white/10 hover:${service.accent}
                            flex flex-col items-center justify-center gap-4
                            hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer
                            relative group overflow-hidden
                        `}
                    >
                        {/* Glow overlay */}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors rounded-3xl" />

                        <service.icon size={56} className="text-white/90 relative z-10" />
                        <div className="relative z-10 text-center">
                            <div className="text-2xl font-bold text-white">{service.name}</div>
                            <div className="text-sm text-zinc-400 mt-1">{service.description}</div>
                        </div>

                        {/* Play indicator */}
                        <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <Play size={28} fill="white" className="text-white ml-1" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Media;
