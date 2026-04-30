# Security hardening

Fecha: 2026-04-30

## Controles actuales
- Reglas de Firestore por rol.
- Auth con Firebase.
- Rate limiting distribuido por IP en Firestore.
- Auditoria de acciones admin (adminAudit).
- Sanitizacion y validacion server-side en formularios publicos.

## Controles recomendados
1) Headers de seguridad en Firebase Hosting
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(), microphone=(), camera=()
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

2) Validacion de formularios
- Limites de longitud en campos.
- Validacion de email en cliente.
- Sanitizacion basica (trim, colapsar espacios).

3) Anti-abuso en endpoints publicos
- Rate limiting por IP con TTL de expiracion.
- Configurar TTL en Firestore para `rateLimits.expiresAt`.
- Bloqueo por origen cuando se define allowlist.
- Captcha opcional (Turnstile o hCaptcha).
- Deteccion simple de spam por exceso de URLs.

4) Control de accesos
- Mantener roles solo via Admin SDK.
- Auditar reglas al cambiar requisitos.

5) Logging y observabilidad
- Logs estructurados con requestId.
- Revisar errores de Cloud Functions y accesos no autorizados.

6) Backups y alertas (recomendado)
- Programar exportaciones de Firestore a Cloud Storage.
- Alertas de errores y latencia desde Cloud Monitoring.

## Verificacion
- Probar login con credenciales invalidas.
- Verificar bloqueos de lectura en colecciones privadas.
- Confirmar headers con DevTools -> Network.
- Validar bloqueo de origen cuando ALLOWED_ORIGINS esta definido.
- Probar captcha con token valido e invalido.
- Confirmar requestId en respuestas de /api.
