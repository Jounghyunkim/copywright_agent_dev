import React, { useState } from 'react';
import { 
  MessageSquare, Send, Bot, User, Settings, 
  Globe, Users, Zap, FileText, CheckCircle, Search, HelpCircle 
} from 'lucide-react';

// LG Red Color Palette
const LG_RED = '#A50034';
const LG_DARK_GRAY = '#4A4A4A';
const LG_LIGHT_GRAY = '#F0F0F0';
const WHITE = '#FFFFFF';

function App() {
  const [step, setStep] = useState(1); // 1: Briefing, 2: Analysis, 3: Generation
  const [formData, setFormData] = useState({
    productName: '',
    country: 'USA',
    targetAge: '30-40',
    tone: 'Emotional',
    keyFeatures: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.group ? { name: e.group, value: e.value } : e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div style={{ 
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: LG_LIGHT_GRAY 
    }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: LG_RED, 
        color: WHITE, 
        padding: '0.8rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bot size={32} strokeWidth={2.5} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Copywrite Agent</h1>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Powered by GEEBIOH & Azure OpenAI</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4CAF50' }}></div>
            RAG Online
          </div>
          <Settings style={{ cursor: 'pointer', opacity: 0.9 }} size={20} />
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Briefing Form (Step 1) */}
        <aside style={{ 
          width: '400px', 
          backgroundColor: WHITE, 
          borderRight: '1px solid #ddd', 
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <FileText size={20} color={LG_RED} />
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: LG_DARK_GRAY }}>1. Campaign Briefing</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
              Product Name
              <input 
                type="text" 
                name="productName"
                placeholder="e.g. LG InstaView Refrigerator"
                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
              />
            </label>

            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
              <Globe size={14} style={{ display: 'inline', marginRight: '4px' }} /> Target Country
              <select name="country" style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="USA">United States (USA)</option>
                <option value="GER">Germany (GER)</option>
                <option value="IND">India (IND)</option>
                <option value="KOR">Korea (KOR)</option>
              </select>
            </label>

            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
              <Users size={14} style={{ display: 'inline', marginRight: '4px' }} /> Target Audience
              <select name="targetAge" style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="20-30">Gen Z (20-30)</option>
                <option value="30-45">Millennials (30-45)</option>
                <option value="45+">Generation X+ (45+)</option>
              </select>
            </label>

            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
              Tone & Manner
              <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                {['Emotional', 'Rational', 'Technical'].map(t => (
                  <button key={t} style={{ 
                    flex: 1, padding: '8px', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer',
                    backgroundColor: t === 'Emotional' ? LG_RED : '#eee',
                    color: t === 'Emotional' ? WHITE : '#333',
                    border: 'none'
                  }}>{t}</button>
                ))}
              </div>
            </label>

            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
              Key Features & Benefits
              <textarea 
                rows="4"
                placeholder="Describe product advantages..."
                style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'none' }}
              />
            </label>

            <button style={{ 
              backgroundColor: LG_RED, color: WHITE, padding: '12px', border: 'none', borderRadius: '6px', 
              fontWeight: 700, cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <Search size={18} /> Run Market Analyst
            </button>
          </div>
        </aside>

        {/* Center: Agent Workflow & Preview */}
        <main style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#F8F9FA'
        }}>
          {/* Status Tracker */}
          <div style={{ backgroundColor: WHITE, padding: '1rem 2rem', borderBottom: '1px solid #ddd', display: 'flex', gap: '3rem' }}>
            {[
              { id: 1, label: 'Briefing', icon: FileText, status: 'current' },
              { id: 2, label: 'Market Analysis', icon: Search, status: 'pending' },
              { id: 3, label: 'Copy Generation', icon: Zap, status: 'pending' },
              { id: 4, label: 'Brand Review', icon: CheckCircle, status: 'pending' }
            ].map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: s.status === 'pending' ? 0.4 : 1 }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: '50%', backgroundColor: s.status === 'current' ? LG_RED : '#ddd',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.status === 'current' ? WHITE : '#666'
                }}>
                  <s.icon size={18} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: s.status === 'current' ? 700 : 400, color: s.status === 'current' ? LG_RED : '#666' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Chat & Results Display */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '12px', maxWidth: '80%' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: LG_RED, display: 'flex', alignItems: 'center', justifyContent: 'center', color: WHITE }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ backgroundColor: WHITE, padding: '1rem', borderRadius: '0 15px 15px 15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: 0, color: LG_DARK_GRAY, lineHeight: 1.5 }}>
                    안녕하세요, 정현님! 캠페인 브리핑 정보를 입력해주세요.<br/>
                    <strong>국가별 정서와 LG 브랜드 가이드라인</strong>을 바탕으로 최고의 카피를 제안해 드릴게요. 🚀
                  </p>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px', marginLeft: '4px' }}>Just now</span>
              </div>
            </div>

            {/* Empty State / Hint */}
            <div style={{ 
              margin: 'auto', textAlign: 'center', color: '#bbb', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' 
            }}>
              <div style={{ padding: '20px', backgroundColor: '#eee', borderRadius: '50%' }}>
                <HelpCircle size={48} />
              </div>
              <p style={{ fontSize: '0.9rem' }}>좌측 브리핑 폼을 작성하고<br/>'Run Market Analyst'를 클릭하세요.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
