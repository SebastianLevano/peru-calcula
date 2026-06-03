# ADR-0008: Auth admin — access JWT corto + refresh tokens revocables

- **Estado:** Aceptada · **Fecha:** 2026-06-02

## Contexto
El usuario final **no** se autentica (portal público). Solo el **admin** se autentica, y edita **tasas y parámetros normativos**: un token comprometido debe poder cortarse **antes de expirar**. Un JWT puro es irrevocable hasta su expiración.

## Decisión
- **Access token JWT corto** (minutos).
- **Refresh token persistido y revocable** en `admin_refresh_tokens` (se almacena `token_hash`, nunca el token en claro).
- **Rotación** del refresh en cada uso; **revocación** inmediata en logout y al **cambiar password**.
- Credenciales con hash **BCrypt/Argon2**.

## Consecuencias
- ✅ Un token comprometido se corta de inmediato; trazabilidad de sesiones (`user_agent`, `ip_hash`).
- ✅ Superficie mínima: sin auth de usuario final.
- ⚠️ Estado de sesión en DB (consulta en refresh); aceptable por bajo volumen admin.
