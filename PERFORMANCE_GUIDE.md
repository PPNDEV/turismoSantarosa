# Performance guide

Fecha: 2026-04-30

## Objetivos
- LCP < 2.5s (mobile)
- CLS < 0.1
- TBT < 200ms

## Herramientas
- Lighthouse (Chrome DevTools)
- WebPageTest (opcional)

## Checklist tecnico
- Comprimir imagenes (WebP/AVIF) y definir tamanos responsivos.
- Lazy load en imagenes y galerias.
- Evitar bundles grandes (code-splitting por rutas).
- Cache correcto de assets estaticos.
- Evitar renders innecesarios en componentes pesados.

## Flujo recomendado
1) Ejecutar build: `npm run build`.
2) Preview: `npm run preview`.
3) Correr Lighthouse en Home y Informacion Turistica.
4) Registrar resultados y ajustar.

## Acciones sugeridas
- Revisar peso de imagenes del hero y galeria.
- Minimizar dependencias no usadas.
- Mantener size de bundle por debajo de 250 KB gzip por route principal.
