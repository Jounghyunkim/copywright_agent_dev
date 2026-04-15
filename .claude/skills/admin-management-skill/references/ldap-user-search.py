"""
Reference: LDAP user search using caller's own credentials.

No service account needed. The admin provides their own password
via the frontend, which is used for a one-time LDAP bind + search.
"""

from __future__ import annotations

import logging
import ssl
from dataclasses import dataclass

from ldap3 import Connection, Server, Tls, SUBTREE
from ldap3.core.exceptions import LDAPBindError, LDAPException, LDAPSocketOpenError

logger = logging.getLogger(__name__)


@dataclass
class LdapUserInfo:
    user_id: str
    display_name: str
    email: str | None
    department: str | None


class LdapBindFailure(Exception):
    """Invalid credentials."""


class LdapServerUnavailable(Exception):
    """LDAP server unreachable."""


def search_users(
    query: str,
    bind_user_id: str,
    bind_password: str,
    *,
    ldap_url: str,        # e.g. "ldaps://ldap.company.com"
    base_dn: str,          # e.g. "dc=company,dc=com"
    upn_domain: str,       # e.g. "company.com"
    connect_timeout: int = 5,
    size_limit: int = 20,
) -> list[LdapUserInfo]:
    """Search LDAP for users by displayName or sAMAccountName.

    Binds using the caller's own AD credentials (no service account).

    Args:
        query: Search term (name or ID, min 2 chars)
        bind_user_id: AD ID of the requesting admin
        bind_password: Admin's own password (from frontend prompt)
        ldap_url: LDAP server URL
        base_dn: Search base DN
        upn_domain: Domain for UPN construction (user@domain)
        connect_timeout: Connection timeout in seconds
        size_limit: Max results to return

    Raises:
        LdapBindFailure: wrong password
        LdapServerUnavailable: server unreachable
    """
    tls = Tls(validate=ssl.CERT_NONE)  # NOTE: disable for internal LDAP; enable for production
    server = Server(ldap_url, use_ssl=True, tls=tls, connect_timeout=connect_timeout)

    # Search timeout is longer than connect timeout (broad searches need more time)
    search_timeout = max(connect_timeout * 3, 15)
    upn = f"{bind_user_id}@{upn_domain}"

    try:
        conn = Connection(
            server,
            user=upn,
            password=bind_password,
            auto_bind=True,
            read_only=True,
            receive_timeout=search_timeout,
        )
        logger.info("[LDAP-SEARCH] bind OK as %s", bind_user_id)
    except LDAPBindError:
        logger.warning("[LDAP-SEARCH] bind FAILED for user=%s", bind_user_id)
        raise LdapBindFailure("Invalid LDAP password")
    except (LDAPSocketOpenError, LDAPException) as exc:
        logger.error("[LDAP-SEARCH] server unavailable: %s", exc)
        raise LdapServerUnavailable("LDAP server unreachable") from exc

    escaped = _escape_ldap_filter(query)

    # objectCategory=person is indexed in AD → much faster than objectClass=user alone
    search_filter = (
        f"(&(objectCategory=person)(objectClass=user)"
        f"(|(displayName=*{escaped}*)(sAMAccountName=*{escaped}*)))"
    )
    logger.info("[LDAP-SEARCH] filter=%s, base=%s", search_filter, base_dn)

    results: list[LdapUserInfo] = []
    try:
        conn.search(
            search_base=base_dn,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=["sAMAccountName", "displayName", "mail", "department"],
            size_limit=size_limit,
            time_limit=search_timeout,
        )
        for entry in conn.entries:
            sam = str(entry.sAMAccountName) if hasattr(entry, "sAMAccountName") else None
            if not sam:
                continue
            results.append(LdapUserInfo(
                user_id=sam,
                display_name=str(entry.displayName) if hasattr(entry, "displayName") else sam,
                email=str(entry.mail) if hasattr(entry, "mail") else None,
                department=str(entry.department) if hasattr(entry, "department") else None,
            ))
        logger.info("[LDAP-SEARCH] found %d result(s)", len(results))
    except LDAPException:
        logger.warning("[LDAP-SEARCH] search failed", exc_info=True)
    finally:
        try:
            conn.unbind()
        except Exception:
            pass

    return results


def _escape_ldap_filter(value: str) -> str:
    """Escape special characters for LDAP filter injection prevention."""
    for char, escaped in {"\\": "\\5c", "*": "\\2a", "(": "\\28", ")": "\\29", "\x00": "\\00"}.items():
        value = value.replace(char, escaped)
    return value


# ── For non-LDAP projects ──
#
# If your project doesn't use LDAP, replace this with a DB search:
#
# def search_users_from_db(query: str, db: Session) -> list[UserInfo]:
#     """Search users from a users table."""
#     pattern = f"%{query}%"
#     rows = db.query(User).filter(
#         or_(User.display_name.ilike(pattern), User.username.ilike(pattern))
#     ).limit(20).all()
#     return [UserInfo(user_id=r.username, display_name=r.display_name, ...) for r in rows]
