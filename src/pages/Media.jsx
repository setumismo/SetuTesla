import React from 'react';
import { Music, Radio, Headphones, ExternalLink } from 'lucide-react';

const SERVICES = [
    {
        id: 'hyperpipe',
        name: 'Hyperpipe',
        description: 'YouTube Music sin anuncios',
        url: 'https://hyperpipe.surge.sh',
        icon: Music,
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
    {
        id: 'ytmusic',
        name: 'YouTube Music',
        description: 'Servicio oficial de Google',
        url: 'https://music.youtube.com',
        icon: Radio,
        gradient: 'from-red-900 to-red-950',
    },
];

const Media = () => {
    return (
        <div className="h-full w-full p-8 bg-black">
            <h1 className="text-3xl font-bold text-white mb-2">Música</h1>
            <p className="text-zinc-500 mb-8">
                Se abrirán en una nueva pestaña. El audio seguirá sonando mientras usas la navegación.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SERVICES.map((service) => (
                    <a
                        key={service.id}
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                            aspect-[4/3] rounded-3xl bg-gradient-to-br ${service.gradient}
                            border border-white/10 hover:border-white/30
                            flex flex-col items-center justify-center gap-4
                            hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer
                            relative group overflow-hidden no-underline
                        `}
                    >
                        {/* Glow overlay */}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors rounded-3xl" />

                        <service.icon size={56} className="text-white/90 relative z-10" />
                        <div className="relative z-10 text-center">
                            <div className="text-2xl font-bold text-white">{service.name}</div>
                            <div className="text-sm text-zinc-400 mt-1 flex items-center justify-center gap-1">
                                <ExternalLink size={14} />
                                {service.description}
                            </div>
                        </div>

                        {/* Open indicator */}
                        <div className="relative z-10 px-6 py-3 rounded-full bg-white/10 backdrop-blur flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                            <ExternalLink size={18} className="text-white" />
                            <span className="text-white font-medium text-sm">Abrir</span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default Media;
