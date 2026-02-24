import React, { useState } from 'react';
import Layout from './components/Layout';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <Layout currentView={currentView} setView={setCurrentView} />
  );
}

export default App;
