"""
LDAP authentication service for LG internal systems.

ID policy: mail local-part (e.g., jounghyun.kim)
UPN format: {local_part}@lge.com
LDAP server: ldaps://lgesaads03.lge.net
Base DN: dc=lge,dc=net
"""

from __future__ import annotations

import os
import ssl
from dataclasses import dataclass
from typing import Optional

import ldap3
from ldap3 import Connection, Server, Tls, SUBTREE


@dataclass
class LdapUserInfo:
    user_id: str
    display_name: str
    department: str
    email: str


class LdapAuthError(Exception):
    """Raised when LDAP auth fails."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


def _ldap_url() -> str:
    return os.getenv("LDAP_URL", "ldaps://lgesaads03.lge.net")


def _ldap_base_dn() -> str:
    return os.getenv("LDAP_BASE_DN", "dc=lge,dc=net")


def _ldap_upn_domain() -> str:
    return os.getenv("LDAP_UPN_DOMAIN", "lge.com")


def _build_server() -> Server:
    """Build LDAP server with TLS configuration."""
    url = _ldap_url()

    if url.startswith("ldaps://"):
        # MVP: allow self-signed certs in internal network
        # TODO: switch to CERT_REQUIRED with proper CA bundle for production
        tls = Tls(validate=ssl.CERT_NONE)
        return Server(url, use_ssl=True, tls=tls, get_info=ldap3.NONE)

    return Server(url, get_info=ldap3.NONE)


def authenticate(username: str, password: str) -> LdapUserInfo:
    """
    Authenticate user via LDAP bind.

    Args:
        username: mail local-part (e.g., "jounghyun.kim")
        password: LDAP password

    Returns:
        LdapUserInfo with display_name, department, email

    Raises:
        LdapAuthError: on bind failure or user not found
    """
    if not username or not password:
        raise LdapAuthError("empty_credentials", "Username and password are required.")

    upn = f"{username}@{_ldap_upn_domain()}"
    server = _build_server()

    try:
        # Step 1: Bind with user credentials
        conn = Connection(
            server,
            user=upn,
            password=password,
            auto_bind=True,
            raise_exceptions=True,
            read_only=True,
        )
    except ldap3.core.exceptions.LDAPBindError:
        raise LdapAuthError("invalid_credentials", "Invalid username or password.")
    except ldap3.core.exceptions.LDAPSocketOpenError as e:
        raise LdapAuthError("ldap_unreachable", f"Cannot connect to LDAP server: {e}")
    except Exception as e:
        raise LdapAuthError("ldap_error", f"LDAP error: {e}")

    try:
        # Step 2: Search for user attributes
        search_filter = f"(userPrincipalName={upn})"
        conn.search(
            search_base=_ldap_base_dn(),
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=["displayName", "department", "mail"],
        )

        if not conn.entries:
            raise LdapAuthError("user_not_found", "Authenticated but user entry not found in directory.")

        entry = conn.entries[0]
        display_name = str(entry.displayName) if hasattr(entry, "displayName") and entry.displayName else username
        department = str(entry.department) if hasattr(entry, "department") and entry.department else ""
        email = str(entry.mail) if hasattr(entry, "mail") and entry.mail else f"{username}@{_ldap_upn_domain()}"

        return LdapUserInfo(
            user_id=username,
            display_name=display_name,
            department=department,
            email=email,
        )
    finally:
        conn.unbind()
