"""LLM 호출 레이트 리밋 보호 — 동시성 세마포어 + 지수 백오프 재시도.

모든 스킬 러너(`skillmd_runner`, `custom_runner`)는 이 모듈의 `invoke_llm`을
경유해 LLM을 호출한다. Azure OpenAI `429 Too Many Requests` 및 `503`,
`timeout` 등 일시적 오류를 자동으로 재시도하며, 재시도 이벤트는 현재 요청
컨텍스트(`ContextVar`)에 등록된 콜백으로 비동기 통지한다.

환경변수 (backend/.env):
  LLM_MAX_CONCURRENCY     — 동시 호출 상한 (기본 4)
  LLM_RETRY_MAX_ATTEMPTS  — 재시도 포함 총 시도 횟수 (기본 4)
  LLM_RETRY_BASE_SECONDS  — 초기 백오프 (기본 1.0초)
  LLM_RETRY_MAX_SECONDS   — 최대 대기 (기본 30.0초)
"""
from __future__ import annotations

import asyncio
import contextvars
import os
import random
from typing import Any, Awaitable, Callable, Optional

# ─────────────────────────────────────────────
# 동시성 세마포어 — 프로세스 전역 단일 인스턴스
# ─────────────────────────────────────────────
_llm_semaphore: Optional[asyncio.Semaphore] = None


def _get_semaphore() -> asyncio.Semaphore:
    global _llm_semaphore
    if _llm_semaphore is None:
        limit = max(1, int(os.getenv("LLM_MAX_CONCURRENCY", "4")))
        _llm_semaphore = asyncio.Semaphore(limit)
    return _llm_semaphore


# ─────────────────────────────────────────────
# 재시도 이벤트 콜백 — 요청 스코프(ContextVar)
# ─────────────────────────────────────────────
RetryEventCallback = Callable[[dict], Awaitable[None]]

_retry_event_cb: contextvars.ContextVar[Optional[RetryEventCallback]] = (
    contextvars.ContextVar("_retry_event_cb", default=None)
)


def set_retry_event_callback(cb: Optional[RetryEventCallback]) -> None:
    """현재 asyncio context에 재시도 이벤트 콜백 등록. None → 해제."""
    _retry_event_cb.set(cb)


async def _emit_retry_event(
    skill_id: str,
    attempt: int,
    max_attempts: int,
    wait_seconds: float,
    is_rate_limit: bool,
    error_msg: str,
) -> None:
    cb = _retry_event_cb.get()
    if cb is None:
        return
    try:
        await cb(
            {
                "type": "skill_retrying",
                "skillId": skill_id,
                "attempt": attempt,
                "maxAttempts": max_attempts,
                "waitSeconds": round(wait_seconds, 1),
                "reason": "rate_limit" if is_rate_limit else "transient_error",
                "error": error_msg[:200],
            }
        )
    except Exception:
        # 콜백 실패가 본 LLM 호출을 깨뜨리지 않도록 보호
        pass


# ─────────────────────────────────────────────
# 재시도 대상 분류
# ─────────────────────────────────────────────
_RATE_LIMIT_MARKERS = ("429", "too_many_requests", "rate_limit", "ratelimit")
_TRANSIENT_MARKERS = (
    "503",
    "service_unavailable",
    "timeout",
    "timed out",
    "502",
    "bad gateway",
    "connection reset",
    "temporarily unavailable",
)


def _is_rate_limit(exc: Exception) -> bool:
    m = str(exc).lower()
    return any(k in m for k in _RATE_LIMIT_MARKERS)


def _is_retryable(exc: Exception) -> bool:
    m = str(exc).lower()
    return _is_rate_limit(exc) or any(k in m for k in _TRANSIENT_MARKERS)


def _compute_wait(attempt: int) -> float:
    """지수 백오프 + ±30% 지터. attempt는 1-indexed."""
    base = float(os.getenv("LLM_RETRY_BASE_SECONDS", "1.0"))
    cap = float(os.getenv("LLM_RETRY_MAX_SECONDS", "30.0"))
    raw = base * (2 ** (attempt - 1))
    raw = min(cap, raw)
    # ±30% jitter (0.7x ~ 1.3x)
    return raw * (0.7 + random.random() * 0.6)


# ─────────────────────────────────────────────
# 공용 호출 래퍼
# ─────────────────────────────────────────────
async def invoke_llm(llm: Any, messages: list, skill_id: str = "") -> Any:
    """LLM `ainvoke`를 동시성 캡·재시도로 보호.

    - 세마포어 안에서 `llm.ainvoke(messages)` 호출
    - 일시적 오류(429/503/timeout)는 지수 백오프로 재시도
    - 재시도 시도 시 등록된 콜백(set_retry_event_callback)을 호출해 UI에 통지
    - 비재시도 오류 또는 최대 시도 초과 시 원본 예외를 그대로 전파
    """
    max_attempts = max(1, int(os.getenv("LLM_RETRY_MAX_ATTEMPTS", "4")))
    semaphore = _get_semaphore()
    last_err: Optional[Exception] = None

    for attempt in range(1, max_attempts + 1):
        try:
            async with semaphore:
                return await llm.ainvoke(messages)
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            if attempt >= max_attempts or not _is_retryable(exc):
                raise
            wait = _compute_wait(attempt)
            is_rl = _is_rate_limit(exc)
            print(
                f"[rate_limit] {skill_id or 'llm'} retry "
                f"{attempt}/{max_attempts} after {wait:.1f}s "
                f"({'rate_limit' if is_rl else 'transient'}): {str(exc)[:120]}"
            )
            await _emit_retry_event(
                skill_id=skill_id,
                attempt=attempt,
                max_attempts=max_attempts,
                wait_seconds=wait,
                is_rate_limit=is_rl,
                error_msg=str(exc),
            )
        # 세마포어를 이미 풀어놓은 상태에서 대기 — 다른 대기 중인 호출이 진행 가능
        await asyncio.sleep(wait)

    # 방어적: 도달 불가 경로
    if last_err is not None:
        raise last_err
    raise RuntimeError("invoke_llm: no attempts were made")
