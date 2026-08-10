import React, { useState } from 'react';
import Layout from './components/Layout';

function App() {
  // Default to 'navigation' (Navegador GPS estilo Google Maps / Tesla)
  const [currentView, setCurrentView] = useState('navigation');

  return (
    <Layout currentView={currentView} setView={setCurrentView} />
  );
}

export default App;
