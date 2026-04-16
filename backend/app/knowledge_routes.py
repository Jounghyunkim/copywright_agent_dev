"""
Knowledge Base management — Copywriter 페르소나 지식 구축 API.

Documents are chunked, embedded (Azure OpenAI), and stored in a separate
FAISS index (solmi_index). Metadata lives in PostgreSQL (knowledge_documents).

Endpoints (all admin-only):
  GET    /admin/knowledge           — list documents
  POST   /admin/knowledge           — upload file(s) + category
  POST   /admin/knowledge/text      — direct text input + category
  DELETE /admin/knowledge/{id}      — remove document + its vectors
"""

from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy import select

from .auth.admin_routes import require_admin
from .auth.middleware import AuthContext
from .database import async_session
from .models import KnowledgeDocument

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/knowledge", tags=["knowledge"])

# ── FAISS index helpers ──

_SOLMI_INDEX_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "solmi_index"
)

# Module-level cache
_vector_store = None


def _get_embeddings():
    from langchain_openai import AzureOpenAIEmbeddings

    return AzureOpenAIEmbeddings(
        azure_deployment=os.getenv("EMBEDDING_DEPLOYMENT", "text-embedding-3-large"),
        api_key=os.getenv("AZURE_OPENAI_API_KEY"),
        azure_endpoint=os.getenv("EMBEDDING_ENDPOINT", os.getenv("AZURE_OPENAI_ENDPOINT", "")),
        api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
    )


def _load_or_create_index():
    """Load existing FAISS index or create empty one."""
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    from langchain_community.vectorstores import FAISS

    embeddings = _get_embeddings()
    if os.path.exists(os.path.join(_SOLMI_INDEX_DIR, "index.faiss")):
        _vector_store = FAISS.load_local(
            _SOLMI_INDEX_DIR, embeddings, allow_dangerous_deserialization=True,
        )
    else:
        # Create empty index with a dummy doc, then remove it
        from langchain_core.documents import Document

        _vector_store = FAISS.from_documents(
            [Document(page_content="__init__", metadata={"doc_id": -1})],
            embeddings,
        )
        # Remove the dummy
        dummy_ids = [
            k for k, v in _vector_store.docstore._dict.items()
            if v.metadata.get("doc_id") == -1
        ]
        if dummy_ids:
            _vector_store.delete(dummy_ids)
        _save_index()
    return _vector_store


def _save_index():
    global _vector_store
    if _vector_store is None:
        return
    os.makedirs(_SOLMI_INDEX_DIR, exist_ok=True)
    _vector_store.save_local(_SOLMI_INDEX_DIR)


def _chunk_text(text: str, chunk_size: int = 400, chunk_overlap: int = 80) -> list[str]:
    """Split text into paragraph-aware chunks (short breath, per strategy doc)."""
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", "!", "?", " "],
    )
    docs = splitter.split_text(text)
    return [d.strip() for d in docs if d.strip()]


# ── Response schemas ──

class KnowledgeDocResponse(BaseModel):
    id: int
    filename: str
    category: str
    chunk_count: int
    total_chars: int
    added_by: str
    created_at: str


# ── 1. List documents ──

@router.get("", response_model=list[KnowledgeDocResponse])
async def list_knowledge(_ctx: AuthContext = Depends(require_admin)):
    async with async_session() as db:
        rows = (await db.execute(
            select(KnowledgeDocument).order_by(KnowledgeDocument.created_at.desc())
        )).scalars().all()
    return [
        KnowledgeDocResponse(
            id=r.id,
            filename=r.filename,
            category=r.category,
            chunk_count=r.chunk_count,
            total_chars=r.total_chars,
            added_by=r.added_by,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in rows
    ]


# ── 2. Upload file(s) ──

@router.post("", response_model=list[KnowledgeDocResponse], status_code=201)
async def upload_knowledge(
    files: list[UploadFile] = File(...),
    category: str = Form("인사이트"),
    ctx: AuthContext = Depends(require_admin),
):
    from .main import _extract_file_text  # reuse chat attachment extractor

    results: list[KnowledgeDocResponse] = []
    vs = _load_or_create_index()

    for f in files:
        raw = await f.read()
        filename = f.filename or "unknown"
        text, truncated, error = _extract_file_text(filename, raw)
        if error or not text.strip():
            logger.warning("Knowledge upload skipped %s: %s", filename, error)
            continue

        chunks = _chunk_text(text)
        if not chunks:
            continue

        # Save metadata to DB first to get doc_id
        async with async_session() as db:
            doc = KnowledgeDocument(
                filename=filename,
                category=category,
                chunk_count=len(chunks),
                total_chars=len(text),
                added_by=ctx.user_id,
            )
            db.add(doc)
            await db.commit()
            await db.refresh(doc)
            doc_id = doc.id

        # Add chunks to FAISS with metadata
        from langchain_core.documents import Document

        lc_docs = [
            Document(
                page_content=chunk,
                metadata={
                    "doc_id": doc_id,
                    "filename": filename,
                    "category": category,
                    "chunk_idx": i,
                },
            )
            for i, chunk in enumerate(chunks)
        ]
        vs.add_documents(lc_docs)

        results.append(KnowledgeDocResponse(
            id=doc_id,
            filename=filename,
            category=category,
            chunk_count=len(chunks),
            total_chars=len(text),
            added_by=ctx.user_id,
            created_at=doc.created_at.isoformat() if doc.created_at else "",
        ))

    _save_index()
    return results


# ── 3. Direct text input ──

class TextInputRequest(BaseModel):
    text: str
    title: str = "직접 입력"
    category: str = "인사이트"


@router.post("/text", response_model=KnowledgeDocResponse, status_code=201)
async def add_knowledge_text(
    body: TextInputRequest,
    ctx: AuthContext = Depends(require_admin),
):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text is empty")

    chunks = _chunk_text(body.text)
    if not chunks:
        raise HTTPException(status_code=400, detail="text too short to chunk")

    vs = _load_or_create_index()

    async with async_session() as db:
        doc = KnowledgeDocument(
            filename=body.title,
            category=body.category,
            chunk_count=len(chunks),
            total_chars=len(body.text),
            added_by=ctx.user_id,
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        doc_id = doc.id

    from langchain_core.documents import Document

    lc_docs = [
        Document(
            page_content=chunk,
            metadata={
                "doc_id": doc_id,
                "filename": body.title,
                "category": body.category,
                "chunk_idx": i,
            },
        )
        for i, chunk in enumerate(chunks)
    ]
    vs.add_documents(lc_docs)
    _save_index()

    return KnowledgeDocResponse(
        id=doc_id,
        filename=body.title,
        category=body.category,
        chunk_count=len(chunks),
        total_chars=len(body.text),
        added_by=ctx.user_id,
        created_at=doc.created_at.isoformat() if doc.created_at else "",
    )


# ── 4. Delete document ──

@router.delete("/{doc_id}", status_code=204)
async def delete_knowledge(doc_id: int, _ctx: AuthContext = Depends(require_admin)):
    async with async_session() as db:
        row = (await db.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == doc_id)
        )).scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="document not found")

        await db.delete(row)
        await db.commit()

    # Remove vectors from FAISS
    vs = _load_or_create_index()
    ids_to_remove = [
        k for k, v in vs.docstore._dict.items()
        if v.metadata.get("doc_id") == doc_id
    ]
    if ids_to_remove:
        vs.delete(ids_to_remove)
        _save_index()


# ── Public utility: search for persona RAG ──

def search_solmi_knowledge(query: str, k: int = 5) -> list[str]:
    """Search the solmi knowledge FAISS index. Returns chunk texts.

    Called by DeepAgentExecutor when writer-solmi persona is active.
    Returns empty list if index doesn't exist or is empty.
    """
    try:
        vs = _load_or_create_index()
        if not vs.docstore._dict:
            return []
        docs = vs.similarity_search(query, k=k)
        return [d.page_content for d in docs if d.page_content]
    except Exception:
        logger.debug("solmi knowledge search failed", exc_info=True)
        return []
