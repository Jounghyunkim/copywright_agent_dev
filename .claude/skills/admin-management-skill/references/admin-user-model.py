"""
Reference: SQLAlchemy ORM model for admin_users table.
Adapt Base import to your project.
"""

from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

# from your_app.infra.db.models.base import Base


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class AdminUser:  # (Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_by: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now_utc
    )

# ── Column Purpose ──
#
# user_id:      로그인 시 사용하는 ID와 동일 형식 (sAMAccountName, email 등)
# display_name: 사용자 표시 이름 (LDAP displayName, 프로필 이름 등)
# department:   조직명 (LDAP department, 부서 등)
# email:        이메일
# added_by:     이 관리자를 추가한 사람의 user_id (감사 추적)
# created_at:   관리자로 등록된 시점
