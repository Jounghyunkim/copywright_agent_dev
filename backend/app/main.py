import os
import uuid
import json as json_module
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .schemas import (
    CampaignBrief, AnalysisResponse, ChatRequest, ChatResponse,
    GenerateBriefRequest, GenerateBriefResponse,
    StrategicMessageRequest, StrategicMessageResponse,
    GenerateCopyRequest, GenerateCopyResponse,
    ReviewRequest, ReviewSessionResponse, ReviewHistoryResponse,
    CustomSkillCreate, CustomSkillUpdate, SkillResponse,
    SkillDraftRequest,
    CampaignSaveRequest,
)
from .graph import app_graph
from .database import init_db, get_db
from .models import ReviewSession, ReviewResult, CustomSkill, Campaign
from sqlalchemy import func
from .skills.runner import run_review
from .skills.catalog import get_all_skills, BUILTIN_IDS

load_dotenv(dotenv_path='.env')


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print("Database tables initialized.")
    yield


app = FastAPI(title="Copywrite Agent API", lifespan=lifespan)

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

    # Build step-aware system prompt with available context
    step = request.currentStep or 1
    ctx = request.context or {}

    base_instruction = (
        "You are a professional LG marketing copywriting expert and campaign strategist. "
        "Keep answers concise, practical, and actionable. Respond in the same language as the user.\n\n"
    )

    step_instructions = {
        1: "The user is currently writing a campaign brief. Help them fill out fields like target audience, key message, proof points, tone & manner, and market needs. Provide specific, actionable advice.",
        2: "The user is reviewing the Market Analyst Report generated from their brief. Help them interpret the analysis results, discuss persona insights, brand fit scores, competitive keywords, and emotional JTBD. Suggest whether to approve or request modifications.",
        3: "The user is working on the Strategic Message step. Help them refine the Core Message and Message Pillars. Discuss how the strategic direction aligns with the brief and analysis insights.",
        4: "The user is in the Copy Generation step. Help them evaluate generated copy variants, discuss headline/subheadline effectiveness, CTA strength, and cultural appropriateness for each target market.",
        5: "The user is in the Review step where generated copies are being validated by skill-based checks. Help them interpret review results, understand flagged issues, and decide on final copy selections.",
    }

    prompt_parts = [base_instruction, step_instructions.get(step, step_instructions[1])]

    # Attach available artifacts as reference context
    if ctx.get("brief"):
        prompt_parts.append(f"\n\n=== Campaign Brief ===\n{json_module.dumps(ctx['brief'], ensure_ascii=False, indent=2)}")
    if ctx.get("analysisReport"):
        prompt_parts.append(f"\n\n=== Market Analyst Report ===\n{json_module.dumps(ctx['analysisReport'], ensure_ascii=False, indent=2)}")
    if ctx.get("strategicMessage"):
        prompt_parts.append(f"\n\n=== Strategic Message ===\n{json_module.dumps(ctx['strategicMessage'], ensure_ascii=False, indent=2)}")
    if ctx.get("copyResults"):
        # Send summary to avoid token overflow
        copy_summary = []
        for c in ctx["copyResults"][:10]:
            copy_summary.append({k: v for k, v in c.items() if k in ("countryCode", "headline", "subheadline", "cta")})
        prompt_parts.append(f"\n\n=== Generated Copies (summary) ===\n{json_module.dumps(copy_summary, ensure_ascii=False, indent=2)}")
    if ctx.get("reviewResults"):
        prompt_parts.append(f"\n\n=== Review Results ===\n{json_module.dumps(ctx['reviewResults'], ensure_ascii=False, indent=2)}")

    system_prompt = SystemMessage(content="".join(prompt_parts))

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


# ============================================================
# Review Endpoints
# ============================================================

@app.post("/api/v1/campaigns/review")
async def submit_review(request: ReviewRequest, db: AsyncSession = Depends(get_db)):
    """Review 실행 — SSE 스트림으로 스킬별 진행률 + 최종 결과 반환"""
    project_name = request.brief.get("projectName", "unknown")
    print(f"Review requested for: {project_name}, skills: {request.enabledSkills}")

    def _sse(data: dict) -> str:
        return f"data: {json_module.dumps(data, ensure_ascii=False)}\n\n"

    async def event_stream():
        # 1. 세션 생성
        session = ReviewSession(
            project_name=project_name,
            brief_snapshot=request.brief,
            analysis_snapshot=request.analysisReport,
            strategic_message_snapshot=request.strategicMessage,
            selected_copies=[c.model_dump() for c in request.selectedCopies],
            enabled_skills=request.enabledSkills,
            status="running",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        session_id = str(session.id)

        yield _sse({"type": "review_started", "sessionId": session_id, "skills": request.enabledSkills})

        try:
            # 2. 스킬 실행을 위한 카피 목록 준비
            copies_for_runner = [c.model_dump() for c in request.selectedCopies]

            # 3. 스킬 병렬 실행
            completed_skills = set()

            async def on_skill_start(skill_ids):
                pass  # SSE는 이미 위에서 전송

            async def on_skill_complete(result_entry):
                completed_skills.add(result_entry["skill_id"])

            results = await run_review(
                db=db,
                enabled_skills=request.enabledSkills,
                selected_copies=copies_for_runner,
                brief=request.brief,
                analysis_report=request.analysisReport,
                strategic_message=request.strategicMessage,
                on_skill_start=on_skill_start,
                on_skill_complete=on_skill_complete,
            )

            # 4. 결과를 DB에 저장 + SSE 전송
            for r in results:
                db_result = ReviewResult(
                    session_id=session.id,
                    skill_id=r["skill_id"],
                    skill_type=r["skill_type"],
                    target_copy_key=r["target_copy_key"],
                    passed=r["passed"],
                    score=r["score"],
                    findings=r.get("weaknesses", r.get("findings", [])),
                    suggestions=r.get("improvements", r.get("suggestions", [])),
                    raw_llm_response=r.get("raw_llm_response"),
                    execution_ms=r.get("execution_ms", 0),
                )
                db.add(db_result)
                yield _sse({
                    "type": "skill_completed",
                    "skillId": r["skill_id"],
                    "skillType": r["skill_type"],
                    "targetCopyKey": r["target_copy_key"],
                    "passed": r["passed"],
                    "score": r["score"],
                    "strengths": r.get("strengths", []),
                    "weaknesses": r.get("weaknesses", r.get("findings", [])),
                    "improvements": r.get("improvements", r.get("suggestions", [])),
                    "executionMs": r.get("execution_ms", 0),
                })

            # 5. 세션 완료 처리
            session.status = "completed"
            session.completed_at = datetime.now(timezone.utc)
            await db.commit()

            # 6. 요약 전송
            total = len(results)
            passed = sum(1 for r in results if r["passed"])
            avg_score = round(sum(r["score"] for r in results) / total, 1) if total else 0
            yield _sse({
                "type": "review_done",
                "sessionId": session_id,
                "summary": {
                    "total": total,
                    "passed": passed,
                    "failed": total - passed,
                    "avgScore": avg_score,
                },
            })

        except Exception as e:
            print(f"Review failed: {e}")
            session.status = "failed"
            await db.commit()
            yield _sse({"type": "error", "message": f"Review failed: {str(e)}"})

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/v1/campaigns/review/history")
async def get_review_history(project_name: str = None, db: AsyncSession = Depends(get_db)):
    """프로젝트별 리뷰 이력 조회"""
    query = select(ReviewSession).order_by(ReviewSession.created_at.desc())
    if project_name:
        query = query.where(ReviewSession.project_name == project_name)
    query = query.limit(50)

    result = await db.execute(query)
    sessions = [
        {
            "id": str(s.id),
            "projectName": s.project_name,
            "status": s.status,
            "enabledSkills": s.enabled_skills,
            "createdAt": s.created_at.isoformat() if s.created_at else None,
            "completedAt": s.completed_at.isoformat() if s.completed_at else None,
        }
        for s in result.scalars().all()
    ]
    return {"sessions": sessions}


@app.get("/api/v1/campaigns/review/{session_id}")
async def get_review_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """리뷰 세션 결과 조회"""
    try:
        uid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    result = await db.execute(
        select(ReviewSession).where(ReviewSession.id == uid)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Review session not found")

    # 결과 로딩
    results_q = await db.execute(
        select(ReviewResult).where(ReviewResult.session_id == uid)
    )
    results = [
        {
            "id": str(r.id),
            "skillId": r.skill_id,
            "skillType": r.skill_type,
            "targetCopyKey": r.target_copy_key,
            "passed": r.passed,
            "score": r.score,
            "findings": r.findings,
            "suggestions": r.suggestions,
            "executionMs": r.execution_ms,
            "createdAt": r.created_at.isoformat() if r.created_at else None,
        }
        for r in results_q.scalars().all()
    ]

    return {
        "id": str(session.id),
        "projectName": session.project_name,
        "status": session.status,
        "enabledSkills": session.enabled_skills,
        "createdAt": session.created_at.isoformat() if session.created_at else None,
        "completedAt": session.completed_at.isoformat() if session.completed_at else None,
        "results": results,
    }


# ============================================================
# Skill CRUD Endpoints
# ============================================================

@app.get("/api/v1/skills")
async def list_skills(db: AsyncSession = Depends(get_db)):
    """전체 스킬 목록 (빌트인 6개 + 커스텀)"""
    skills = await get_all_skills(db)
    return {"skills": skills}


@app.post("/api/v1/skills", status_code=201)
async def create_skill(skill: CustomSkillCreate, db: AsyncSession = Depends(get_db)):
    """커스텀 스킬 등록"""
    # 빌트인 ID 충돌 체크
    if skill.id in BUILTIN_IDS:
        raise HTTPException(status_code=409, detail=f"Skill ID '{skill.id}' conflicts with a builtin skill")

    # 기존 커스텀 ID 중복 체크
    existing = await db.execute(select(CustomSkill).where(CustomSkill.id == skill.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Skill ID '{skill.id}' already exists")

    # 카테고리 유효성
    if skill.category not in ("validation", "generation", "analysis"):
        raise HTTPException(status_code=422, detail="category must be 'validation', 'generation', or 'analysis'")

    db_skill = CustomSkill(
        id=skill.id,
        label=skill.label,
        description=skill.description,
        category=skill.category,
        prompt_template=skill.prompt_template,
        reference_docs=skill.reference_docs,
        output_schema=skill.output_schema,
    )
    db.add(db_skill)
    await db.commit()
    await db.refresh(db_skill)

    return {
        "id": db_skill.id,
        "label": db_skill.label,
        "description": db_skill.description,
        "category": db_skill.category,
        "type": "custom",
        "editable": True,
    }


@app.get("/api/v1/skills/{skill_id}")
async def get_skill(skill_id: str, db: AsyncSession = Depends(get_db)):
    """단일 스킬 상세 조회"""
    from .skills.catalog import BUILTIN_SKILLS
    # 빌트인 체크
    for bs in BUILTIN_SKILLS:
        if bs["id"] == skill_id:
            return bs

    # 커스텀 체크
    result = await db.execute(select(CustomSkill).where(CustomSkill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    return {
        "id": skill.id,
        "label": skill.label,
        "description": skill.description,
        "category": skill.category,
        "prompt_template": skill.prompt_template,
        "reference_docs": skill.reference_docs,
        "output_schema": skill.output_schema,
        "is_active": skill.is_active,
        "type": "custom",
        "editable": True,
        "createdAt": skill.created_at.isoformat() if skill.created_at else None,
        "updatedAt": skill.updated_at.isoformat() if skill.updated_at else None,
    }


@app.put("/api/v1/skills/{skill_id}")
async def update_skill(skill_id: str, updates: CustomSkillUpdate, db: AsyncSession = Depends(get_db)):
    """커스텀 스킬 수정 (빌트인 수정 불가)"""
    if skill_id in BUILTIN_IDS:
        raise HTTPException(status_code=403, detail="Builtin skills cannot be modified")

    result = await db.execute(select(CustomSkill).where(CustomSkill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    update_data = updates.model_dump(exclude_unset=True)
    if "category" in update_data and update_data["category"] not in ("validation", "generation", "analysis"):
        raise HTTPException(status_code=422, detail="category must be 'validation', 'generation', or 'analysis'")

    for field, value in update_data.items():
        setattr(skill, field, value)

    skill.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(skill)

    return {
        "id": skill.id,
        "label": skill.label,
        "description": skill.description,
        "category": skill.category,
        "type": "custom",
        "editable": True,
    }


@app.delete("/api/v1/skills/{skill_id}")
async def delete_skill(skill_id: str, db: AsyncSession = Depends(get_db)):
    """커스텀 스킬 삭제 (빌트인 삭제 불가)"""
    if skill_id in BUILTIN_IDS:
        raise HTTPException(status_code=403, detail="Builtin skills cannot be deleted")

    result = await db.execute(select(CustomSkill).where(CustomSkill.id == skill_id))
    skill = result.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    await db.delete(skill)
    await db.commit()
    return {"status": "deleted", "id": skill_id}


# ============================================================
# Skill Draft Generation
# ============================================================

@app.post("/api/v1/skills/generate-draft")
async def generate_skill_draft(request: SkillDraftRequest):
    """사용자의 핵심 입력으로부터 스킬 전체 초안을 AI로 생성"""
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_core.output_parsers import JsonOutputParser
    import json

    llm = AzureChatOpenAI(
        azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        temperature=0.5,
    )

    system_prompt = """You are a senior QA & copywriting expert at LG Electronics.
Given a user's description of WHY they need a review skill and WHAT it should do, generate a complete skill definition.

Return a JSON object with these exact keys:

{
  "id": "kebab-case-skill-id (unique, descriptive, e.g. 'promo-legal-check')",
  "label": "Human-readable skill name in Korean (e.g. '프로모션 법적 검증')",
  "description": "1-2 sentence description of what this skill does, in Korean",
  "category": "validation",
  "prompt_template": "A detailed prompt template that an LLM will use to evaluate copywriting. The prompt should:\n  - Clearly state the evaluation criteria\n  - Reference {{copies}}, {{brief}}, {{analysis_report}}, {{strategic_message}} as template variables\n  - Include scoring rubric (0-100)\n  - Define pass/fail threshold\n  - Specify output format with: score, passed, strengths[], weaknesses[], improvements[]\n  - Be written in Korean for the marketing team\n  - Include the good/bad examples provided by the user as reference cases",
  "output_schema": {
    "type": "object",
    "properties": {
      "score": {"type": "number", "description": "0-100 점수"},
      "passed": {"type": "boolean"},
      "strengths": {"type": "array", "items": {"type": "string"}},
      "weaknesses": {"type": "array", "items": {"type": "string"}},
      "improvements": {"type": "array", "items": {"type": "string"}}
    }
  }
}

IMPORTANT:
- The prompt_template is the most critical field — it must be thorough, precise, and actionable
- category should always be "validation" for review skills
- The id must be kebab-case, 3-5 words, unique and descriptive
- Write everything in Korean except the id and JSON keys"""

    user_content = f"""## 작성 목적
{request.purpose}

## 스킬 목적
{request.goal}"""

    if request.goodExample:
        user_content += f"\n\n## 좋은 예시\n{request.goodExample}"
    if request.badExample:
        user_content += f"\n\n## 나쁜 예시\n{request.badExample}"

    user_content += "\n\n위 정보를 기반으로 완전한 스킬 정의를 JSON으로 생성해 주세요."

    try:
        parser = JsonOutputParser()
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_content),
        ]
        response = await llm.ainvoke(messages)
        data = parser.parse(response.content)
        return {"status": "success", "data": data}
    except Exception as e:
        print(f"Skill draft generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Skill draft generation failed: {str(e)}")


# ============================================================
# Campaign Save / Dashboard Endpoints
# ============================================================

@app.post("/api/v1/campaigns/save", status_code=201)
async def save_campaign(request: CampaignSaveRequest, db: AsyncSession = Depends(get_db)):
    """단계별 산출물 + Review 결과를 Campaign으로 저장"""
    brief = request.brief
    project_name = brief.get("projectName", "Untitled")

    # 타겟 국가 추출
    countries = list({r.get("countryCode", "") for r in (request.copyResults or []) if r.get("countryCode")})

    # Brand Fit Score 추출
    brand_fit = request.analysisReport.get("brandFit", {})
    brand_fit_score = brand_fit.get("score", 0) if isinstance(brand_fit, dict) else 0

    # Review 평균 점수
    review_avg = 0
    if request.reviewSummary and request.reviewSummary.get("avgScore"):
        review_avg = round(request.reviewSummary["avgScore"])

    # 총 카피 수
    total_copies = sum(len(r.get("copies", [r])) for r in (request.copyResults or []))

    campaign = Campaign(
        project_name=project_name,
        brief=brief,
        analysis_report=request.analysisReport,
        strategic_message=request.strategicMessage,
        copy_results=request.copyResults,
        review_summary=request.reviewSummary,
        review_results=request.reviewResults,
        target_countries=countries,
        brand_fit_score=brand_fit_score,
        review_avg_score=review_avg,
        total_copies=total_copies,
        status="completed",
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    return {
        "id": str(campaign.id),
        "projectName": campaign.project_name,
        "status": "saved",
    }


@app.get("/api/v1/campaigns/dashboard")
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    """Dashboard 통계 + 최근 캠페인 목록"""
    # 최근 캠페인 20개
    result = await db.execute(
        select(Campaign).order_by(Campaign.created_at.desc()).limit(20)
    )
    campaigns = result.scalars().all()

    # 통계 계산
    total_projects = len(campaigns)
    all_countries = set()
    brand_scores = []
    review_scores = []
    for c in campaigns:
        all_countries.update(c.target_countries or [])
        if c.brand_fit_score > 0:
            brand_scores.append(c.brand_fit_score)
        if c.review_avg_score > 0:
            review_scores.append(c.review_avg_score)

    avg_brand_score = round(sum(brand_scores) / len(brand_scores), 1) if brand_scores else 0
    avg_review_score = round(sum(review_scores) / len(review_scores), 1) if review_scores else 0
    target_regions = len(all_countries)

    campaign_list = [
        {
            "id": str(c.id),
            "title": c.project_name,
            "countries": c.target_countries or [],
            "date": c.created_at.strftime("%Y-%m-%d") if c.created_at else "",
            "brandFitScore": c.brand_fit_score,
            "reviewAvgScore": c.review_avg_score,
            "totalCopies": c.total_copies,
            "status": c.status,
            "summary": c.brief.get("projectContext", "")[:120] if isinstance(c.brief, dict) else "",
        }
        for c in campaigns
    ]

    return {
        "stats": {
            "totalProjects": total_projects,
            "avgBrandScore": avg_brand_score,
            "avgReviewScore": avg_review_score,
            "targetRegions": target_regions,
        },
        "campaigns": campaign_list,
    }


@app.get("/api/v1/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    """캠페인 상세 조회 — 전체 산출물 반환"""
    try:
        uid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign ID format")

    result = await db.execute(select(Campaign).where(Campaign.id == uid))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {
        "id": str(campaign.id),
        "projectName": campaign.project_name,
        "brief": campaign.brief,
        "analysisReport": campaign.analysis_report,
        "strategicMessage": campaign.strategic_message,
        "copyResults": campaign.copy_results,
        "reviewSummary": campaign.review_summary,
        "reviewResults": campaign.review_results,
        "targetCountries": campaign.target_countries,
        "brandFitScore": campaign.brand_fit_score,
        "reviewAvgScore": campaign.review_avg_score,
        "totalCopies": campaign.total_copies,
        "status": campaign.status,
        "createdAt": campaign.created_at.isoformat() if campaign.created_at else None,
    }


@app.delete("/api/v1/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    """캠페인 삭제"""
    try:
        uid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign ID format")

    result = await db.execute(select(Campaign).where(Campaign.id == uid))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    await db.delete(campaign)
    await db.commit()
    return {"status": "deleted", "id": campaign_id}


@app.put("/api/v1/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, request: CampaignSaveRequest, db: AsyncSession = Depends(get_db)):
    """기존 캠페인 업데이트"""
    try:
        uid = uuid.UUID(campaign_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid campaign ID format")

    result = await db.execute(select(Campaign).where(Campaign.id == uid))
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    brief = request.brief
    campaign.project_name = brief.get("projectName", campaign.project_name)
    campaign.brief = brief
    campaign.analysis_report = request.analysisReport
    campaign.strategic_message = request.strategicMessage
    campaign.copy_results = request.copyResults
    campaign.review_summary = request.reviewSummary
    campaign.review_results = request.reviewResults
    campaign.target_countries = list({r.get("countryCode", "") for r in (request.copyResults or []) if r.get("countryCode")})

    brand_fit = request.analysisReport.get("brandFit", {})
    campaign.brand_fit_score = brand_fit.get("score", 0) if isinstance(brand_fit, dict) else 0

    if request.reviewSummary and request.reviewSummary.get("avgScore"):
        campaign.review_avg_score = round(request.reviewSummary["avgScore"])

    campaign.total_copies = sum(len(r.get("copies", [r])) for r in (request.copyResults or []))

    await db.commit()
    await db.refresh(campaign)

    return {
        "id": str(campaign.id),
        "projectName": campaign.project_name,
        "status": "updated",
    }
