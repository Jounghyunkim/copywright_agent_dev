# 차기 세션 실행 계획: Market Analyst Agent 실체화 🚀

본 계획은 `copywrite_agent`의 첫 번째 단계인 'Market Analyst Agent'를 실제로 작동하게 만들기 위한 구체적인 개발 로드맵입니다.

## 1. 지식 기반(Knowledge Base) 구축 및 RAG 연동
- **데이터 수집:** 
    - LG 글로벌 광고 레거시 데이터 (최근 3년치 캠페인 카피 등)
    - 브랜드 사전 및 BCG (Brand Communication Guidelines) 텍스트 데이터
    - 타겟 국가별(미국, 독일, 인도 등) 소비자 트렌드 리포트 (샘플 데이터)
- **Azure AI Search 연동:**
    - 수집된 데이터를 Azure AI Search(구 Cognitive Search)에 인덱싱.
    - Azure OpenAI의 `text-embedding-ada-002`를 사용하여 벡터 검색 엔진 구축.
- **RAG 로직 구현:** 
    - 사용자 입력(제품명, 타겟 국가 등)을 기반으로 관련성 높은 로컬 컨텍스트를 검색하여 프롬프트에 주입하는 `retriever` 함수 작성.

## 2. Market Analyst 전용 프롬프트 엔지니어링
- **Persona Extraction Prompt:** 제품 기술 명세서를 분석하여 해당 국가의 어떤 페르소나가 이 혜택에 가장 열광할지 정의하는 페르소나 생성 프롬프트 설계.
- **Competitive Analysis Prompt:** RAG로 검색된 경쟁사 사례와 비교하여 LG만의 차별화 포인트를 도출하는 분석 프롬프트 설계.
- **Local Keyword Discovery Prompt:** 타겟 국가의 문화적 감수성이 담긴 슬랭, 관용구, 키워드를 추천하는 로직 설계.

## 3. 백엔드(LangGraph) 실현 및 코드 구현
- **`app/analyst.py` 모듈 생성:** 
    - `market_analyst` 노드의 상세 로직을 클래스화하여 구현.
    - Azure OpenAI Chat 모델과 RAG 엔진을 결합한 Chain 구성.
- **State 업데이트 로직:** 
    - 분석 결과(Persona, Keywords 등)를 `AgentState`의 `context` 필드에 정확히 매핑하여 다음 에이전트(`Copy Generator`)가 사용할 수 있도록 데이터 스키마 확정.

## 4. 프론트엔드 연동 및 검증
- **분석 결과 시각화:** Market Analyst가 분석한 페르소나와 키워드를 프론트엔드 UI에서 카드 형태로 보여주는 컴포넌트 추가.
- **HITL Gate 1 구현:** 마케터가 시장 분석 결과를 보고 [수정/확정]할 수 있는 대기 로직 및 인터페이스 연동.

## 5. 테스트 및 최적화 (Validation)
- **국가별 비교 테스트:** 같은 '냉장고' 제품이라도 '미국'과 '인도'를 선택했을 때 도출되는 페르소나와 키워드가 실제로 문화적으로 유의미하게 차이나는지 검증.

---
**지비오의 생각:** 
다음 세션에서 가장 먼저 해야 할 일은 **'검색할 수 있는 기초 데이터(LG 광고 레거시 등)를 어떻게 구성할 것인가'**에 대한 논의입니다. 데이터만 준비된다면 바로 Azure AI Search 연동부터 시작하겠습니다! 🔥
