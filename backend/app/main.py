import os
import json as json_module
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from .schemas import CampaignBrief, AnalysisResponse, ChatRequest, ChatResponse, GenerateBriefRequest, GenerateBriefResponse, StrategicMessageRequest, StrategicMessageResponse, GenerateCopyRequest, GenerateCopyResponse
from .graph import app_graph

load_dotenv(dotenv_path='.env')

app = FastAPI(title="Copywrite Agent API")

# --- CORS Middleware ---
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5001", # Added new frontend port
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Copywrite Agent Backend API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/v1/campaigns/analyze")
async def analyze_campaign(brief: CampaignBrief):
    print(f"Received analysis request for: {brief.projectName}")

    def _sse(data: dict) -> str:
        return f"data: {json_module.dumps(data, ensure_ascii=False)}\n\n"

    async def event_stream():
        yield _sse({"type": "progress", "message": f"Received analysis request for: {brief.projectName}"})

        inputs = {"brief": brief.dict()}
        completed_parallel = set()
        final_report = None

        try:
            async for event in app_graph.astream(inputs, stream_mode="updates"):
                for node_name, node_output in event.items():
                    if node_name == "query_planner":
                        queries = node_output.get("search_queries", [])
                        yield _sse({"type": "progress", "message": "--- NODE 1: QUERY PLANNER ---"})
                        q_list = ", ".join(f"'{q}'" for q in queries)
                        yield _sse({"type": "progress", "message": f"Generated {len(queries)} search queries: [{q_list}]"})
                        yield _sse({"type": "progress", "message": "--- NODE 2a: WEB SEARCH ---"})
                        yield _sse({"type": "progress", "message": "--- NODE 2b: ENHANCED RAG ---"})

                    elif node_name == "web_search":
                        results = node_output.get("web_results", [])
                        yield _sse({"type": "progress", "message": f"Web search returned {len(results)} unique results."})
                        completed_parallel.add("web_search")
                        if completed_parallel >= {"web_search", "enhanced_rag"}:
                            yield _sse({"type": "progress", "message": "--- NODE 3: SYNTHESIZER ---"})
                            yield _sse({"type": "progress", "message": "Invoking synthesizer LLM..."})

                    elif node_name == "enhanced_rag":
                        results = node_output.get("rag_results", [])
                        yield _sse({"type": "progress", "message": f"RAG retrieved {len(results)} unique documents."})
                        completed_parallel.add("enhanced_rag")
                        if completed_parallel >= {"web_search", "enhanced_rag"}:
                            yield _sse({"type": "progress", "message": "--- NODE 3: SYNTHESIZER ---"})
                            yield _sse({"type": "progress", "message": "Invoking synthesizer LLM..."})

                    elif node_name == "synthesizer":
                        final_report = node_output.get("analysis_report", {})

            yield _sse({"type": "result", "status": "success", "data": final_report})

        except FileNotFoundError as e:
            print(f"FAISS index not found: {e}")
            yield _sse({"type": "error", "message": "Knowledge base index not found. Please run the data ingestion script first."})
        except Exception as e:
            print(f"Analysis failed: {e}")
            yield _sse({"type": "error", "message": f"Analysis failed: {str(e)}"})

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/v1/campaigns/strategic-message", response_model=StrategicMessageResponse)
async def extract_strategic_message(request: StrategicMessageRequest):
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_core.output_parsers import JsonOutputParser
    import json

    print(f"Extracting strategic message from analysis report...")

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.7,
    )

    system_prompt = """You are a senior Brand Strategist at LG Electronics, specializing in strategic message architecture.

Given a Campaign Brief and its Market Analyst Report, extract and synthesize the **Strategic Message** — the core communication strategy that will guide all downstream copy generation.

Your output must be a JSON object with these exact keys:

{
  "coreMessage": "The single, overarching strategic message (1-2 sentences) that captures the essence of what this campaign must communicate. It should bridge the brand's value proposition with the consumer's emotional need.",
  "messagePillars": [
    {
      "title": "Pillar name (e.g., 'Emotional Connection', 'Functional Excellence')",
      "description": "How this pillar supports the core message and connects to the target persona's needs"
    }
  ],
  "emotionalHook": "The primary emotional trigger that will capture attention and drive engagement — derived from the Emotional JTBD and Cultural Tension insights",
  "toneDirection": {
    "primary": "The dominant tone (e.g., 'Warm yet authoritative', 'Aspirational but grounded')",
    "avoid": "Tones or approaches to avoid based on competitive analysis and brand fit",
    "voiceCharacter": "If this brand were a person speaking, describe their character in one sentence"
  },
  "keyPhrases": ["phrase1", "phrase2", "phrase3", "...up to 8 key phrases that should appear in or inspire the final copy"]
}

IMPORTANT:
- The coreMessage must directly stem from the emotionalJTBD and categoryNarrative shift
- messagePillars should be 2-4 items, each grounded in the analysis report findings
- keyPhrases should include both recommended keywords and newly synthesized phrases
- Everything must be aligned with the brand fit assessment and copy implications
- Write in the same language context as the brief (if Korean brief, Korean output; if English brief, English output)"""

    try:
        parser = JsonOutputParser()
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"## Campaign Brief\n```json\n{json.dumps(request.brief, ensure_ascii=False, indent=2)}\n```\n\n## Market Analyst Report\n```json\n{json.dumps(request.analysisReport, ensure_ascii=False, indent=2)}\n```\n\nPlease extract the Strategic Message based on the above inputs."),
        ]
        response = await llm.ainvoke(messages)
        data = parser.parse(response.content)
        return {"status": "success", "data": data}
    except Exception as e:
        print(f"Strategic message extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Strategic message extraction failed: {str(e)}")


@app.post("/api/v1/campaigns/generate-copy", response_model=GenerateCopyResponse)
async def generate_copy(request: GenerateCopyRequest):
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_core.output_parsers import JsonOutputParser
    import json

    config = request.config
    countries_str = ", ".join(config.countries)
    print(f"Generating copy for countries: {countries_str}")

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.7,
    )

    country_names = {
        "US": "USA (English)", "DE": "Germany (Deutsch)", "GB": "UK (English)",
        "FR": "France (Français)", "IT": "Italy (Italiano)", "ES": "Spain (Español)",
        "IN": "India (English/Hindi)", "BR": "Brazil (Português)", "KR": "Korea (한국어)",
        "AU": "Australia (English)", "ID": "Indonesia (Bahasa Indonesia)", "SA": "Saudi Arabia (العربية)",
    }

    copy_count = min(max(config.copyCount, 1), 10)

    system_prompt = f"""You are a world-class multilingual copywriter for LG Electronics with deep expertise in cultural adaptation and localization.

Given the Campaign Brief, Market Analyst Report, Strategic Message, and Generation Config, generate culturally adapted copy for EACH target country.

## Generation Config
- Target Countries: {', '.join(country_names.get(c, c) for c in config.countries)}
- Target Age Groups: {', '.join(config.ageGroups)}
- Personas: {', '.join(config.personas)}
- Active Skillsets: {', '.join(config.skillsets)}
- Number of Copy Variants per Country: {copy_count}

## Skillset Instructions
Apply these checks/enhancements based on active skillsets:
- ai-washing-risk-check: Avoid vague AI claims ("AI-powered", "smart") without concrete benefit proof
- brand-lexicon-check: Use LG-approved terminology (Life's Good, ThinQ, etc.) correctly
- campaign-brief-normalizer: Ensure copy aligns with brief objectives and key messages
- channel-variant-generator: Optimize copy length and format for digital channels
- cultural-sensitivity-check: Verify cultural appropriateness for each market
- tone-consistency-guard: Maintain consistent tone across all country variants

## Output Format
Return a JSON array. For EACH country, produce one object containing a "copies" array with exactly {copy_count} distinct copy variants:

[
  {{
    "countryCode": "XX",
    "copies": [
      {{
        "headline": "Attention-grabbing headline in the LOCAL LANGUAGE of that country",
        "subheadline": "Supporting subheadline in LOCAL LANGUAGE",
        "bodyCopy": "2-3 sentence body copy in LOCAL LANGUAGE that connects the strategic message to the local consumer's emotional need",
        "cta": "Call-to-action text in LOCAL LANGUAGE",
        "methodology": "1-2 sentences in Korean explaining HOW you crafted this copy — which strategic pillar, persona insight, or cultural factor drove the creative choices",
        "culturalNotes": "1-2 sentences in Korean explaining the cultural adaptation — what was localized and why (idioms, humor style, formality level, cultural references)",
        "toneAnalysis": "1 sentence in Korean describing the tone used and how it differs from other markets"
      }}
    ]
  }}
]

CRITICAL RULES:
- Each country MUST have exactly {copy_count} copy variants in the "copies" array
- Each variant should take a DIFFERENT creative angle (different hook, tone variation, or emphasis) while staying aligned with the strategic message
- headline, subheadline, bodyCopy, cta MUST be written in the LOCAL LANGUAGE of each country
- methodology, culturalNotes, toneAnalysis are always in Korean (for the Korean marketing team to understand)
- Each country's copy must feel native, not translated — use local idioms, cultural references, and communication styles
- Adapt formality, humor, directness based on each culture's communication norms
- For Arabic (SA): ensure right-to-left friendly phrasing
- For multilingual markets (IN): default to English with Hindi cultural sensibility"""

    try:
        parser = JsonOutputParser()
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"""## Campaign Brief
```json
{json.dumps(request.brief, ensure_ascii=False, indent=2)}
```

## Market Analyst Report
```json
{json.dumps(request.analysisReport, ensure_ascii=False, indent=2)}
```

## Strategic Message
```json
{json.dumps(request.strategicMessage, ensure_ascii=False, indent=2)}
```

Please generate culturally adapted copy for each target country."""),
        ]
        response = await llm.ainvoke(messages)
        data = parser.parse(response.content)
        return {"status": "success", "data": data}
    except Exception as e:
        print(f"Copy generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Copy generation failed: {str(e)}")


@app.post("/api/v1/campaigns/generate-brief", response_model=GenerateBriefResponse)
async def generate_brief(request: GenerateBriefRequest):
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_core.output_parsers import JsonOutputParser

    print(f"Generating brief draft for: {request.projectName}")

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.7,
    )

    # Load objective generation guide from file
    guide_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "brief_objective_gen_guide.md")
    try:
        with open(guide_path, "r", encoding="utf-8") as f:
            objective_guide = f.read()
    except FileNotFoundError:
        objective_guide = ""
        print(f"WARNING: Objective guide not found at {guide_path}")

    brief_guide = f"""You are a senior Brand Strategist with 15+ years of experience in global campaign planning for LG Electronics.
You are given a Project Name and a Project Context that describes WHY this campaign is needed. Use these two inputs to generate the REMAINING fields of an LG standard campaign brief.

Your output must be deeply informed by the Project Context — the objectives, audience, messaging, and strategy should all directly stem from the stated context and reasons for the campaign.

## Objective 작성 지침 (매우 중요 — 반드시 아래 가이드를 따르세요)

{objective_guide}

## 나머지 항목 작성 지침

나머지 항목들도 Project Context에서 논리적으로 파생되어야 합니다.

## 출력 형식

Return ONLY a valid JSON object with these exact keys (all values as strings in Korean):
{{
  "objectiveCommercial": "위 Objective 가이드의 Commercial 지침에 따라 1~2개 항목을 작성. 각 항목은 '~하는 것입니다' 형태의 완결된 문장.",
  "objectiveBehavior": "위 Objective 가이드의 Behavior 지침에 따라 1~2개 항목을 작성. 타깃의 동기를 반영한 완결된 문장.",
  "objectiveAttitudinal": "위 Objective 가이드의 Attitudinal 지침에 따라 1~2개 항목을 작성. Context의 고유 키워드를 활용한 완결된 문장.",
  "audience": "Primary/Secondary 타겟을 Project Context의 제품/시장에 맞춰 구체적으로 정의 — 인구통계, 라이프스타일, 구매 행동, 페인 포인트 포함",
  "keyMessage": "Project Context의 핵심 가치를 소비자 관점의 Benefit으로 변환한 1-2문장 (기능 나열 아닌 감정적 가치, Life's Good 연결)",
  "proofPoints": "Key Message 뒷받침 근거 1~3개 — Project Context에서 언급된 기술적 우위, 수상, 실적 등을 구체적 출처와 함께 서술",
  "mandatories": "Project Context의 시장/채널 특성에 맞는 매체 믹스, 제작물 스펙, 브랜드 가이드라인 준수 사항",
  "budget": "캠페인 규모에 적합한 총 예산 및 매체별 배분 비중 제안",
  "marketNeeds": "Project Context에서 파악한 타겟 국가/지역, 언어 variation, 문화적 고려사항, 현지 경쟁 환경",
  "timing": "Project Context의 런칭/시즌 정보에 맞춘 집행 기간, 페이즈 구분 (티징→런칭→서스테인), 제작 마감일"
}}

IMPORTANT: Every field must logically connect back to the Project Context. Do not generate generic content — make it specific to THIS project."""

    try:
        parser = JsonOutputParser()
        messages = [
            SystemMessage(content=brief_guide),
            HumanMessage(content=f"프로젝트명: {request.projectName}\n\nProject Context:\n{request.projectContext}\n\n위 프로젝트의 배경과 맥락을 바탕으로, 나머지 브리프 항목을 JSON으로 작성해 주세요."),
        ]
        response = await llm.ainvoke(messages)
        data = parser.parse(response.content)
        return {"status": "success", "data": data}
    except Exception as e:
        print(f"Brief generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {str(e)}")


@app.post("/api/v1/campaigns/chat", response_model=ChatResponse)
async def chat_with_agent(request: ChatRequest):
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.7,
    )

    system_prompt = SystemMessage(content=(
        "You are a professional LG marketing copywriting expert and campaign strategist. "
        "Help users craft effective campaign briefs by answering questions about target audiences, "
        "tone & manner, key benefits, market trends, and copywriting best practices. "
        "Keep answers concise, practical, and actionable. Respond in the same language as the user."
    ))

    history = [system_prompt]
    for msg in request.messages:
        if msg.role == "user":
            history.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            history.append(AIMessage(content=msg.content))

    try:
        response = await llm.ainvoke(history)
        return {"reply": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
