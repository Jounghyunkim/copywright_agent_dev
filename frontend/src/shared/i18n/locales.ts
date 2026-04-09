export type Locale = 'en' | 'ko' | 'de'

export const LOCALE_OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
]

type Translations = Record<string, Record<Locale, string>>

const t: Translations = {
  // ─── App Shell / Navigation ───
  'nav.home': { en: 'Home', ko: '홈', de: 'Startseite' },
  'nav.newCampaign': { en: 'New Campaign', ko: '새 캠페인', de: 'Neue Kampagne' },
  'nav.campaigns': { en: 'Campaigns', ko: '캠페인 목록', de: 'Kampagnen' },
  'nav.about': { en: 'About', ko: '소개', de: 'Über uns' },
  'nav.appTitle': { en: 'AI Copywriting Platform', ko: 'AI 카피라이팅 플랫폼', de: 'AI-Copywriting-Plattform' },
  'nav.skillAuthoring': { en: 'Skill Authoring', ko: '스킬 작성', de: 'Skill-Erstellung' },
  'nav.skillManagement': { en: 'Skill Management', ko: '스킬 관리', de: 'Skill-Verwaltung' },
  'nav.generalSettings': { en: 'General Settings', ko: '일반 설정', de: 'Allgemeine Einstellungen' },
  'nav.sseConnected': { en: 'Backend Connected', ko: '백엔드 연결됨', de: 'Backend verbunden' },
  'nav.sseDisconnected': { en: 'Backend Disconnected', ko: '백엔드 미연결', de: 'Backend getrennt' },

  // ─── Settings Page ───
  'settings.title': { en: 'Settings', ko: '설정', de: 'Einstellungen' },
  'settings.general': { en: 'General', ko: '일반', de: 'Allgemein' },
  'settings.generalTitle': { en: 'General Settings', ko: '일반 설정', de: 'Allgemeine Einstellungen' },
  'settings.language': { en: 'Language', ko: '언어', de: 'Sprache' },
  'settings.languageDesc': { en: 'Select the display language for the application.', ko: '애플리케이션의 표시 언어를 선택합니다.', de: 'Wählen Sie die Anzeigesprache der Anwendung.' },
  'settings.skillBuilder': { en: 'Skill Authoring', ko: '스킬 작성', de: 'Skill-Erstellung' },
  'settings.skillManager': { en: 'Skill Management', ko: '스킬 관리', de: 'Skill-Verwaltung' },
  'settings.createNewSkill': { en: 'Create New Skill', ko: '새 스킬 생성', de: 'Neuen Skill erstellen' },
  'settings.skillName': { en: 'Skill Name', ko: '스킬 이름', de: 'Skill-Name' },
  'settings.purpose': { en: 'Purpose', ko: '목적', de: 'Zweck' },
  'settings.goal': { en: 'Goal', ko: '목표', de: 'Ziel' },
  'settings.goodExample': { en: 'Good Example', ko: '좋은 예시', de: 'Gutes Beispiel' },
  'settings.badExample': { en: 'Bad Example', ko: '나쁜 예시', de: 'Schlechtes Beispiel' },
  'settings.generateDraft': { en: 'Generate Skill Draft', ko: '스킬 초안 생성', de: 'Skill-Entwurf generieren' },
  'settings.confirmSave': { en: 'Confirm & Save', ko: '확인 및 저장', de: 'Bestätigen & Speichern' },
  'settings.cancelEdit': { en: 'Cancel & Edit', ko: '취소 및 수정', de: 'Abbrechen & Bearbeiten' },
  'settings.promptTemplate': { en: 'Prompt Template', ko: '프롬프트 템플릿', de: 'Prompt-Vorlage' },
  'settings.outputSchema': { en: 'Output Schema', ko: '출력 스키마', de: 'Ausgabe-Schema' },
  'settings.noSkills': { en: 'No skills registered.', ko: '등록된 스킬이 없습니다.', de: 'Keine Skills registriert.' },
  'settings.deleteSkill': { en: 'Delete this skill?', ko: '이 스킬을 삭제하시겠습니까?', de: 'Diesen Skill löschen?' },

  // ─── Home / Dashboard ───
  'home.title': { en: 'Projects', ko: '프로젝트', de: 'Projekte' },
  'home.totalProjects': { en: 'Total Projects', ko: '전체 프로젝트', de: 'Gesamtprojekte' },
  'home.avgBrandScore': { en: 'Avg. Brand Score', ko: '평균 브랜드 점수', de: 'Ø Markenwert' },
  'home.targetRegions': { en: 'Target Regions', ko: '타겟 지역', de: 'Zielregionen' },
  'home.avgReviewScore': { en: 'Avg. Review Score', ko: '평균 리뷰 점수', de: 'Ø Bewertung' },
  'home.searchPlaceholder': { en: 'Search campaigns...', ko: '캠페인 검색...', de: 'Kampagnen suchen...' },
  'home.noCampaigns': { en: 'No campaigns yet.', ko: '아직 캠페인이 없습니다.', de: 'Noch keine Kampagnen.' },
  'home.startNew': { en: 'Start New Campaign', ko: '새 캠페인 시작', de: 'Neue Kampagne starten' },

  // ─── Workflow Steps ───
  'step.research': { en: 'Research', ko: '리서치', de: 'Recherche' },
  'step.analysis': { en: 'Analysis', ko: '분석', de: 'Analyse' },
  'step.strategicMessage': { en: 'Copywriting Strategy', ko: '카피라이팅 전략', de: 'Copywriting-Strategie' },
  'step.generation': { en: 'Generation', ko: '카피 생성', de: 'Generierung' },
  'step.review': { en: 'Review', ko: '리뷰', de: 'Überprüfung' },

  // ─── Generation Config ───
  'gen.title': { en: 'Copy Generation Settings', ko: '카피 생성 설정', de: 'Kopie-Generierungseinstellungen' },
  'gen.desc': {
    en: 'Configure target settings for customized copy generation. Optimized copy will be generated for each country/persona.',
    ko: '맞춤형 카피 생성을 위한 타겟 설정을 구성해주세요. 선택한 옵션에 따라 각 국가/페르소나별 최적화된 카피가 생성됩니다.',
    de: 'Konfigurieren Sie die Zieleinstellungen für die angepasste Texterstellung. Für jedes Land/Persona wird optimierter Text generiert.',
  },
  'gen.targetCountries': { en: 'Target Countries', ko: '타겟 국가', de: 'Zielländer' },
  'gen.selectAll': { en: 'Select All', ko: '전체 선택', de: 'Alle auswählen' },
  'gen.deselectAll': { en: 'Deselect All', ko: '전체 해제', de: 'Alle abwählen' },
  'gen.targetAgeGroups': { en: 'Target Age Groups', ko: '타겟 연령대', de: 'Zielgruppen (Alter)' },
  'gen.targetPersonas': { en: 'Target Personas', ko: '타겟 페르소나', de: 'Ziel-Personas' },
  'gen.aiWriterPersonas': { en: 'AI Writer Personas', ko: 'AI Writer 페르소나', de: 'KI-Autoren-Personas' },
  'gen.aiWriterDesc': {
    en: '— Generate diverse copy styles in parallel',
    ko: '— 다양한 스타일의 카피를 병렬 생성합니다',
    de: '— Verschiedene Textstile parallel generieren',
  },
  'gen.personaMode': { en: 'Copywriting Writer Mode', ko: 'Copywriting 작가 지정 모드', de: 'Copywriting-Autoren-Modus' },
  'gen.personaModeDesc': {
    en: 'Assign specific AI Writers to generate copy in their unique style and compare results',
    ko: '특정 AI Writer를 지정하여 각자의 스타일로 카피를 생성하고 결과를 비교합니다',
    de: 'Bestimmte KI-Autoren zuweisen, um Texte in ihrem einzigartigen Stil zu erstellen und Ergebnisse zu vergleichen',
  },
  'gen.copyCount': { en: 'Count', ko: '생성 개수', de: 'Anzahl' },
  'gen.generateCopy': { en: 'Generate Copy', ko: '카피 생성', de: 'Text generieren' },
  'gen.generating': { en: 'Generating...', ko: '생성 중...', de: 'Generierung...' },
  'gen.generateWithWriters': { en: 'Generate with {n} Writers', ko: '{n}명의 Writer로 생성', de: 'Mit {n} Autoren generieren' },
  'gen.validationMsg': {
    en: 'Please select at least one country, age group, and persona.',
    ko: '국가, 연령대, 페르소나를 각각 1개 이상 선택해주세요.',
    de: 'Bitte wählen Sie mindestens ein Land, eine Altersgruppe und eine Persona.',
  },
  'gen.validationMsgWriter': {
    en: 'Please select at least one country, age group, persona, and AI Writer.',
    ko: '국가, 연령대, 페르소나, AI Writer를 각각 1개 이상 선택해주세요.',
    de: 'Bitte wählen Sie mindestens ein Land, eine Altersgruppe, eine Persona und einen KI-Autor.',
  },

  // ─── Review ───
  'review.settings': { en: 'Review Settings', ko: '리뷰 설정', de: 'Überprüfungseinstellungen' },
  'review.desc': {
    en: 'Select copies to review and configure validation skillsets.',
    ko: '리뷰할 카피를 선택하고 검증 스킬셋을 설정해주세요.',
    de: 'Wählen Sie zu überprüfende Texte und konfigurieren Sie Validierungs-Skillsets.',
  },
  'review.targetCopy': { en: 'Target Copy', ko: '리뷰 대상 카피', de: 'Zieltext' },
  'review.useSkillsets': { en: 'Use Skillsets', ko: '검증 스킬셋', de: 'Skillsets verwenden' },
  'review.available': { en: '{n} available', ko: '{n}개 사용 가능', de: '{n} verfügbar' },
  'review.submitReview': { en: 'Submit Review', ko: '리뷰 제출', de: 'Überprüfung starten' },
  'review.reviewing': { en: 'Reviewing...', ko: '리뷰 중...', de: 'Überprüfung...' },

  // ─── Copy Results ───
  'copy.completed': { en: 'Copy generation completed!', ko: '카피 생성이 완료되었습니다!', de: 'Texterstellung abgeschlossen!' },
  'copy.candidatesMsg': {
    en: '{n} AI Writers have each generated copy. Compare results per persona in the tabs below.',
    ko: '{n}명의 AI Writer가 각각 카피를 생성했습니다. 아래 탭에서 페르소나별 결과를 비교하고 최적 후보를 선택하세요.',
    de: '{n} KI-Autoren haben jeweils Texte generiert. Vergleichen Sie die Ergebnisse pro Persona in den Tabs unten.',
  },
  'copy.standardMsg': {
    en: 'Check the generated copy below and click Review for quality validation.',
    ko: '아래에서 생성된 카피를 확인하고, Review 버튼을 눌러 품질 검증을 진행해주세요.',
    de: 'Überprüfen Sie den generierten Text unten und klicken Sie auf „Überprüfung" zur Qualitätsvalidierung.',
  },
  'copy.skillReviews': { en: 'Skill Reviews', ko: '스킬 리뷰', de: 'Skill-Bewertungen' },

  // ─── Common ───
  'common.save': { en: 'Save', ko: '저장', de: 'Speichern' },
  'common.cancel': { en: 'Cancel', ko: '취소', de: 'Abbrechen' },
  'common.delete': { en: 'Delete', ko: '삭제', de: 'Löschen' },
  'common.edit': { en: 'Edit', ko: '수정', de: 'Bearbeiten' },
  'common.approve': { en: 'Approve', ko: '승인', de: 'Genehmigen' },
  'common.modify': { en: 'Modify', ko: '수정', de: 'Ändern' },
  'common.loading': { en: 'Loading...', ko: '로딩 중...', de: 'Laden...' },
  'common.notWritten': { en: '(Not written)', ko: '(미작성)', de: '(Nicht ausgefüllt)' },
  'common.createdAt': { en: 'Created: {date}', ko: '생성일: {date}', de: 'Erstellt: {date}' },
  'common.nCountries': { en: '{n} countries', ko: '{n}개 국가', de: '{n} Länder' },
  'common.nCopies': { en: '{n} copies', ko: '{n}개 카피', de: '{n} Texte' },
  'common.nItems': { en: '{n} items', ko: '{n}개', de: '{n} Elemente' },

  // ─── Workflow Step Descriptions (EditorViews) ───
  'wf.step1.title': { en: 'Research Input', ko: '리서치 입력', de: 'Recherche-Eingabe' },
  'wf.step1.desc': {
    en: 'You can input from the left panel in two ways:\n① Upload a Message Matrix (.xlsx) to auto-fill product USP info\n② Fill the LG Campaign Research form manually\nBoth can be used together. Click "Submit" when ready.',
    ko: '좌측 패널에서 두 가지 방법으로 입력할 수 있습니다:\n① Message Matrix(.xlsx)를 업로드하면 제품 USP 정보가 자동으로 채워집니다\n② LG Campaign Research 폼을 직접 작성합니다\n두 가지를 함께 사용할 수도 있습니다. 작성 완료 후 "Submit" 버튼을 클릭하세요.',
    de: 'Sie können im linken Bereich auf zwei Arten eingeben:\n① Laden Sie eine Message Matrix (.xlsx) hoch, um Produkt-USP-Infos automatisch auszufüllen\n② Füllen Sie das LG Campaign Research-Formular manuell aus\nBeide können kombiniert werden. Klicken Sie auf „Submit", wenn Sie fertig sind.',
  },
  'wf.step2.desc': {
    en: 'Multi-Agent performs web search and RAG in parallel to create a 10-field Market Analyst Report.',
    ko: 'Multi-Agent가 웹 검색과 RAG를 병렬 수행하여 10개 필드의 Market Analyst Report를 생성합니다.',
    de: 'Multi-Agent führt Websuche und RAG parallel durch, um einen 10-Felder Market Analyst Report zu erstellen.',
  },
  'wf.step3.title': { en: 'Core Message Extraction', ko: '핵심 메시지 도출', de: 'Kernbotschaft-Extraktion' },
  'wf.step3.desc': {
    en: 'Extracts Core Message, Message Pillars, Emotional Hook, Tone Direction, and Key Phrases from the analysis report.',
    ko: '분석 리포트를 기반으로 Core Message, Message Pillars, Emotional Hook, Tone Direction, Key Phrases를 추출합니다.',
    de: 'Extrahiert Core Message, Message Pillars, Emotional Hook, Tone Direction und Key Phrases aus dem Analysebericht.',
  },
  'wf.step4.title': { en: 'Global Copy Generation', ko: '글로벌 카피 생성', de: 'Globale Texterstellung' },
  'wf.step4.desc': {
    en: 'Set target countries, age groups, and personas to generate culturally adapted copy for each market.',
    ko: '타겟 국가, 연령대, 페르소나를 설정하면 각 시장에 맞춤화된 카피가 생성됩니다.',
    de: 'Legen Sie Zielländer, Altersgruppen und Personas fest, um kulturell angepasste Texte für jeden Markt zu generieren.',
  },
  'wf.step5.title': { en: 'Skillset Quality Review', ko: 'Skillset 품질 검증', de: 'Skillset-Qualitätsprüfung' },
  'wf.step5.desc': {
    en: 'Review generated copy for AI Washing, brand terminology, cultural sensitivity, and more with 60+ skills.',
    ko: '생성된 카피를 AI Washing, 브랜드 용어, 문화 감수성 등 60개 이상의 스킬로 품질 검증합니다.',
    de: 'Überprüfen Sie generierte Texte auf AI Washing, Markenterminologie, kulturelle Sensibilität und mehr mit 60+ Skills.',
  },

  // ─── Chat / Timeline Messages ───
  'chat.greeting': {
    en: "Hello! I'm your AI Copywriting Agent. Nice to meet you!",
    ko: '안녕하세요! 저는 AI Copywriting Agent 입니다. 반가워요~',
    de: 'Hallo! Ich bin Ihr KI-Copywriting-Agent. Freut mich!',
  },
  'chat.greetingDesc': {
    en: "Let's create global campaign copy with the AI Copywriting Agent.\nI'll guide you through the 5-step workflow to produce optimized copy.",
    ko: 'AI Copywriting Agent와 함께 글로벌 캠페인 카피를 만들어 보세요.\n5단계 워크플로우를 통해 최적화된 카피를 생성하겠습니다.',
    de: 'Erstellen Sie globale Kampagnentexte mit dem KI-Copywriting-Agent.\nIch führe Sie durch den 5-Schritte-Workflow zur optimierten Texterstellung.',
  },
  'chat.workflowGuide': {
    en: 'Each step proceeds automatically after approval. You can modify or go back at any time.',
    ko: '각 단계는 이전 단계의 승인 후 자동으로 진행됩니다. 언제든 수정하거나 되돌릴 수 있습니다.',
    de: 'Jeder Schritt wird nach Genehmigung automatisch fortgesetzt. Sie können jederzeit ändern oder zurückkehren.',
  },
  'chat.startInstruction': {
    en: 'Please fill in the Message Matrix and Campaign Brief in the left panel.',
    ko: '좌측 패널에서 메세지 매트릭스와 캠페인 브리프를 작성해 주세요.',
    de: 'Bitte füllen Sie die Message Matrix und das Campaign Brief im linken Bereich aus.',
  },
  'chat.startDetail': {
    en: 'Upload a Message Matrix (.xlsx) file and fill in the LG Campaign Research form, then click Submit.',
    ko: 'Message Matrix에 xlsx 파일을 업로드하고, LG Campaign Research 폼을 작성한 후 Submit 버튼을 클릭해 주세요.',
    de: 'Laden Sie eine Message Matrix (.xlsx)-Datei hoch und füllen Sie das LG Campaign Research-Formular aus, dann klicken Sie auf Submit.',
  },
  'chat.briefReceived': {
    en: 'Brief received! 🚀',
    ko: '브리핑을 접수했습니다! 🚀',
    de: 'Brief erhalten! 🚀',
  },
  'chat.briefReceivedDesc': {
    en: 'The Market Analyst Agent is analyzing the target market using RAG. This may take 30-60 seconds.',
    ko: 'Market Analyst Agent가 RAG 기반으로 타겟 시장을 분석합니다. 30~60초 소요됩니다.',
    de: 'Der Market Analyst Agent analysiert den Zielmarkt mittels RAG. Dies kann 30-60 Sekunden dauern.',
  },
  'chat.analysisApproved': {
    en: 'Analysis results approved! ✅',
    ko: '분석 결과가 승인되었습니다! ✅',
    de: 'Analyseergebnisse genehmigt! ✅',
  },
  'chat.analysisApprovedDesc': {
    en: 'Copywriting Strategy has been extracted from the Market Analyst Report.',
    ko: 'Market Analyst Report를 기반으로 Copywriting Strategy를 추출했습니다.',
    de: 'Copywriting-Strategie wurde aus dem Market Analyst Report extrahiert.',
  },
  'chat.strategicApproved': {
    en: 'Copywriting Strategy confirmed! ✅',
    ko: 'Copywriting Strategy가 확정되었습니다! ✅',
    de: 'Copywriting-Strategie bestätigt! ✅',
  },
  'chat.strategicApprovedDesc': {
    en: 'Please set target countries, age groups, and personas for customized copy generation.',
    ko: '맞춤형 카피 생성을 위해 타겟 국가, 연령대, 페르소나를 설정해주세요.',
    de: 'Bitte legen Sie Zielländer, Altersgruppen und Personas für die angepasste Texterstellung fest.',
  },
  'chat.copyGenerated': {
    en: 'Copy generated! ✅',
    ko: '카피가 생성되었습니다! ✅',
    de: 'Texte generiert! ✅',
  },
  'chat.copyGeneratedDesc': {
    en: 'Check generated copy in the left panel. Select Review Settings below to run quality validation.',
    ko: '좌측 패널에서 생성된 카피를 확인하고, 아래 Review Settings에서 리뷰 대상 카피와 검증 스킬셋을 선택해주세요.',
    de: 'Überprüfen Sie die generierten Texte im linken Bereich. Wählen Sie unten Review Settings für die Qualitätsvalidierung.',
  },
  'chat.reviewRunning': {
    en: 'Running Skillset Review...',
    ko: 'Skillset Review를 실행하고 있습니다...',
    de: 'Skillset-Überprüfung läuft...',
  },
  'chat.reviewDone': {
    en: 'Skillset Review completed! ✅',
    ko: 'Skillset Review가 완료되었습니다! ✅',
    de: 'Skillset-Überprüfung abgeschlossen! ✅',
  },

  // ─── Briefing Form ───
  'brief.formTitle': { en: 'LG Campaign Research', ko: 'LG 캠페인 리서치', de: 'LG Kampagnen-Recherche' },
  'brief.formDesc': {
    en: 'Enter campaign research information in LG standard format.',
    ko: 'LG 표준 양식에 따라 캠페인 리서치 정보를 입력하세요.',
    de: 'Geben Sie Kampagnen-Rechercheinformationen im LG-Standardformat ein.',
  },
  'brief.viewGuide': { en: 'View Guide', ko: '작성 가이드 보기', de: 'Anleitung anzeigen' },
  'brief.aiGenerate': { en: 'AI Auto-Generate — Fill remaining fields', ko: 'AI 자동생성 — 나머지 항목 채우기', de: 'KI-Autogenerierung — Restliche Felder ausfüllen' },
  'brief.aiGenerating': { en: 'Generating remaining fields...', ko: '나머지 항목 생성중...', de: 'Restliche Felder werden generiert...' },
  'brief.aiGenerateDesc': {
    en: 'Based on Project Name and Project Context, AI will auto-generate the remaining fields.',
    ko: 'Project Name과 Project Context를 기반으로 나머지 항목을 AI가 자동 생성합니다.',
    de: 'Basierend auf Projektname und Projektkontext generiert KI die restlichen Felder automatisch.',
  },
  'brief.aiGenerateAlert': {
    en: 'Please enter Project Name and Project Context first.',
    ko: 'Project Name과 Project Context를 먼저 입력해 주세요.',
    de: 'Bitte geben Sie zuerst Projektname und Projektkontext ein.',
  },
  'brief.nameMinLength': {
    en: 'Project Name must be at least 3 characters.',
    ko: 'Project Name은 최소 3자 이상 입력해 주세요.',
    de: 'Der Projektname muss mindestens 3 Zeichen lang sein.',
  },
  'brief.contextMinLength': {
    en: 'Project Context must be at least 20 characters (5+ words). Please describe the campaign background in detail.',
    ko: 'Project Context는 최소 20자(5단어 이상) 입력해 주세요. 캠페인 배경을 구체적으로 서술하세요.',
    de: 'Der Projektkontext muss mindestens 20 Zeichen (5+ Wörter) enthalten. Bitte beschreiben Sie den Kampagnenhintergrund ausführlich.',
  },
  'brief.nFieldsGenerated': {
    en: '{n} fields auto-generated.',
    ko: '{n}개 항목이 자동 생성되었습니다.',
    de: '{n} Felder automatisch generiert.',
  },
  'brief.aiGenerateFailed': {
    en: 'AI auto-generation failed. Please check the backend server.',
    ko: 'AI 자동생성에 실패했습니다. 백엔드 서버를 확인해 주세요.',
    de: 'KI-Autogenerierung fehlgeschlagen. Bitte überprüfen Sie den Backend-Server.',
  },
  'brief.ph.projectContext': {
    en: 'Describe the background and significance of the project...',
    ko: '프로젝트의 배경과 중요성을 서술해 주세요...',
    de: 'Beschreiben Sie den Hintergrund und die Bedeutung des Projekts...',
  },
  'brief.ph.commercial': {
    en: 'Revenue, profit, cost reduction targets to achieve ultimately',
    ko: '매출, 이윤 창출, 비용 절감 등 궁극적으로 달성하고자 하는 바',
    de: 'Umsatz-, Gewinn- und Kostensenkungsziele',
  },
  'brief.ph.behavior': {
    en: 'Expected behavior after viewing (site visit, web traffic, etc.)',
    ko: '광고 시청 후 기대하는 행동 (사이트 방문, 웹 트래픽 증가 등)',
    de: 'Erwartetes Verhalten nach dem Ansehen (Seitenbesuch, Web-Traffic usw.)',
  },
  'brief.ph.attitudinal': {
    en: 'Expected perception change (BTR KPI, brand awareness, etc.)',
    ko: '광고 시청 후 기대하는 인식 변화 (BTR KPI, 브랜드 인식 등)',
    de: 'Erwartete Wahrnehmungsänderung (BTR-KPI, Markenbekanntheit usw.)',
  },
  'brief.ph.audience': {
    en: 'Primary: 30-45 high-income male tech early adopters / Secondary: 28-40 dual-income couples',
    ko: 'Primary: 30-45세 고소득 남성 테크 얼리어답터 / Secondary: 28-40세 맞벌이 부부',
    de: 'Primär: 30-45 einkommensstarke männliche Tech-Frühanwender / Sekundär: 28-40 Doppelverdiener-Paare',
  },
  'brief.ph.keyMessage': {
    en: 'LG OLED delivers the emotion of perfect black content, transforming your living room into a cinema.',
    ko: 'LG OLED은 완벽한 블랙으로 콘텐츠 본연의 감동을 전달하여, 당신의 거실을 시네마로 바꿉니다.',
    de: 'LG OLED liefert die Emotion perfekter Schwarzinhalte und verwandelt Ihr Wohnzimmer in ein Kino.',
  },
  'brief.ph.proofPoints': {
    en: '1. Self-luminous OLED pixels — #1 global sales for 10 years (Omdia 2025)\n2. α9 Gen7 AI processor upscaling\n3. 2026 CES Innovation Award',
    ko: '1. 자발광 OLED 픽셀 — 10년 연속 글로벌 판매 1위 (Omdia 2025)\n2. α9 Gen7 AI 프로세서 업스케일링\n3. 2026 CES Innovation Award 수상',
    de: '1. Selbstleuchtende OLED-Pixel — 10 Jahre weltweiter Verkaufsrang 1 (Omdia 2025)\n2. α9 Gen7 KI-Prozessor-Upscaling\n3. 2026 CES Innovation Award',
  },
  'brief.ph.mandatories': {
    en: 'Media mix, production specs, model, brand guidelines, legal notes, etc.',
    ko: '매체 믹스, 제작물 스펙, 모델, 브랜드 가이드라인, 법적 유의사항 등...',
    de: 'Medienmix, Produktionsspezifikationen, Modell, Markenrichtlinien, rechtliche Hinweise usw.',
  },
  'brief.ph.budget': {
    en: 'Total $2M (Media $1.5M + Production $500K), Digital 60% / TV 30% / OOH 10%',
    ko: '총 $2M (미디어 $1.5M + 제작 $500K), Digital 60% / TV 30% / OOH 10%',
    de: 'Gesamt $2M (Medien $1,5M + Produktion $500K), Digital 60% / TV 30% / OOH 10%',
  },
  'brief.ph.marketNeeds': {
    en: 'USA (English), Germany (German), India (Hindi/English). Creative adaptation needed per market.',
    ko: '미국(영어), 독일(독일어), 인도(힌디어/영어). 각 시장별 크리에이티브 어댑테이션 필요.',
    de: 'USA (Englisch), Deutschland (Deutsch), Indien (Hindi/Englisch). Kreative Anpassung pro Markt erforderlich.',
  },
  'brief.ph.timing': {
    en: '2026.04.01 ~ 2026.06.30, 4/1 Teasing → 4/15 Launch → 5-6 Sustain',
    ko: '2026.04.01 ~ 2026.06.30, 4/1 티징 → 4/15 런칭 → 5-6월 서스테인',
    de: '2026.04.01 ~ 2026.06.30, 1.4. Teasing → 15.4. Launch → Mai-Juni Sustain',
  },

  // ─── Message Matrix Upload ───
  'matrix.title': { en: 'Message Matrix Input', ko: 'Message Matrix 입력', de: 'Message-Matrix-Eingabe' },
  'matrix.uploadInstructions': {
    en: 'Drag & drop or click to upload a Message Matrix (.xlsx) file',
    ko: 'Message Matrix (xlsx) 파일을 드래그하거나 클릭하여 업로드',
    de: 'Message Matrix (.xlsx)-Datei hierher ziehen oder klicken zum Hochladen',
  },
  'matrix.supportedFormat': { en: 'Supported: .xlsx', ko: '지원 형식: .xlsx', de: 'Unterstützt: .xlsx' },
  'matrix.onlyXlsx': { en: 'Only .xlsx files are supported.', ko: 'xlsx 파일만 업로드 가능합니다.', de: 'Nur .xlsx-Dateien werden unterstützt.' },
  'matrix.selectSheets': { en: 'Select sheets to parse:', ko: '파싱할 시트를 선택하세요:', de: 'Wählen Sie zu parsende Blätter:' },
  'matrix.parseSheets': { en: 'Parse Selected Sheets', ko: '선택 시트 파싱', de: 'Ausgewählte Blätter parsen' },
  'matrix.loadingSheets': { en: 'Loading sheets...', ko: '시트 목록 로드 중...', de: 'Blätter werden geladen...' },
  'matrix.parsing': { en: 'Parsing...', ko: '파싱 중...', de: 'Wird geparst...' },
  'matrix.nSheets': { en: '({n} sheets)', ko: '({n}개 시트)', de: '({n} Blätter)' },
  'matrix.parseDone': { en: '({sheet} parsed)', ko: '({sheet} 파싱 완료)', de: '({sheet} geparst)' },
  'matrix.sheetsDetected': {
    en: '{n} sheets detected: {names}',
    ko: '{n}개 시트 감지: {names}',
    de: '{n} Blätter erkannt: {names}',
  },
  'matrix.parseComplete': {
    en: 'Parse complete — {sheets} sheets, {usps} USPs extracted',
    ko: '파싱 완료 — {sheets}개 시트, {usps}개 USP 추출',
    de: 'Parsen abgeschlossen — {sheets} Blätter, {usps} USPs extrahiert',
  },

  // ─── Copy Results (loading, counts) ───
  'copy.generatingForCountries': {
    en: 'Generating copy adapted to each country\'s culture and language...',
    ko: '각 국가의 문화와 언어에 맞는 카피를 생성하고 있습니다...',
    de: 'Texte werden an Kultur und Sprache jedes Landes angepasst...',
  },
  'copy.countriesAndCopies': {
    en: '{countries} countries · {copies} copies',
    ko: '{countries}개 국가 · {copies}개 카피',
    de: '{countries} Länder · {copies} Texte',
  },

  // ─── Strategic Message ───
  'strategic.loading': {
    en: 'Extracting strategic message based on Market Analyst Report...',
    ko: 'Market Analyst Report를 기반으로 전략 메시지를 추출하고 있습니다...',
    de: 'Copywriting-Strategie wird aus dem Market Analyst Report extrahiert...',
  },

  // ─── Review Results Labels ───
  'review.strengths': { en: 'Strengths', ko: '강점', de: 'Stärken' },
  'review.weaknesses': { en: 'Weaknesses', ko: '약점', de: 'Schwächen' },
  'review.improvements': { en: 'Improvements', ko: '보완', de: 'Verbesserungen' },
  'review.noDetail': { en: 'No review details.', ko: '리뷰 상세 내용 없음', de: 'Keine Überprüfungsdetails.' },
  'review.runningDesc': {
    en: 'Skill review results are being displayed in real-time.',
    ko: '각 스킬별 검증 결과가 실시간으로 표시됩니다.',
    de: 'Skill-Überprüfungsergebnisse werden in Echtzeit angezeigt.',
  },
  'review.doneDesc': {
    en: 'Review completed. Check results per country and copy below. Click a copy to see skill-level details.',
    ko: '리뷰가 완료되었습니다. 아래에서 국가별 · 카피별 결과를 확인하세요. 카피를 클릭하면 스킬별 상세 판정을 볼 수 있습니다.',
    de: 'Überprüfung abgeschlossen. Sehen Sie die Ergebnisse pro Land und Text unten. Klicken Sie auf einen Text für Skill-Details.',
  },
  'review.resultTitle': { en: 'Review Results', ko: 'Review 결과', de: 'Überprüfungsergebnisse' },

  // ─── Workflow Page (actions, sections) ───
  'wf.sampleLoading': { en: 'Loading test sample file...', ko: '테스트 샘플 파일 로드 중...', de: 'Testdatei wird geladen...' },
  'wf.sampleDone': { en: 'Test sample file parsed', ko: '테스트 샘플 파일 파싱 완료', de: 'Testdatei geparst' },
  'wf.sampleFailed': { en: 'Sample load failed: {err}', ko: '샘플 로드 실패: {err}', de: 'Laden der Beispieldatei fehlgeschlagen: {err}' },

  // ─── Chat Placeholders ───
  'chat.ph.step1': {
    en: 'Ask about research input: target audience, key message, tone... (Enter to send)',
    ko: '리서치 입력에 대해 질문하세요: 타겟 오디언스, 키 메시지, 톤 앤 매너... (Enter 전송)',
    de: 'Fragen zur Recherche: Zielgruppe, Kernbotschaft, Tonalität... (Enter zum Senden)',
  },
  'chat.ph.step2': {
    en: 'Ask about analysis: persona, brand fit, competitive keywords... (Enter to send)',
    ko: '분석에 대해 질문하세요: 페르소나, 브랜드 적합도, 경쟁 키워드... (Enter 전송)',
    de: 'Fragen zur Analyse: Persona, Markenpassung, Wettbewerbs-Keywords... (Enter zum Senden)',
  },
  'chat.ph.step3': {
    en: 'Ask about strategic message: core message, pillars direction... (Enter to send)',
    ko: '전략 메시지에 대해 질문하세요: 핵심 메시지, 방향성... (Enter 전송)',
    de: 'Fragen zur strategischen Botschaft: Kernbotschaft, Ausrichtung... (Enter zum Senden)',
  },
  'chat.ph.step4': {
    en: 'Ask about generated copies: headlines, CTA effectiveness... (Enter to send)',
    ko: '생성된 카피에 대해 질문하세요: 헤드라인, CTA 효과... (Enter 전송)',
    de: 'Fragen zu generierten Texten: Überschriften, CTA-Wirkung... (Enter zum Senden)',
  },
  'chat.ph.step5': {
    en: 'Ask about review results: scores, improvement suggestions... (Enter to send)',
    ko: '리뷰 결과에 대해 질문하세요: 점수, 개선 제안... (Enter 전송)',
    de: 'Fragen zu Überprüfungsergebnissen: Bewertungen, Verbesserungsvorschläge... (Enter zum Senden)',
  },
}

export default t
