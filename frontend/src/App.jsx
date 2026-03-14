import React, { useState } from 'react';
import { COLORS } from './styles/theme';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'editor'

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
      <Header setView={setView} />
      {view === 'dashboard' ? <Dashboard setView={setView} /> : <Editor />}
    </div>
  );
}

export default App;
