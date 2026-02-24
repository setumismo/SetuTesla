import React, { useState } from 'react';
import { Music, Radio, Headphones, Disc3, Server, ExternalLink, ArrowLeft, Antenna } from 'lucide-react';

const SERVICES = [
    {
        id: 'ytmusic',
        name: 'YouTube Music',
        description: 'Servicio oficial',
        url: 'https://music.youtube.com',
        icon: Radio,
        gradient: 'from-red-900 to-red-950',
        embed: false,
    },
    {
        id: 'spotify',
        name: 'Spotify',
        description: 'Streaming premium',
        url: 'https://open.spotify.com',
        icon: Disc3,
        gradient: 'from-green-900 to-green-950',
        embed: false,
    },
    {
        id: 'tidal',
        name: 'Tidal',
        description: 'Alta fidelidad',
        url: 'https://listen.tidal.com',
        icon: Music,
        gradient: 'from-zinc-800 to-black',
        embed: false,
    },
    {
        id: 'navidrome',
        name: 'Navidrome',
        description: 'Servidor personal',
        url: 'http://79.116.70.45:4533',
        icon: Server,
        gradient: 'from-blue-900 to-blue-950',
        embed: true,
    },
    {
        id: 'hyperpipe',
        name: 'Hyperpipe',
        description: 'YT alternativo',
        url: 'https://hyperpipe.surge.sh',
        icon: Headphones,
        gradient: 'from-purple-900 to-purple-950',
        embed: false,
    },
    {
        id: 'beatbump',
        name: 'Beatbump',
        description: 'Alternativo',
        url: 'https://beatbump.io',
        icon: Headphones,
        gradient: 'from-orange-900 to-orange-950',
        embed: false,
    },
];

const Media = () => {
    const [embeddedService, setEmbeddedService] = useState(null);

    const handleSelect = (service) => {
        if (service.embed) {
            setEmbeddedService(service);
        } else {
            window.open(service.url, '_blank');
        }
    };

    // ── Embedded iframe view ────────────────────────────────
    if (embeddedService) {
        return (
            <div className="h-full w-full relative bg-black overflow-hidden">
                <button
                    onClick={() => setEmbeddedService(null)}
                    className="absolute top-4 left-4 z-20 w-16 h-16 bg-black/80 backdrop-blur-xl border border-zinc-700 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-2xl"
                >
                    <ArrowLeft size={28} />
                </button>
                <div className="absolute top-5 left-24 z-20 px-4 py-2 bg-black/60 backdrop-blur-md border border-zinc-700 rounded-full">
                    <span className="text-sm text-zinc-300 font-medium">{embeddedService.name}</span>
                </div>
                <iframe
                    src={embeddedService.url}
                    title={embeddedService.name}
                    allow="autoplay; encrypted-media"
                    className="w-full h-full border-0"
                    style={{ background: '#000', colorScheme: 'dark' }}
                />
            </div>
        );
    }

    // ── Service selector ────────────────────────────────────
    return (
        <div className="h-full w-full p-8 bg-black overflow-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Música</h1>
            <p className="text-zinc-500 mb-6">
                Selecciona un servicio. El audio sigue sonando mientras navegas.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {SERVICES.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => handleSelect(service)}
                        className={`
                            aspect-square rounded-2xl bg-gradient-to-br ${service.gradient}
                            border border-white/10 hover:border-white/30
                            flex flex-col items-center justify-center gap-2
                            hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer
                            relative group overflow-hidden p-3
                        `}
                    >
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors rounded-2xl" />

                        <service.icon size={32} className="text-white/90 relative z-10" />
                        <div className="relative z-10 text-center">
                            <div className="text-xs font-bold text-white leading-tight">{service.name}</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-center gap-0.5">
                                {service.embed ? null : <ExternalLink size={8} />}
                                {service.description}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Media;
