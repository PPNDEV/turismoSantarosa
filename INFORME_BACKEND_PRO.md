# Informe backend pro

Fecha: 2026-04-30

## 1. Objetivo
Elevar la robustez del backend según el Acta y buenas practicas de produccion.

## 2. Estado actual del backend
- Cloud Functions v2 (HTTP + callable).
- Firestore para usuarios, mensajes, encuestas y analytics.
- RTDB para contenido publico (CMS).
- Storage restringido a /cms con validacion por rol.

## 3. Mejoras aplicadas (pro)

### 3.1 Rate limiting distribuido
- Implementado en Firestore con transacciones (coleccion `rateLimits`).
- Evita abuso en `/api/visits`, `/api/contact`, `/api/survey`.

### 3.2 Validacion server-side de payload
- Sanitizacion y limites de campos en formularios publicos.
- Validacion de schemas para contenido del CMS en Functions.

### 3.3 Auditoria y trazabilidad
- Registro de acciones admin en `adminAudit` (user.create, user.role.update, content.upsert, content.delete, user.delete).

## 4. Riesgos remanentes
- Rate limiting basado en Firestore agrega costo por request.
- Falta pipeline automatizado de backups.
- Falta monitoreo/alertas formales (SLO, uptime checks).

## 5. Proximos pasos recomendados
- Activar alertas en Cloud Monitoring.
- Implementar backups programados (Firestore + Storage).
- Documentar runbook de incidentes.

---
Fin del informe.
