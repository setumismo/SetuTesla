import React, { Suspense, lazy } from 'react';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Navigation from '../pages/Navigation';

const WebHub = lazy(() => import('../pages/WebHub'));
const Media = lazy(() => import('../pages/Media'));
const Settings = lazy(() => import('../pages/Settings'));
const RadioPage = lazy(() => import('../pages/RadioPage'));

const LoadingFallback = () => (
    <div className="h-full w-full bg-black flex items-center justify-center text-zinc-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
);

const Layout = ({ currentView, setView }) => {
    return (
        <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
            <Sidebar currentView={currentView} setView={setView} />
            <main className="flex-1 h-full overflow-hidden relative">
                <Suspense fallback={<LoadingFallback />}>
                    <div style={{ display: currentView === 'dashboard' ? 'block' : 'none' }} className="h-full w-full overflow-auto">
                        <Dashboard setView={setView} />
                    </div>
                    <div style={{ display: currentView === 'navigation' ? 'block' : 'none' }} className="h-full w-full">
                        <Navigation />
                    </div>
                    <div style={{ display: currentView === 'webhub' ? 'block' : 'none' }} className="h-full w-full">
                        <WebHub />
                    </div>
                    <div style={{ display: currentView === 'media' ? 'block' : 'none' }} className="h-full w-full">
                        <Media />
                    </div>
                    <div style={{ display: currentView === 'radio' ? 'block' : 'none' }} className="h-full w-full">
                        <RadioPage />
                    </div>
                    <div style={{ display: currentView === 'settings' ? 'block' : 'none' }} className="h-full w-full overflow-auto">
                        <Settings />
                    </div>
                </Suspense>
            </main>
        </div>
    );
};

export default Layout;
