import React, { useState } from 'react';
import { ArrowRight, Loader, ChevronDown, ChevronRight, Search, Sparkles } from 'lucide-react';
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

// Required fields are derived from SECTIONS field.required — single source of truth

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
    guide: '이 프로젝트가 왜 지금 필요한지, 배경과 중요성을 설명합니다.\n\n다음 중 해당하는 사항을 중심으로 서술해 주세요:\n- 신제품 런칭: 어떤 제품/서비스가 새로 출시되는가?\n- 소비자 인사이트: 최근 발견된 소비자 트렌드나 니즈 변화는?\n- 경쟁사 대응: 경쟁사의 어떤 움직임에 대응하는 캠페인인가?\n- 시즌/이벤트: 특정 시즌이나 스폰서십 연계인가?\n- 브랜드 전략: 리포지셔닝, 인지도 확대 등 전략적 목적이 있는가?\n\n작성 팁: "왜 이 캠페인을 하는가?"에 대한 답을 경영진에게 설명하듯 간결하게 써주세요.\n\n예시: "LG OLED TV의 2026년형 신모델 출시에 맞춰, 북미 시장에서 프리미엄 TV 카테고리 리더십을 강화하기 위한 글로벌 런칭 캠페인. 최근 경쟁사 S사의 QD-OLED 공세에 대응하여, LG OLED 고유의 화질 우위와 10년 기술 리더십을 소구할 필요가 있음."',
    fields: [
      { name: 'projectContext', label: '', type: 'textarea', placeholder: '프로젝트의 배경과 중요성을 서술해 주세요...', required: true },
    ],
  },
  {
    id: 'objective',
    title: '2. Objective',
    guide: '캠페인 목표를 세 가지 계층으로 구체적으로 서술합니다. 각 목표는 측정 가능(Measurable)해야 합니다.\n\n[Commercial Objectives — 비즈니스 목표]\n매출 증대, 시장 점유율 확대, 신규 고객 유치, 재구매율 향상, 브랜드 프리미엄 제고 등. 가능하면 수치 목표를 포함해 주세요.\n예시: "북미 시장 OLED TV 매출 전년 대비 15% 성장, 프리미엄 세그먼트 시장 점유율 45% 달성"\n\n[Behavior Objectives — 행동 목표]\n광고를 본 소비자가 실제로 취하길 바라는 행동. 웹사이트 방문, 매장 방문 예약, 체험 신청, 콘텐츠 공유, 구매 전환 등.\n예시: "캠페인 기간 중 제품 페이지 방문 20% 증가, Best Buy 매장 체험 예약 10,000건 달성"\n\n[Attitudinal Objectives — 인식 목표]\n소비자의 브랜드/제품 인식 변화. 브랜드 인지도, 광고 상기도, 선호도, 구매 고려도, NPS 등. 측정 방법(BTR KPI, 설문, 소셜 리스닝)도 함께 명시.\n예시: "BTR 조사 기준 \'TV 기술 리더\' 이미지 속성 5pt 상승, 소셜 미디어 긍정 감성 비율 80% 이상"',
    fields: [
      { name: 'objectiveCommercial', label: 'Commercial', type: 'textarea', placeholder: '매출, 이윤 창출, 비용 절감 등 궁극적으로 달성하고자 하는 바', required: true, rows: 2 },
      { name: 'objectiveBehavior', label: 'Behavior', type: 'textarea', placeholder: '광고 시청 후 기대하는 행동 (사이트 방문, 웹 트래픽 증가 등)', required: true, rows: 2 },
      { name: 'objectiveAttitudinal', label: 'Attitudinal', type: 'textarea', placeholder: '광고 시청 후 기대하는 인식 변화 (BTR KPI, 브랜드 인식 등)', required: true, rows: 2 },
    ],
  },
  {
    id: 'audience',
    title: '3. Audience',
    guide: '브랜드가 소구하고자 하는 핵심 타겟을 구체적으로 정의합니다.\n\n다음 항목들을 포함하여 서술해 주세요:\n- 인구통계: 연령, 성별, 소득 수준, 거주 지역, 직업군\n- 라이프스타일: 관심사, 미디어 소비 습관, 가치관, 여가 활동\n- 구매 행동: 현재 사용 브랜드, 구매 주기, 의사결정 요인, 가격 민감도\n- 페인 포인트: 현재 겪고 있는 불편함이나 충족되지 않는 니즈\n\n복수의 타겟이 있다면 우선순위를 명시해 주세요 (Primary / Secondary).\n\n예시:\n- Primary: "30-45세 고소득 남성, 홈 엔터테인먼트에 투자를 아끼지 않는 테크 얼리어답터. 화질과 게이밍 성능을 중시."\n- Secondary: "28-40세 맞벌이 부부, 인테리어와 조화를 이루는 프리미엄 가전 선호."',
    fields: [
      { name: 'audience', label: '', type: 'textarea', placeholder: 'e.g. Primary: 30-45세 고소득 남성 테크 얼리어답터 / Secondary: 28-40세 맞벌이 부부', required: true, rows: 2 },
    ],
  },
  {
    id: 'keyMessage',
    title: '4. Key Message',
    guide: '이 캠페인을 통해 소비자에게 전달해야 하는 단 하나의 가장 중요한 메시지입니다.\n\n작성 원칙:\n- 1-2문장으로 단순하고 명확하게 작성\n- 제품의 기능(Feature)이 아닌 소비자 관점의 가치(Benefit)로 표현\n- "소비자가 이 광고를 보고 딱 하나만 기억한다면?" 이라는 질문에 대한 답\n- LG 브랜드 슬로건 "Life\'s Good"과의 연결성 고려\n\n좋은 예시: "LG OLED은 완벽한 블랙으로 콘텐츠 본연의 감동을 전달하여, 당신의 거실을 시네마로 바꿉니다."\n\n피해야 할 예시: "LG OLED은 자발광 픽셀, 120Hz 주사율, α9 Gen7 프로세서를 탑재했습니다." (기능 나열은 Proof Points에 작성)',
    fields: [
      { name: 'keyMessage', label: '', type: 'textarea', placeholder: 'e.g. LG OLED은 완벽한 블랙으로 콘텐츠 본연의 감동을 전달하여, 당신의 거실을 시네마로 바꿉니다.', required: true, rows: 2 },
    ],
  },
  {
    id: 'proofPoints',
    title: '5. Proof Points',
    guide: 'Key Message를 소비자가 신뢰할 수 있도록 뒷받침하는 근거를 서술합니다.\n\n다음 카테고리에서 중요도 순으로 1~3개를 선정해 주세요:\n- 기술적 우위: 특허 기술, 업계 최초/유일, 성능 벤치마크 수치\n- 수상/인증: CES Innovation Award, 전문 매체 평가, 에너지 효율 인증\n- 실적/레퍼런스: 시장 점유율 1위, 글로벌 판매량, 연속 수상 기록\n- 소비자 증언: 고객 만족도 조사 결과, 리뷰 평점, 추천 지수\n- 전문가 보증: 유명 감독/디자이너/전문가의 추천이나 협업\n\n각 근거는 구체적인 숫자나 출처를 포함하면 설득력이 높아집니다.\n\n예시:\n1. 자발광 OLED 픽셀로 완벽한 블랙과 무한대 명암비 구현 — 10년 연속 글로벌 판매 1위 (Omdia 2025)\n2. α9 Gen7 AI 프로세서의 AI 업스케일링으로 모든 콘텐츠를 4K 수준으로 최적화\n3. 2026 CES Innovation Award 수상, EISA Best Product Award 5년 연속 수상',
    fields: [
      { name: 'proofPoints', label: '', type: 'textarea', placeholder: '1. 자발광 OLED 픽셀 — 10년 연속 글로벌 판매 1위 (Omdia 2025)\n2. α9 Gen7 AI 프로세서 업스케일링\n3. 2026 CES Innovation Award 수상', required: true, rows: 3 },
    ],
  },
  {
    id: 'mandatories',
    title: '6. Mandatories',
    guide: '캠페인 집행 시 반드시 준수해야 하는 필수 요건들을 기입합니다.\n\n포함 항목:\n- 미디어/채널: TV, 디지털(YouTube, Meta, Programmatic), OOH, 매장 POP 등 매체 믹스\n- 제작물 스펙: 영상 길이(15초/30초/60초), 배너 사이즈, 소셜 포맷(Reels, Stories 등)\n- 모델/인물: 기 계약 모델, 앰배서더, 인플루언서 활용 계획\n- 브랜드 가이드라인: LG 로고 사용 규정, 컬러 팔레트, 폰트, "Life\'s Good" 슬로건 삽입 여부\n- 법적/규제 사항: 특정 국가 광고 규제, 필수 고지 문구, 환경 라벨링 등\n\n예시: "30초/15초 TV CF + 6초 YouTube Bumper + Meta/Instagram Reels. LG 글로벌 앰배서더 활용 필수. BCG v3.2 가이드라인 준수. \'Life\'s Good\' 엔드카드 필수 삽입."',
    fields: [
      { name: 'mandatories', label: '', type: 'textarea', placeholder: '매체 믹스, 제작물 스펙, 모델, 브랜드 가이드라인, 법적 유의사항 등...', rows: 2 },
    ],
  },
  {
    id: 'budget',
    title: '7. Budget',
    guide: '캠페인 전체 예산 또는 매체별 예산 배분 정보를 기입합니다.\n\n포함하면 좋은 정보:\n- 총 캠페인 예산 (미디어 + 제작)\n- 매체별 예산 비중 (예: Digital 60%, TV 25%, OOH 15%)\n- 제작비 별도 여부\n- 전년 대비 예산 증감 현황\n\n예시: "총 예산 $2M (미디어 $1.5M + 제작 $500K). 디지털 60% / TV 30% / OOH 10%. 전년 대비 20% 증액."',
    fields: [
      { name: 'budget', label: '', type: 'text', placeholder: 'e.g. 총 $2M (미디어 $1.5M + 제작 $500K), Digital 60% / TV 30% / OOH 10%' },
    ],
  },
  {
    id: 'marketNeeds',
    title: '8. Market Needs',
    guide: '광고물이 집행될 시장 정보와 로컬라이제이션 요구사항을 기입합니다.\n\n포함 항목:\n- 타겟 국가/지역: 집행 대상 시장 목록\n- 언어 Variation: 필요한 언어 버전 및 단순 번역 vs. 현지화 수준\n- 문화적 고려사항: 특정 시장에서 피해야 할 표현, 선호하는 커뮤니케이션 톤\n- 현지 경쟁 환경: 시장별 주요 경쟁사 및 포지셔닝 차이\n- 미디어 환경: 시장별 주요 미디어 플랫폼 차이\n\n예시: "미국(영어), 독일(독일어), 인도(힌디어/영어) 3개 시장. 독일은 환경/에너지 효율 소구 강화, 인도는 가격 대비 가치 소구 강화. 각 시장별 크리에이티브 어댑테이션 필요."',
    fields: [
      { name: 'marketNeeds', label: '', type: 'textarea', placeholder: 'e.g. 미국(영어), 독일(독일어), 인도(힌디어/영어). 각 시장별 크리에이티브 어댑테이션 필요.', required: true, rows: 2 },
    ],
  },
  {
    id: 'timing',
    title: '9. Timing',
    guide: '캠페인의 시간 계획을 기입합니다.\n\n포함 항목:\n- 캠페인 집행 기간: 시작일 ~ 종료일\n- 주요 마일스톤: 제품 출시일, 주요 이벤트(CES, IFA 등), 시즌 피크\n- 단계별 계획: 티징(Teasing) → 런칭(Launch) → 서스테인(Sustain) 등 페이즈 구분\n- 제작 일정: 크리에이티브 마감일, 소재 전달 기한\n\n예시: "2026.04.01 ~ 2026.06.30 (3개월). 4월 1~14일 티징, 4월 15일 글로벌 런칭, 5~6월 서스테인. 크리에이티브 최종 마감: 2026.03.15."',
    fields: [
      { name: 'timing', label: '', type: 'text', placeholder: 'e.g. 2026.04.01 ~ 2026.06.30, 4/1 티징 → 4/15 런칭 → 5-6월 서스테인', required: true },
    ],
  },
];

const BriefingForm = ({ onStartAnalysis, isAnalyzing, isDisabled, onGuideSelect }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isFieldRequired = (name) => {
    for (const section of SECTIONS) {
      for (const f of section.fields) {
        if (f.name === name) return !!f.required;
      }
    }
    return false;
  };

  const isFieldEmpty = (name) => isFieldRequired(name) && formData[name].trim() === '';

  const isFormValid = () => SECTIONS.every(s => s.fields.every(f => !f.required || formData[f.name].trim() !== ''));

  const sectionHasEmpty = (section) =>
    section.fields.some(f => f.required && formData[f.name].trim() === '');

  const sectionIsRequired = (section) =>
    section.fields.some(f => f.required);

  const handleAutoGenerate = async () => {
    const name = formData.projectName.trim();
    if (!name) {
      alert('Project Name을 먼저 입력해 주세요.');
      return;
    }
    setIsGenerating(true);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/v1/campaigns/generate-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: name }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setFormData(prev => ({
          ...prev,
          ...result.data,
          projectName: prev.projectName,
          date: prev.date,
        }));
        // expand all sections to show generated content
        setCollapsedSections({});
        setSubmitted(false);
      }
    } catch (error) {
      console.error('Brief generation failed:', error);
      alert('AI 자동생성에 실패했습니다. 백엔드 서버를 확인해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      setSubmitted(true);
      // auto-expand first section with empty required field
      for (const section of SECTIONS) {
        if (sectionHasEmpty(section)) {
          setCollapsedSections(prev => ({ ...prev, [section.id]: false }));
          break;
        }
      }
      return;
    }
    onStartAnalysis(formData);
  };

  const styles = {
    sidebar: {
      width: '100%',
      height: '100%',
      backgroundColor: COLORS.WHITE,
      overflowY: 'auto',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
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
    incompleteDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: COLORS.LG_RED,
      flexShrink: 0,
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
    input: (isEmpty) => ({
      width: '100%',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${submitted && isEmpty ? COLORS.LG_RED : COLORS.BORDER}`,
      fontSize: '0.85rem',
      outline: 'none',
      backgroundColor: isDisabled ? '#F8F9FA' : COLORS.WHITE,
      color: COLORS.TEXT_MAIN,
      boxSizing: 'border-box',
      transition: 'border-color 0.2s ease',
    }),
    textarea: (isEmpty) => ({
      width: '100%',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${submitted && isEmpty ? COLORS.LG_RED : COLORS.BORDER}`,
      fontSize: '0.85rem',
      outline: 'none',
      backgroundColor: isDisabled ? '#F8F9FA' : COLORS.WHITE,
      color: COLORS.TEXT_MAIN,
      resize: 'vertical',
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      lineHeight: 1.5,
      transition: 'border-color 0.2s ease',
    }),
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
      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      boxShadow: '0 8px 20px rgba(165, 0, 52, 0.2)',
      marginTop: '1rem',
    },
    sectionContent: {
      padding: '4px 0 8px 0',
    },
    autoGenBtn: {
      padding: '6px 12px',
      borderRadius: '8px',
      border: `1px solid ${COLORS.LG_RED}`,
      backgroundColor: COLORS.WHITE,
      color: COLORS.LG_RED,
      fontSize: '0.75rem',
      fontWeight: 700,
      cursor: isGenerating || isDisabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap',
      opacity: isGenerating || isDisabled ? 0.5 : 1,
      transition: 'all 0.2s ease',
      flexShrink: 0,
    },
  };

  const renderField = (field) => {
    const empty = isFieldEmpty(field.name);
    const commonProps = {
      name: field.name,
      value: formData[field.name],
      onChange: handleChange,
      disabled: isDisabled,
      placeholder: field.placeholder,
      style: field.type === 'textarea'
        ? { ...styles.textarea(empty), minHeight: `${(field.rows || 3) * 24}px` }
        : styles.input(empty),
    };

    const isProjectName = field.name === 'projectName';

    return (
      <div key={field.name}>
        {field.label && (
          <p style={styles.fieldLabel}>
            {field.label}
            {field.required && <span style={styles.requiredMark}>*</span>}
          </p>
        )}
        {isProjectName ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input {...commonProps} type={field.type} style={{ ...commonProps.style, flex: 1 }} />
            <button
              style={styles.autoGenBtn}
              onClick={handleAutoGenerate}
              disabled={isGenerating || isDisabled}
              title="Project Name을 기반으로 브리프 초안을 AI가 자동 생성합니다"
            >
              {isGenerating
                ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> 생성중...</>
                : <><Sparkles size={12} /> AI 자동생성</>
              }
            </button>
          </div>
        ) : field.type === 'textarea' ? (
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
        const hasEmpty = submitted && sectionHasEmpty(section);
        return (
          <div key={section.id}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitleRow} onClick={() => toggleSection(section.id)}>
                <p style={styles.sectionTitle}>
                  {section.title}
                  {sectionIsRequired(section) && <span style={styles.requiredMark}>*</span>}
                </p>
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
                {hasEmpty && isCollapsed && <div style={styles.incompleteDot} />}
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
          onClick={handleSubmit}
          disabled={isAnalyzing}
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
