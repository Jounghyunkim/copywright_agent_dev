import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Search, Zap, MessageSquareText, ClipboardCheck,
  FileText, Globe, Shield, Puzzle, BarChart3, ChevronRight,
  Sparkles, CheckCircle, Users,
} from 'lucide-react'

/* ─── Data ─── */
const WORKFLOW_STEPS = [
  { num: 1, label: 'Briefing', desc: '캠페인 브리프를 작성하거나 AI가 자동으로 생성합니다.', icon: FileText, color: '#A50034' },
  { num: 2, label: 'Analysis', desc: '웹 검색 + RAG를 통해 10개 항목의 시장 분석 리포트를 생성합니다.', icon: Search, color: '#2563EB' },
  { num: 3, label: 'Strategic Message', desc: '감성/행동 기반 전략 메시지를 추출하고 마케터가 승인합니다.', icon: MessageSquareText, color: '#7C3AED' },
  { num: 4, label: 'Generation', desc: '국가/페르소나별로 최적화된 카피 변형을 생성합니다.', icon: Zap, color: '#D97706' },
  { num: 5, label: 'Review', desc: 'Builtin + Custom Skill로 카피 품질을 자동 검증합니다.', icon: ClipboardCheck, color: '#059669' },
]

const FEATURES = [
  { icon: Globe, color: '#2563EB', title: 'Localization-Centric', desc: '단순 번역이 아닌 국가별 소비자 감성, 문화적 뉘앙스, 언어적 스타일을 반영한 최적화된 카피 생성' },
  { icon: Users, color: '#7C3AED', title: 'Human-in-the-Loop', desc: 'AI 자동화 워크플로우 중간에 마케터의 참여와 승인 단계를 배치하여 사람과 AI의 협업 실현' },
  { icon: Sparkles, color: '#D97706', title: 'Multi-Agent Pipeline', desc: 'LangGraph 기반 query_planner → web_search ∥ RAG → synthesizer 파이프라인으로 깊이 있는 분석' },
  { icon: Shield, color: '#059669', title: 'Skill-based Review', desc: 'AI Washing, 브랜드 용어, 문화적 민감성 등 6개 빌트인 + 사용자 정의 Custom Skill로 품질 보장' },
]

const TECH_STACK = [
  { label: 'Frontend', items: 'React 18 · Vite · TypeScript · TanStack Query · Zustand' },
  { label: 'Backend', items: 'FastAPI · LangGraph · LangChain' },
  { label: 'AI / LLM', items: 'Azure OpenAI · Tavily Search · FAISS RAG' },
  { label: 'Infra', items: 'PostgreSQL · SSE Streaming · uv' },
]

const BUILTIN_SKILLS = [
  { name: 'AI Washing Risk Check', desc: 'AI 관련 과장/오해 소지 표현 감지', icon: Shield },
  { name: 'Brand Lexicon Check', desc: 'LG 브랜드 용어 가이드라인 준수 검증', icon: CheckCircle },
  { name: 'Cultural Sensitivity', desc: '문화적 민감성 및 현지화 적합성 검증', icon: Globe },
  { name: 'Tone Consistency Guard', desc: '톤 앤 매너 일관성 유지 검증', icon: MessageSquareText },
  { name: 'Channel Variant Generator', desc: '채널별 카피 변형 생성', icon: Zap },
  { name: 'Brief Normalizer', desc: '브리프 항목 표준화 및 일관성 검증', icon: FileText },
]

/* ─── Page ─── */
export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>

      {/* ═══════════ Hero ═══════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #A50034 0%, #7a0028 40%, #2D2D2D 100%)',
        color: '#fff',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '56px 48px 64px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
            borderRadius: 100, padding: '6px 16px 6px 10px', marginBottom: 24,
            fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <Sparkles size={14} />
            AI-Powered Copywriting Platform for LG
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, lineHeight: 1.2,
            margin: '0 0 20px', letterSpacing: '-0.03em',
          }}>
            기술의 가치를 고객의 언어로 번역합니다
          </h1>

          <p style={{
            fontSize: '1rem', lineHeight: 1.7, opacity: 0.8,
            margin: '0 0 32px', maxWidth: 560,
          }}>
            캠페인 브리프부터 시장 분석, 전략 메시지, 카피 생성, 품질 검증까지.<br />
            AI Native Workflow를 통해 각국 법인의 마케팅 카피를 완성하고 검수하세요.
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate('/new')}
              style={{
                background: '#fff', color: '#A50034', border: 'none',
                borderRadius: 10, padding: '12px 28px', fontWeight: 800,
                fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              New Campaign <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10,
                padding: '12px 24px', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            >
              Dashboard
            </button>
          </div>

          {/* Stat cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
            marginTop: 48, maxWidth: 500,
          }}>
            {[
              { val: '5-Step', label: 'End-to-End Workflow' },
              { val: '6+', label: 'Builtin Review Skills' },
              { val: '12+', label: 'Target Countries' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '16px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 2 }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Workflow ═══════════ */}
      <section style={{ padding: '64px 48px' }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{
            display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: '#A50034',
            background: '#FFF0F3', borderRadius: 100, padding: '5px 14px', marginBottom: 14,
          }}>
            WORKFLOW
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
            5단계 AI 카피라이팅 파이프라인
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            브리프 작성부터 최종 검증까지, AI와 마케터가 함께 완성하는 워크플로우
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 33, top: 36, bottom: 36, width: 2,
            background: 'linear-gradient(180deg, #A50034, #2563EB, #7C3AED, #D97706, #059669)',
            borderRadius: 1, opacity: 0.2,
          }} />

          {WORKFLOW_STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} style={{
                display: 'flex', gap: 22, alignItems: 'flex-start',
                padding: '20px 0', position: 'relative',
              }}>
                <div style={{
                  width: 68, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flexShrink: 0, position: 'relative', zIndex: 1,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: step.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 6px 20px ${step.color}33`,
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{
                    marginTop: 6, fontSize: '0.62rem', fontWeight: 800,
                    color: step.color, background: `${step.color}10`,
                    padding: '2px 8px', borderRadius: 100,
                  }}>
                    STEP {step.num}
                  </span>
                </div>
                <div style={{
                  flex: 1, background: 'var(--color-surface)', borderRadius: 14,
                  border: '1px solid var(--color-border)', padding: '20px 24px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    {step.label}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════ Features ═══════════ */}
      <section style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)',
        padding: '64px 48px',
      }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{
            display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: '#2563EB',
            background: '#EFF6FF', borderRadius: 100, padding: '5px 14px', marginBottom: 14,
          }}>
            CORE PRINCIPLES
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
            설계 철학
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} style={{
                background: 'var(--color-bg)', borderRadius: 16, padding: '28px 24px',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `${f.color}12`, color: f.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {f.title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════ Skills ═══════════ */}
      <section style={{ padding: '64px 48px' }}>
        <div style={{ marginBottom: 48 }}>
          <span style={{
            display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: '#059669',
            background: '#F0FDF4', borderRadius: 100, padding: '5px 14px', marginBottom: 14,
          }}>
            SKILL ENGINE
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
            Builtin Review Skills
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
            6개 빌트인 스킬로 카피 품질을 자동 검증하고, Custom Skill을 직접 만들어 확장할 수 있습니다
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {BUILTIN_SKILLS.map((skill, i) => {
            const Icon = skill.icon
            return (
              <div key={i} style={{
                background: 'var(--color-surface)', borderRadius: 14,
                border: '1px solid var(--color-border)', padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#F0FDF4', color: '#059669',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text)' }}>{skill.name}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {skill.desc}
                </p>
              </div>
            )
          })}
        </div>

        {/* Custom skill callout */}
        <div style={{
          marginTop: 24, background: 'linear-gradient(135deg, #7C3AED08, #A5003408)',
          borderRadius: 16, border: '1px solid var(--color-border)',
          padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Puzzle size={24} color="#7C3AED" />
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Custom Skill Authoring
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                Purpose와 Goal만 입력하면 AI가 스킬을 자동 생성합니다. Markdown 파일로 저장되어 직접 편집도 가능합니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/settings?tab=skill-builder')}
            style={{
              background: 'none', border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '8px 18px', fontWeight: 700,
              fontSize: '0.78rem', color: '#7C3AED', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#7C3AED' }}
          >
            Try It <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* ═══════════ Tech Stack ═══════════ */}
      <section style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)',
        padding: '56px 48px',
      }}>
        <div style={{ marginBottom: 36 }}>
          <span style={{
            display: 'inline-block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)',
            background: 'var(--color-bg-secondary)', borderRadius: 100, padding: '5px 14px', marginBottom: 14,
          }}>
            TECH STACK
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
            Architecture
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {TECH_STACK.map((t, i) => (
            <div key={i} style={{
              background: 'var(--color-bg)', borderRadius: 12,
              border: '1px solid var(--color-border)', padding: '20px 16px',
            }}>
              <div style={{
                fontSize: '0.68rem', fontWeight: 800, color: '#A50034', letterSpacing: '0.05em',
                textTransform: 'uppercase' as const, marginBottom: 10,
              }}>
                {t.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, fontWeight: 500 }}>
                {t.items}
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline diagram */}
        <div style={{
          marginTop: 28, background: 'var(--color-bg)', borderRadius: 14,
          border: '1px solid var(--color-border)', padding: '24px',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 14, letterSpacing: '0.05em' }}>
            LANGGRAPH PIPELINE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {['query_planner', 'web_search ∥ enhanced_rag', 'synthesizer', 'END'].map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  background: i === 3 ? '#059669' : '#A50034',
                  color: '#fff', borderRadius: 8, padding: '8px 16px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
                  boxShadow: `0 4px 12px ${i === 3 ? '#05966933' : '#A5003433'}`,
                }}>
                  {node}
                </div>
                {i < 3 && <ArrowRight size={16} color="var(--color-text-muted)" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #A50034, #7a0028)',
        color: '#fff', padding: '56px 48px',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          지금 시작하세요
        </h2>
        <p style={{ fontSize: '0.92rem', opacity: 0.85, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 500 }}>
          AI와 함께 글로벌 마케팅 캠페인을 기획하고, 브랜드 가치를 담은 카피를 만들어 보세요.
        </p>
        <button
          onClick={() => navigate('/new')}
          style={{
            background: '#fff', color: '#A50034', border: 'none',
            borderRadius: 10, padding: '14px 36px', fontWeight: 800,
            fontSize: '0.92rem', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <BarChart3 size={18} /> Start New Campaign <ArrowRight size={16} />
        </button>
      </section>

    </div>
  )
}
