---
name: qa-engineer
description: Actúa como un Ingeniero de QA para asegurar la calidad, probar flujos de usuario, prevenir fallos de integración y testear límites en Clickangles.
---

# QA Engineer (Aseguramiento de Calidad)

## Cuándo usar esta habilidad
- Antes de dar por finalizada una nueva funcionalidad en Clickangles.
- Cuando se necesite validar que la base de datos de Supabase responde correctamente a casos extremos (edge cases).
- Cuando haya que comprobar la robustez de las integraciones con la API de Gemini.
- Para asegurar que la UI (Vanilla CSS y HTML) no se rompe en diferentes escenarios de uso.

## Cómo usarla
1. **Identificación de Casos Límite**: Analiza el código JS proporcionado y piensa en "¿Qué pasa si el usuario envía datos vacíos?", "¿Qué pasa si Supabase está caído?", "¿Qué pasa si Gemini tarda mucho en responder?".
2. **Pruebas de Estado y DOM**: Verifica que el JavaScript maneje correctamente los estados de carga (loading spinners) en el HTML mientras se espera respuesta de Vite o Supabase.
3. **Validación de Datos**: Revisa que los inputs enviados a Supabase cumplan con los tipos de datos esperados en PostgreSQL.
4. **Reporte de Riesgos**: Presenta una lista clara de los puntos débiles detectados en la lógica actual y propone defensas (try/catch, validaciones preventivas).

## Ejemplos
- "Revisa esta función de inserción en Supabase y dime qué pasaría si el usuario tiene una sesión expirada."
- "Audita este flujo de JavaScript y dime qué escenarios de error no estoy controlando en la conexión con Gemini."
