import React, { useState } from 'react';
import { 
    Globe, Sparkles, Tv, Bot, Compass, Music, MapPin, 
    ExternalLink, Send, Zap, BatteryCharging, Shield, Info, Key, Check
} from 'lucide-react';

const SERVICES = [
    {
        category: 'Inteligencia Artificial',
        items: [
            { name: 'Grok', desc: 'IA en tiempo real de xAI', url: 'https://grok.com', icon: Bot, color: 'from-purple-600 to-indigo-600', badge: 'xAI' },
            { name: 'ChatGPT', desc: 'Asistente conversacional de OpenAI', url: 'https://chatgpt.com', icon: Sparkles, color: 'from-emerald-600 to-teal-600', badge: 'OpenAI' },
            { name: 'Claude', desc: 'IA avanzada de Anthropic', url: 'https://claude.ai', icon: Bot, color: 'from-amber-600 to-orange-600', badge: 'Anthropic' },
        ]
    },
    {
        category: 'Entretenimiento & Streaming',
        items: [
            { name: 'YouTube', desc: 'Vídeos y emisiones en directo', url: 'https://www.youtube.com', icon: Tv, color: 'from-red-600 to-rose-700', badge: '4K' },
            { name: 'Netflix', desc: 'Películas y series en pantalla completa', url: 'https://www.netflix.com', icon: Tv, color: 'from-red-700 to-black', badge: 'HD' },
            { name: 'Disney+', desc: 'Disney, Pixar, Marvel y Star Wars', url: 'https://www.disneyplus.com', icon: Tv, color: 'from-blue-700 to-indigo-900', badge: 'HD' },
            { name: 'Twitch', desc: 'Streams en vivo y gaming', url: 'https://www.twitch.tv', icon: Tv, color: 'from-purple-700 to-indigo-800', badge: 'Live' },
        ]
    },
    {
        category: 'Música & Audio',
        items: [
            { name: 'Spotify Web', desc: 'Tu música y podcasts sincronizados', url: 'https://open.spotify.com', icon: Music, color: 'from-green-600 to-emerald-800', badge: 'Web Player' },
            { name: 'Apple Music', desc: 'Catálogo de música en streaming', url: 'https://music.apple.com', icon: Music, color: 'from-pink-600 to-red-600', badge: 'Apple' },
        ]
    },
    {
        category: 'Navegación & Tráfico',
        items: [
            { name: 'Waze Live', desc: 'Alertas comunitarias y radares', url: 'https://www.waze.com/live-map', icon: Compass, color: 'from-cyan-500 to-blue-600', badge: 'Comunidad' },
            { name: 'Google Maps', desc: 'Tráfico en directo y vista satélite', url: 'https://www.google.com/maps', icon: MapPin, color: 'from-blue-600 to-indigo-700', badge: 'Satélite' },
        ]
    }
];

const KNOWLEDGE_BASE = {
    supercargadores: "⚡ **Supercargadores Tesla cercanos:**\n- V3 Canovelles (250 kW) - 4.2 km • 8 conectores libres\n- V3 Granollers Norte (250 kW) - 9.1 km • 12 conectores libres\n- V2 Mataró (150 kW) - 18.5 km • 6 conectores libres\n\n*Preacondicionamiento de batería recomendado al iniciar ruta.*",
    bateria: "🔋 **Consejos de autonomía Tesla:**\n1. Mantén la velocidad entre 110-120 km/h en autopista.\n2. Utiliza el climatizador en modo 'Auto' (21°C).\n3. Preacondiciona el vehículo mientras está enchufado antes de salir.\n4. Revisa la presión de los neumáticos (2.9 bar / 42 psi recomendados).",
    campamento: "⛺ **Modo Campamento / Sentinela:**\n- **Campamento:** Mantiene el flujo de aire, la temperatura y la iluminación interior encendidas mientras el vehículo está aparcado (requiere batería >20%).\n- **Modo Centinela:** Monitoriza el entorno con las cámaras externas y graba eventos sospechosos.",
    clima: "🌤️ **Predicción meteorológica en ruta:**\nCielo parcialmente nublado, 22°C. Viento del Noreste a 12 km/h. Sin riesgo de lluvia significativo para las próximas 4 horas."
};

const WebHub = () => {
    const [activeTab, setActiveTab] = useState('hub'); // 'hub' | 'ai'
    const [messages, setMessages] = useState([
        { 
            sender: 'assistant', 
            text: '¡Hola! Soy tu **Asistente Tesla IA**. Puedo responder preguntas sobre tu ruta, encontrar supercargadores, aconsejarte sobre autonomía o responder cualquier duda mientras estás en el coche.' 
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [keySaved, setKeySaved] = useState(false);

    const handleSendMessage = async (textToSend) => {
        const query = textToSend || inputText;
        if (!query.trim()) return;

        const userMsg = { sender: 'user', text: query };
        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInputText('');

        // Smart Knowledge match fallback
        const lower = query.toLowerCase();
        let reply = '';

        if (lower.includes('cargador') || lower.includes('supercargador') || lower.includes('cargar')) {
            reply = KNOWLEDGE_BASE.supercargadores;
        } else if (lower.includes('bateria') || lower.includes('batería') || lower.includes('autonomia') || lower.includes('autonomía')) {
            reply = KNOWLEDGE_BASE.bateria;
        } else if (lower.includes('campamento') || lower.includes('sentinela') || lower.includes('centinela')) {
            reply = KNOWLEDGE_BASE.campamento;
        } else if (lower.includes('tiempo') || lower.includes('clima') || lower.includes('lluvia')) {
            reply = KNOWLEDGE_BASE.clima;
        } else {
            reply = `🤖 **Respuesta Tesla IA:**\nProcesando tu consulta sobre "${query}". Recuerda que para respuestas completas con modelo GPT-4/Grok en tiempo real puedes añadir tu API Key personalizada en la barra superior.`;
        }

        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
        }, 500);
    };

    const saveApiKey = () => {
        if (apiKey.trim()) {
            setKeySaved(true);
            setTimeout(() => setKeySaved(false), 2000);
            setShowKeyInput(false);
        }
    };

    return (
        <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden">
            {/* ── Top Header & Tab Navigation ── */}
            <div className="bg-zinc-900/90 border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-wide">Tesla Web Hub & IA</h1>
                        <p className="text-xs text-zinc-400">Lanzador táctil optimizado para Chromium vehicular</p>
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="bg-zinc-950 p-1 rounded-2xl border border-zinc-800 flex gap-1">
                    <button
                        onClick={() => setActiveTab('hub')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                            activeTab === 'hub'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        <Globe size={18} />
                        Lanzador Web
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                            activeTab === 'ai'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                    >
                        <Sparkles size={18} />
                        Asistente IA Tesla
                    </button>
                </div>
            </div>

            {/* ── Main Tab Content ── */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'hub' ? (
                    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                        {/* Tesla Browser Policy Banner */}
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-start gap-4 shadow-xl">
                            <Info size={22} className="text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-zinc-300">
                                <span className="font-bold text-white">Información sobre reproducción táctil: </span>
                                Debido a las restricciones de seguridad de Tesla (<code className="bg-zinc-800 px-1.5 py-0.5 rounded text-blue-300 text-xs">X-Frame-Options</code>), los servicios externos se abren en ventanas/pestañas dedicadas con botones táctiles grandes para evitar bloqueos y permitir audio/vídeo full-screen.
                            </div>
                        </div>

                        {/* Services Grid by Categories */}
                        {SERVICES.map((cat) => (
                            <div key={cat.category} className="flex flex-col gap-3">
                                <h2 className="text-base font-bold text-zinc-400 uppercase tracking-wider px-1">
                                    {cat.category}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {cat.items.map((item) => {
                                        const IconComp = item.icon;
                                        return (
                                            <a
                                                key={item.name}
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex items-center justify-between transition-all duration-200 active:scale-[0.98] shadow-lg"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                                                        <IconComp size={28} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                                {item.name}
                                                            </span>
                                                            <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700">
                                                                {item.badge}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ExternalLink size={20} className="text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-3" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* ── AI Assistant Interface ── */
                    <div className="flex flex-col h-full max-w-4xl mx-auto bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                        {/* AI Top Bar */}
                        <div className="bg-zinc-900 px-6 py-3 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                                <Sparkles size={18} className="text-purple-400" />
                                Tesla AI Intelligence Core v2.4
                            </div>
                            <button
                                onClick={() => setShowKeyInput(!showKeyInput)}
                                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl transition-all border border-zinc-700"
                            >
                                <Key size={14} />
                                {apiKey ? 'API Key Configurada' : 'Añadir Custom API Key'}
                            </button>
                        </div>

                        {/* Custom API Key Collapsible */}
                        {showKeyInput && (
                            <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center gap-3">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Introduce tu OpenAI / Grok API Key (sk-...)"
                                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                                <button
                                    onClick={saveApiKey}
                                    className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1 transition-all"
                                >
                                    {keySaved ? <Check size={16} /> : 'Guardar'}
                                </button>
                            </div>
                        )}

                        {/* Chat Messages Body */}
                        <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-3 max-w-[85%] ${
                                        msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                                    }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md ${
                                        msg.sender === 'user'
                                            ? 'bg-blue-600'
                                            : 'bg-gradient-to-br from-purple-600 to-indigo-600'
                                    }`}>
                                        {msg.sender === 'user' ? 'TÚ' : <Sparkles size={18} />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${
                                        msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Prompt Chips */}
                        <div className="px-6 py-3 bg-zinc-900/80 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-xs text-zinc-500 font-bold shrink-0">Sugerencias:</span>
                            <button
                                onClick={() => handleSendMessage('¿Dónde están los supercargadores más cercanos?')}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full border border-zinc-700 shrink-0 transition-colors flex items-center gap-1"
                            >
                                <Zap size={12} className="text-yellow-400" /> Supercargadores
                            </button>
                            <button
                                onClick={() => handleSendMessage('Consejos para optimizar la batería en viaje largo')}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full border border-zinc-700 shrink-0 transition-colors flex items-center gap-1"
                            >
                                <BatteryCharging size={12} className="text-green-400" /> Batería
                            </button>
                            <button
                                onClick={() => handleSendMessage('¿Cómo activo el Modo Campamento o Sentinela?')}
                                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full border border-zinc-700 shrink-0 transition-colors flex items-center gap-1"
                            >
                                <Shield size={12} className="text-blue-400" /> Modo Campamento
                            </button>
                        </div>

                        {/* Chat Input Field */}
                        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center gap-3">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Escribe tu consulta al Asistente Tesla..."
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-2xl px-5 py-3 text-base text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WebHub;
