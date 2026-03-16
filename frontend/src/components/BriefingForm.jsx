import React, { useState } from 'react';
import { ArrowRight, Loader, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { COLORS } from '../styles/theme';

const TODAY = new Date().toISOString().slice(0, 10);

const INITIAL_FORM = {
  projectName: '',
  date: TODAY,
  projectContext: '',
  objectiveCommercial: '',
  objectiveBehavior: '',
  objectiveAttitudinal: '',
  audience: '',
  keyMessage: '',
  proofPoints: '',
  mandatories: '',
  budget: '',
  marketNeeds: '',
  timing: '',
};

export const SECTIONS = [
  {
    id: 'project',
    title: 'Project',
    fields: [
      { name: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g. LG OLED TV Global Launch', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
    ],
  },
  {
    id: 'context',
    title: '1. Project Context',
    guide: '프로젝트가 중요한 이유를 서술합니다.\n\n예시: 신규 런칭, 새로운 소비자 인사이트, 경쟁사 대응, 스폰서십 등 브랜드 연계 활동 확산',
    fields: [
      { name: 'projectContext', label: '', type: 'textarea', placeholder: '프로젝트의 배경과 중요성을 서술해 주세요...', required: true },
    ],
  },
  {
    id: 'objective',
    title: '2. Objective',
    guide: '캠페인이 달성하고자 하는 목표를 세 가지 관점에서 서술합니다.\n\n- Commercial: 매출, 이윤 창출, 비용 절감 등 궁극적으로 달성하고자 하는 바 (신규 고객 유치, 기존 고객 구매/사용 빈도를 높이거나, 브랜드 지불 가치를 높이는 것 등을 구체적으로 서술)\n- Behavior: 광고 시청 후 사람들이 어떤 행동을 하기를 바라는가? (사이트 방문, 콘텐츠 다운로드, 3개월간 웹 트래픽을 10% 증가 등 구체적인 목표 서술)\n- Attitudinal: 광고 시청 후 사람들이 어떻게 생각하기를 바라는가? (BTR KPI, 브랜드/제품에 대한 인식 변화, 미디어 Engagement, PR 화제성 측정 등)',
    fields: [
      { name: 'objectiveCommercial', label: 'Commercial', type: 'textarea', placeholder: '매출, 이윤 창출, 비용 절감 등 궁극적으로 달성하고자 하는 바', required: true, rows: 2 },
      { name: 'objectiveBehavior', label: 'Behavior', type: 'textarea', placeholder: '광고 시청 후 기대하는 행동 (사이트 방문, 웹 트래픽 증가 등)', required: true, rows: 2 },
      { name: 'objectiveAttitudinal', label: 'Attitudinal', type: 'textarea', placeholder: '광고 시청 후 기대하는 인식 변화 (BTR KPI, 브랜드 인식 등)', required: true, rows: 2 },
    ],
  },
  {
    id: 'audience',
    title: '3. Audience',
    guide: '브랜드가 소구하고자 하는 대상은 누구인가? 그 중 우선순위는?\n\n타겟 고객의 인구통계, 라이프스타일, 관심사 등을 구체적으로 서술해 주세요.',
    fields: [
      { name: 'audience', label: '', type: 'textarea', placeholder: 'e.g. 25-35세 밀레니얼, 프리미엄 라이프스타일에 관심이 높은 도시 거주자', required: true, rows: 2 },
    ],
  },
  {
    id: 'keyMessage',
    title: '4. Key Message',
    guide: '우리가 전달해야 하는 가장 중요한 메시지는 무엇인가?\n\n1-2 문장으로 단순하게 서술해 주세요. 이 메시지가 캠페인의 핵심 방향을 결정합니다.',
    fields: [
      { name: 'keyMessage', label: '', type: 'textarea', placeholder: 'e.g. LG OLED은 당신의 일상에 프리미엄 감동을 더합니다.', required: true, rows: 2 },
    ],
  },
  {
    id: 'proofPoints',
    title: '5. Proof Points',
    guide: 'Key Message를 신뢰하게 하는 근거는 무엇인가?\n\n제품, 브랜드와 관련한 상세 근거를 중요도 순으로 1~3개 서술해 주세요.',
    fields: [
      { name: 'proofPoints', label: '', type: 'textarea', placeholder: '1. 자발광 픽셀로 완벽한 블랙 구현\n2. 10년 연속 글로벌 TV 시장 점유율 1위\n3. 에너지 효율 A++ 등급', required: true, rows: 3 },
    ],
  },
  {
    id: 'mandatories',
    title: '6. Mandatories',
    guide: '미디어/채널/집행 상세 정보를 기입합니다.\n\n매체 믹스, 예산 및 제작물 스펙, 모델, 브랜드 가이드라인 및 기타 유의 사항에 대한 정보를 제공해 주세요.',
    fields: [
      { name: 'mandatories', label: '', type: 'textarea', placeholder: '미디어/채널 정보, 브랜드 가이드라인 준수 사항 등...', rows: 2 },
    ],
  },
  {
    id: 'budget',
    title: '7. Budget',
    guide: '예산 가이드라인을 기입합니다.\n\n전체 캠페인 예산 또는 매체별 예산 배분 정보를 포함해 주세요.',
    fields: [
      { name: 'budget', label: '', type: 'text', placeholder: 'e.g. $500,000 / 5억원' },
    ],
  },
  {
    id: 'marketNeeds',
    title: '8. Market Needs',
    guide: '광고물이 사용될 시장 정보를 기입합니다.\n\n타겟 국가/지역과 언어 variation이 필요한 경우 함께 기입해 주세요.',
    fields: [
      { name: 'marketNeeds', label: '', type: 'textarea', placeholder: 'e.g. USA, Germany, India / 영어, 독일어, 힌디어 variation 필요', required: true, rows: 2 },
    ],
  },
  {
    id: 'timing',
    title: '9. Timing',
    guide: '광고 게재 시점을 기입합니다.\n\n캠페인 시작일과 종료일, 주요 마일스톤이 있다면 함께 기입해 주세요.',
    fields: [
      { name: 'timing', label: '', type: 'text', placeholder: 'e.g. 2026.04 - 2026.06', required: true },
    ],
  },
];

const BriefingForm = ({ onStartAnalysis, isAnalyzing, isDisabled, onGuideSelect }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [collapsedSections, setCollapsedSections] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isFormValid = () => {
    const required = ['projectName', 'date', 'projectContext', 'objectiveCommercial', 'objectiveBehavior', 'objectiveAttitudinal', 'audience', 'keyMessage', 'proofPoints', 'marketNeeds', 'timing'];
    return required.every(field => formData[field].trim() !== '');
  };

  const styles = {
    sidebar: {
      width: '400px',
      flexShrink: 0,
      backgroundColor: COLORS.WHITE,
      borderRight: `1px solid ${COLORS.BORDER}`,
      overflowY: 'auto',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    header: {
      marginBottom: '0.5rem',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: `1px solid ${COLORS.BORDER}`,
      userSelect: 'none',
    },
    sectionTitleRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flex: 1,
      cursor: 'pointer',
    },
    sectionTitle: {
      fontSize: '0.8rem',
      fontWeight: 700,
      color: COLORS.TEXT_MAIN,
      letterSpacing: '0.3px',
      margin: 0,
    },
    guideIcon: {
      width: '20px',
      height: '20px',
      borderRadius: '5px',
      border: 'none',
      backgroundColor: 'transparent',
      color: COLORS.TEXT_SUB,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
      padding: 0,
      transition: 'color 0.2s ease',
    },
    fieldLabel: {
      fontSize: '0.72rem',
      fontWeight: 600,
      color: COLORS.TEXT_SUB,
      marginBottom: '4px',
      marginTop: '8px',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.85rem',
      outline: 'none',
      backgroundColor: isDisabled ? '#F8F9FA' : COLORS.WHITE,
      color: COLORS.TEXT_MAIN,
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease',
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.BORDER}`,
      fontSize: '0.85rem',
      outline: 'none',
      backgroundColor: isDisabled ? '#F8F9FA' : COLORS.WHITE,
      color: COLORS.TEXT_MAIN,
      resize: 'vertical',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      lineHeight: 1.5,
      transition: 'border-color 0.2s ease',
    },
    requiredMark: {
      color: COLORS.LG_RED,
      marginLeft: '2px',
    },
    primaryBtn: {
      width: '100%',
      backgroundColor: isAnalyzing ? COLORS.TEXT_SUB : COLORS.LG_RED,
      color: COLORS.WHITE,
      padding: '14px',
      borderRadius: '12px',
      border: 'none',
      fontWeight: 700,
      fontSize: '1rem',
      cursor: isAnalyzing || !isFormValid() ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 8px 20px rgba(165, 0, 52, 0.2)',
      marginTop: '1rem',
      opacity: !isAnalyzing && !isFormValid() ? 0.5 : 1,
    },
    sectionContent: {
      padding: '4px 0 8px 0',
    },
  };

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name],
      onChange: handleChange,
      disabled: isDisabled,
      placeholder: field.placeholder,
      style: field.type === 'textarea' ? { ...styles.textarea, minHeight: `${(field.rows || 3) * 24}px` } : styles.input,
    };

    return (
      <div key={field.name}>
        {field.label && (
          <p style={styles.fieldLabel}>
            {field.label}
            {field.required && <span style={styles.requiredMark}>*</span>}
          </p>
        )}
        {field.type === 'textarea' ? (
          <textarea {...commonProps} rows={field.rows || 3} />
        ) : (
          <input {...commonProps} type={field.type} />
        )}
      </div>
    );
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800 }}>LG Campaign Brief</h3>
        <p style={{ margin: 0, fontSize: '0.78rem', color: COLORS.TEXT_SUB }}>
          LG 표준 브리프 양식에 따라 캠페인 정보를 입력하세요.
        </p>
      </div>

      {SECTIONS.map((section) => {
        const isCollapsed = collapsedSections[section.id];
        return (
          <div key={section.id}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleRow} onClick={() => toggleSection(section.id)}>
                <p style={styles.sectionTitle}>{section.title}</p>
                {section.guide && (
                  <button
                    style={styles.guideIcon}
                    onClick={(e) => {
                      e.stopPropagation();
                      onGuideSelect && onGuideSelect({ id: section.id, title: section.title, guide: section.guide });
                    }}
                    title="작성 가이드 보기"
                  >
                    <Search size={13} />
                  </button>
                )}
              </div>
              <div onClick={() => toggleSection(section.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {isCollapsed ? <ChevronRight size={16} color={COLORS.TEXT_SUB} /> : <ChevronDown size={16} color={COLORS.TEXT_SUB} />}
              </div>
            </div>
            {!isCollapsed && (
              <div style={styles.sectionContent}>
                {section.fields.map(renderField)}
              </div>
            )}
          </div>
        );
      })}

      {!isDisabled && (
        <button
          style={styles.primaryBtn}
          onClick={() => onStartAnalysis(formData)}
          disabled={isAnalyzing || !isFormValid()}
        >
          {isAnalyzing
            ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
            : <><ArrowRight size={18} /> Submit Brief &amp; Analyze</>
          }
        </button>
      )}
    </aside>
  );
};

export default BriefingForm;
