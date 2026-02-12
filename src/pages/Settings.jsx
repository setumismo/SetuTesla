import React from 'react';
import { Wifi, Bluetooth, Sun, Shield, Car } from 'lucide-react';

const Settings = () => {
    const categories = [
        { icon: Wifi, label: 'Conectividad', status: 'Conectado' },
        { icon: Bluetooth, label: 'Bluetooth', status: 'Activado' },
        { icon: Sun, label: 'Pantalla', status: 'Auto' },
        { icon: Shield, label: 'Seguridad', status: 'Estándar' },
        { icon: Car, label: 'Vehículo', status: 'Model Y' },
    ];

    return (
        <div className="h-full w-full p-8 flex gap-8">
            {/* Settings Sidebar */}
            <div className="w-1/3 bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden h-fit">
                {categories.map((item, index) => (
                    <div key={item.label} className={`p-6 flex items-center gap-4 cursor-pointer hover:bg-zinc-800 transition-colors ${index !== categories.length - 1 ? 'border-b border-zinc-800' : ''}`}>
                        <item.icon className="text-zinc-400" size={24} />
                        <div className="flex-1">
                            <div className="text-lg font-medium text-white">{item.label}</div>
                            <div className="text-sm text-zinc-500">{item.status}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Settings Content Area (Placeholder) */}
            <div className="flex-1 bg-zinc-900/30 rounded-3xl border border-zinc-800 p-8 flex items-center justify-center text-zinc-500">
                Selecciona una categoría para ajustar la configuración
            </div>
        </div>
    );
};

export default Settings;
