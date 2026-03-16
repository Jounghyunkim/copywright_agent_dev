import React, { useState, useEffect } from 'react';
import { COLORS } from './styles/theme';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';

const HEALTH_CHECK_INTERVAL = 15000; // 15 seconds

function App() {
  const [view, setView] = useState('dashboard');
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) { setBackendConnected(false); return; }
        const data = await res.json();
        setBackendConnected(data.status === 'healthy');
      } catch {
        setBackendConnected(false);
      }
    };

    checkHealth();
    const id = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: COLORS.BG_GRAY,
      color: COLORS.TEXT_MAIN,
    },
  };

  return (
    <div style={styles.container}>
      <Header setView={setView} backendConnected={backendConnected} />
      {view === 'dashboard' ? <Dashboard setView={setView} /> : <Editor />}
    </div>
  );
}

export default App;
