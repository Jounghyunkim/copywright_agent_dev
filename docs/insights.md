# 주요 인사이트 및 기획 기록

이 문서는 정현님과 지비오가 'Copylight Agent'를 개발하며 나눈 주요 결정사항과 인사이트를 기록합니다.

## 2026-03-13: 프로젝트 시작 및 초기 구조 설정
- **목적:** AI Agent 및 서비스 개발에 몰입하기 위한 구조적 기반 마련.
- **프로젝트 명칭:** `copywrite_agent` (수정됨)
- **최종 산출물 정의 (Copywright):**
    - **본질:** '고객의 행동을 유도하는 전략적 메시지 설계'
    - **핵심 가치 (LG전자 context):** 기술적 우위(Feature)를 고객의 삶의 가치(Benefit)로 번역하는 과정.
    - **표준 프로세스:** 브리핑 → 시장 조사 → 컨셉 도출 → 초안 작성 → 검토 및 수정 → 테스트 및 채택.
- **주요 결정:**
    - 아키텍처: Frontend (React + Vite) / Backend (FastAPI) 분리 구조.
    - 백엔드 기술 스택 확정: FastAPI (REST API), LangGraph, Azure OpenAI, RAG, Multi-Agent 시스템.
    - UI 테마: LG전자 레드(`#A50034`) 기반의 프리미엄 톤 앤 매너 설정.

## ⚙️ 시스템 설계 철학 (Design Philosophy)
1. **해외 법인 맞춤형 (Localization-Centric):** 단순 번역을 넘어 국가별 소비자 감성, 문화적 뉘앙스, 언어적 스타일을 반영한 최적화된 카피 생성.
2. **Multi-Agent Debate:** 생성-비판-조율 역할을 수행하는 다중 에이전트 간의 토론을 통해 품질을 고도화하는 구조.
3. **HITL Decision (Human-in-the-Loop):** AI의 자동화 워크플로우 중간에 마케터의 참여와 컨펌 단계를 배치하여 '사람과 AI의 협업'을 실현.

## 🔄 단계별 에이전트 워크플로우 (Detailed Workflow)
1. **Market Analyst Agent (시장 분석):** 제품 정보, 국가, 타겟 연령대 분석. 타겟 페르소나 추출, 경쟁사 분석, 로컬 키워드 도출.
2. **Copy Generator Agent (카피 생성):** 감성적/기술적 등 다양한 관점의 스타일별 후보군 생성 및 마케터 피드백 수렴.
3. **Brand Critic Agent (브랜드 검증):** LG 브랜드 가이드라인(BCG) 기반 적합성 평가 및 수정 피드백 제공.
4. **Decision Support (최종 선정):** 기획 의도 및 적합성 리포트(테이블 형태) 제공으로 마케터의 최종 의사결정 지원.

## 🏗️ 프론트엔드 아키텍처 (리팩토링)
- **컴포넌트 기반 구조:** 기존의 단일 `App.jsx` 파일을 재사용 가능한 기능 단위의 컴포넌트들로 분리하여 코드의 유지보수성과 확장성을 대폭 향상.
  - `pages/`: `Dashboard.jsx`, `Editor.jsx`와 같이 독립적인 화면 단위를 관리.
  - `components/`: `Header.jsx`, `BriefingForm.jsx` 등 여러 페이지에서 재사용될 수 있는 작은 UI 조각들을 관리.
  - `styles/`: `theme.js` 파일을 통해 색상, 폰트 등 디자인 시스템을 중앙에서 관리.

## 🖼️ 프론트엔드 인터페이스 설계 (Mockup)
- **Briefing Panel (좌측):** 제품명, 국가(USA/GER/IND/KOR), 타겟 연령대, 톤앤매너(Emotional/Rational/Technical), 주요 특징 입력을 위한 폼 구성.
- **Workflow Tracker (상단):** Briefing -> Analysis -> Generation -> Review로 이어지는 에이전트 진행 상태 시각화.
- **Main Dashboard (중앙):** 에이전트와의 실시간 대화 및 분석 결과 리포트 출력 영역.
- **인사이트:**
    - 에이전트 개발 시 자율성, 도구 사용 로직, 서비스 완성도의 밸런스가 중요함.
    - 보안과 개인정보 보호(Gmail 접근 등)를 고려한 설계 필요.
    - 초기 BASE 코드 단계에서 브랜드 아이덴티티를 투영하여 프로젝트의 방향성을 명확히 함.
