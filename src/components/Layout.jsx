import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen w-screen bg-black text-white overflow-hidden">
            <Sidebar />
            <main className="flex-1 h-full overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
