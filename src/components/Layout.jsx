import React from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Navigation from '../pages/Navigation';
import Media from '../pages/Media';
import Settings from '../pages/Settings';

const Layout = ({ currentView, setView }) => {
    return (
        <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
            <Sidebar currentView={currentView} setView={setView} />
            <main className="flex-1 h-full overflow-hidden relative">
                {/* All views rendered simultaneously — hidden via CSS so iframes persist */}
                <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }} className="h-full w-full overflow-auto">
                    <Dashboard setView={setView} />
                </div>
                <div style={{ display: currentView === 'navigation' ? 'block' : 'none' }} className="h-full w-full">
                    <Navigation />
                </div>
                <div style={{ display: currentView === 'media' ? 'block' : 'none' }} className="h-full w-full">
                    <Media />
                </div>
                <div style={{ display: currentView === 'settings' ? 'block' : 'none' }} className="h-full w-full overflow-auto">
                    <Settings />
                </div>
            </main>
        </div>
    );
};

export default Layout;
