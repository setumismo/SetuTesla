import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Music, Settings, Radio } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { to: "/", icon: LayoutDashboard, label: "Panel" },
        { to: "/navigation", icon: Map, label: "Navegación" },
        { to: "/media", icon: Music, label: "Música" },
        { to: "/settings", icon: Settings, label: "Ajustes" },
    ];

    return (
        <nav className="h-screen w-24 bg-zinc-900 flex flex-col items-center py-6 border-r border-zinc-800 z-50">
            <div className="flex flex-col gap-6 w-full px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full aspect-square rounded-full transition-all duration-200
              ${isActive
                                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={32} strokeWidth={2} />
                        {/* Label is hidden for minimalist look, or can be very small */}
                    </NavLink>
                ))}
            </div>

            <div className="mt-auto">
                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                    {/* Tesla Logo placeholder or Vehicle Status */}
                    <span className="font-bold text-xs">TESLA</span>
                </div>
            </div>
        </nav>
    );
};

export default Sidebar;
