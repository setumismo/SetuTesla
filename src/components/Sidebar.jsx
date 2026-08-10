import React from 'react';
import { LayoutDashboard, Map, Globe, Music, Radio, Settings } from 'lucide-react';

const Sidebar = ({ currentView, setView }) => {
    const navItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
        { id: 'navigation', icon: Map, label: 'Navegación' },
        { id: 'webhub', icon: Globe, label: 'Web & IA' },
        { id: 'media', icon: Music, label: 'Música' },
        { id: 'radio', icon: Radio, label: 'Radio' },
        { id: 'settings', icon: Settings, label: 'Ajustes' },
    ];

    return (
        <nav className="h-screen w-24 bg-zinc-900 flex flex-col items-center py-6 border-r border-zinc-800 z-50 shrink-0 select-none">
            <div className="flex flex-col gap-5 w-full px-2">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            title={item.label}
                            className={`flex flex-col items-center justify-center w-full aspect-square rounded-full transition-all duration-200 active:scale-90
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={28} strokeWidth={2} />
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto">
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white border border-zinc-700 transition-colors">
                    <span className="font-bold text-[10px] tracking-widest">TESLA</span>
                </div>
            </div>
        </nav>
    );
};

export default Sidebar;
