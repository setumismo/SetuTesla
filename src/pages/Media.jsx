import React from 'react';
import { Music, Radio, Headphones, Disc3, Server, ExternalLink } from 'lucide-react';

const SERVICES = [
    {
        id: 'ytmusic',
        name: 'YouTube Music',
        description: 'Servicio oficial de Google',
        url: 'https://music.youtube.com',
        icon: Radio,
        gradient: 'from-red-900 to-red-950',
    },
    {
        id: 'spotify',
        name: 'Spotify',
        description: 'Streaming premium',
        url: 'https://open.spotify.com',
        icon: Disc3,
        gradient: 'from-green-900 to-green-950',
    },
    {
        id: 'tidal',
        name: 'Tidal',
        description: 'Audio de alta fidelidad',
        url: 'https://listen.tidal.com',
        icon: Music,
        gradient: 'from-zinc-800 to-black',
    },
    {
        id: 'navidrome',
        name: 'Navidrome',
        description: 'Servidor personal',
        url: 'http://79.116.70.45:4533',
        icon: Server,
        gradient: 'from-blue-900 to-blue-950',
    },
    {
        id: 'hyperpipe',
        name: 'Hyperpipe',
        description: 'YouTube Music alternativo',
        url: 'https://hyperpipe.surge.sh',
        icon: Headphones,
        gradient: 'from-purple-900 to-purple-950',
    },
    {
        id: 'beatbump',
        name: 'Beatbump',
        description: 'Streaming alternativo',
        url: 'https://beatbump.io',
        icon: Headphones,
        gradient: 'from-orange-900 to-orange-950',
    },
];

const Media = () => {
    return (
        <div className="h-full w-full p-8 bg-black overflow-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Música</h1>
            <p className="text-zinc-500 mb-6">
                Se abrirán en nueva pestaña. El audio sigue sonando mientras navegas.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {SERVICES.map((service) => (
                    <a
                        key={service.id}
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                            aspect-square rounded-2xl bg-gradient-to-br ${service.gradient}
                            border border-white/10 hover:border-white/30
                            flex flex-col items-center justify-center gap-3
                            hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer
                            relative group overflow-hidden no-underline p-4
                        `}
                    >
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors rounded-2xl" />

                        <service.icon size={36} className="text-white/90 relative z-10" />
                        <div className="relative z-10 text-center">
                            <div className="text-sm font-bold text-white leading-tight">{service.name}</div>
                            <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-center gap-1">
                                <ExternalLink size={10} />
                                {service.description}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default Media;
