import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Search, Navigation as NavigationIcon, Locate } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to recenter map when position changes
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15);
        }
    }, [position, map]);
    return null;
}

const Navigation = () => {
    const [position, setPosition] = useState([41.6208, 2.2803]); // Default to Canovelles
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Get current location on mount
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => {
                    console.error("Geolocation denied or error:", err);
                }
            );
        }
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;

        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setPosition([parseFloat(lat), parseFloat(lon)]);
            } else {
                console.log("No results found");
                // Optional: visuals for no results
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocateMe = () => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setLoading(false);
                },
                () => setLoading(false)
            );
        } else {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full relative bg-zinc-900 overflow-hidden">
            <MapContainer
                center={position}
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                zoomControl={false}
            >
                {/* Dark Matter Tile Layer for Tesla aesthetic */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={position}>
                    <Popup>
                        Ubicación del Vehículo
                    </Popup>
                </Marker>
                <RecenterMap position={position} />
            </MapContainer>

            {/* Search Bar Overlay */}
            <div className="absolute top-6 left-6 right-6 max-w-lg z-[1000]">
                <form onSubmit={handleSearch} className="bg-black/80 backdrop-blur-md border border-zinc-700 rounded-full flex items-center p-2 shadow-2xl">
                    <div className="w-10 h-10 flex items-center justify-center text-zinc-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Navegar a..."
                        className="bg-transparent border-none outline-none text-white text-lg w-full px-2 placeholder-zinc-500 font-medium"
                    />
                    <button type="submit" className="w-10 h-10 flex items-center justify-center text-blue-500 hover:text-blue-400 transition-colors">
                        <NavigationIcon size={20} fill="currentColor" />
                    </button>
                </form>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-[1000]">
                <button
                    onClick={handleLocateMe}
                    className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 shadow-xl border border-zinc-700 active:scale-95 transition-all"
                >
                    <Locate size={28} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        </div>
    );
};

export default Navigation;
