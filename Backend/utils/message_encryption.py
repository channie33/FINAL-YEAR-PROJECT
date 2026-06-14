"""AES-GCM helpers for encrypting/decrypting stored chat messages."""
import base64
import hashlib
import os
from typing import Dict, Tuple

from config import SECRET_KEY

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except ImportError as exc:
    raise RuntimeError(
        "Missing dependency: cryptography. Install it to use message encryption."
    ) from exc

_ENC_PREFIX = "enc"
_cached_key_config: Tuple[str, Dict[str, bytes]] | None = None


def _decode_key(key_b64: str) -> bytes:
    normalized = key_b64.strip()
    # Support urlsafe base64 values stored without trailing '=' padding.
    normalized += "=" * (-len(normalized) % 4)
    raw = base64.urlsafe_b64decode(normalized)
    if len(raw) != 32:
        raise ValueError("Message encryption keys must decode to 32 bytes")
    return raw


def _load_key_config() -> Tuple[str, Dict[str, bytes]]:
    global _cached_key_config
    if _cached_key_config is not None:
        return _cached_key_config

    keyring: Dict[str, bytes] = {}

    active_key_id = os.getenv("MESSAGE_ENCRYPTION_KEY_ID", "v1")
    legacy_key = hashlib.sha256(SECRET_KEY.encode("utf-8")).digest()
    active_key_b64 = os.getenv("MESSAGE_ENCRYPTION_KEY_B64", "").strip()
    if active_key_b64:
        keyring[active_key_id] = _decode_key(active_key_b64)

    # Optional format: "old1:base64key,old2:base64key"
    previous_keys = os.getenv("MESSAGE_ENCRYPTION_PREVIOUS_KEYS", "").strip()
    if previous_keys:
        for pair in previous_keys.split(","):
            pair = pair.strip()
            if not pair or ":" not in pair:
                continue
            key_id, key_b64 = pair.split(":", 1)
            keyring[key_id.strip()] = _decode_key(key_b64.strip())

    if not keyring:
        # Backward-compatible fallback so the app still works without extra env setup.
        active_key_id = "derived-v1"
        keyring[active_key_id] = legacy_key
        print(
            "Warning: MESSAGE_ENCRYPTION_KEY_B64 is not set. "
            "Using a key derived from SECRET_KEY."
        )
    else:
        # Keep legacy fallback key available for decryption of old rows that
        # were encrypted before MESSAGE_ENCRYPTION_KEY_B64 was configured.
        keyring.setdefault("derived-v1", legacy_key)

    _cached_key_config = (active_key_id, keyring)
    return _cached_key_config


def encrypt_message_text(plain_text: str) -> str:
    if not isinstance(plain_text, str):
        raise ValueError("Message must be a string")

    active_key_id, keyring = _load_key_config()
    key = keyring[active_key_id]

    nonce = os.urandom(12)
    ciphertext = AESGCM(key).encrypt(nonce, plain_text.encode("utf-8"), None)
    payload = base64.urlsafe_b64encode(nonce + ciphertext).decode("ascii")
    return f"{_ENC_PREFIX}:{active_key_id}:{payload}"


def decrypt_message_text(stored_text: str) -> str:
    if not isinstance(stored_text, str):
        return stored_text

    if not stored_text.startswith(f"{_ENC_PREFIX}:"):
        # Plaintext row from before encryption rollout.
        return stored_text

    try:
        _prefix, key_id, payload = stored_text.split(":", 2)
        _active_key_id, keyring = _load_key_config()
        key = keyring.get(key_id)
        if key is None:
            return "[Encrypted message unavailable: key not configured]"

        raw = base64.urlsafe_b64decode(payload.encode("ascii"))
        nonce, ciphertext = raw[:12], raw[12:]
        plain = AESGCM(key).decrypt(nonce, ciphertext, None)
        return plain.decode("utf-8")
    except Exception:
        return "[Encrypted message unavailable: decryption failed]"