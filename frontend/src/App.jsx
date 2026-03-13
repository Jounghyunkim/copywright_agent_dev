import React from 'react';
import { MessageSquare, Send, Bot, User, Settings } from 'lucide-react';

// LG Red Color Palette
const LG_RED = '#A50034';
const LG_DARK_GRAY = '#4A4A4A';
const LG_LIGHT_GRAY = '#F0F0F0';

function App() {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: LG_LIGHT_GRAY 
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: LG_RED, 
        color: 'white', 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={28} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Copylight Agent</h1>
        </div>
        <Settings style={{ cursor: 'pointer' }} />
      </header>

      {/* Chat Area */}
      <main style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '2rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem' 
      }}>
        {/* Mock Messages */}
        <div style={{ alignSelf: 'flex-start', backgroundColor: 'white', padding: '1rem', borderRadius: '12px', maxWidth: '70%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0, color: LG_DARK_GRAY }}>안녕하세요, 정현님! Copylight Agent입니다. LG 레드 톤으로 깔끔하게 준비해봤습니다. 🚀</p>
        </div>
        <div style={{ alignSelf: 'flex-end', backgroundColor: LG_RED, color: 'white', padding: '1rem', borderRadius: '12px', maxWidth: '70%', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <p style={{ margin: 0 }}>오, 색감이 아주 마음에 드네! 프로젝트 기본 구조부터 잡아보자.</p>
        </div>
      </main>

      {/* Input Area */}
      <footer style={{ backgroundColor: 'white', padding: '1.5rem 2rem', borderTop: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
          <input 
            type="text" 
            placeholder="메시지를 입력하세요..." 
            style={{ 
              flex: 1, 
              padding: '0.8rem 1.2rem', 
              borderRadius: '25px', 
              border: `1px solid ${LG_RED}`, 
              outline: 'none' 
            }} 
          />
          <button style={{ 
            backgroundColor: LG_RED, 
            color: 'white', 
            border: 'none', 
            padding: '0.8rem 1.5rem', 
            borderRadius: '25px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Send size={18} />
            <span>전송</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
