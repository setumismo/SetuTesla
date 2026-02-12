import React from 'react';
import { Play } from 'lucide-react';

const Media = () => {
    const services = [
        { name: 'Spotify', url: 'https://open.spotify.com', color: 'from-green-900 to-green-950', logo: 'Spotify' },
        { name: 'YouTube Music', url: 'https://music.youtube.com', color: 'from-red-900 to-red-950', logo: 'YT Music' },
        { name: 'Tidal', url: 'https://listen.tidal.com', color: 'from-gray-900 to-black', logo: 'TIDAL' },
    ];

    return (
        <div className="h-full w-full p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Fuentes de Audio</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                    <a
                        key={service.name}
                        href={service.url}
                        className={`
                            aspect-square rounded-3xl bg-gradient-to-br ${service.color} 
                            border border-white/10 flex flex-col items-center justify-center
                            hover:scale-[1.02] transition-transform cursor-pointer relative group
                        `}
                    >
                        <div className="text-4xl font-bold text-white mb-4">{service.logo}</div>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors rounded-3xl" />
                        <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300 shadow-xl">
                            <Play fill="currentColor" className="ml-1" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default Media;
