import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, SmallInteger, Integer, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMP
from .database import Base


class ReviewSession(Base):
    __tablename__ = "review_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    brief_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    analysis_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    strategic_message_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    selected_copies: Mapped[dict] = mapped_column(JSONB, nullable=False)
    enabled_skills: Mapped[list] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending",
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    results: Mapped[list["ReviewResult"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','running','completed','failed','interrupted')",
            name="ck_review_sessions_status",
        ),
        Index("idx_review_sessions_project", "project_name"),
        Index("idx_review_sessions_status", "status"),
    )


class ReviewResult(Base):
    __tablename__ = "review_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("review_sessions.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(String(100), nullable=False)
    skill_type: Mapped[str] = mapped_column(String(20), nullable=False)
    target_copy_key: Mapped[str] = mapped_column(String(50), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    findings: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    suggestions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    raw_llm_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    execution_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    session: Mapped["ReviewSession"] = relationship(back_populates="results")

    __table_args__ = (
        CheckConstraint("skill_type IN ('builtin','custom')", name="ck_review_results_skill_type"),
        CheckConstraint("score >= 0 AND score <= 100", name="ck_review_results_score"),
        Index("idx_review_results_session", "session_id"),
    )


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    brief: Mapped[dict] = mapped_column(JSONB, nullable=False)
    analysis_report: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    strategic_message: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    copy_results: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    review_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    review_results: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    copy_candidates: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    target_countries: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    brand_fit_score: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    review_avg_score: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    total_copies: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    current_step: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        Index("idx_campaigns_created", "created_at"),
    )


class CustomSkill(Base):
    __tablename__ = "custom_skills"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    prompt_template: Mapped[str] = mapped_column(Text, nullable=False)
    reference_docs: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    output_schema: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint(
            "category IN ('validation','generation','analysis')",
            name="ck_custom_skills_category",
        ),
    )


class KnowledgeDocument(Base):
    """지식 구축 — 업로드된 문서 메타데이터 (벡터는 FAISS에 저장)"""
    __tablename__ = "knowledge_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # 저서, 에세이, 인터뷰, 카피샘플, 인사이트
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_chars: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    added_by: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("idx_knowledge_documents_category", "category"),
    )


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_by: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
