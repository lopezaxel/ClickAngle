---
name: guardian-clickangle
description: Habilidad específica para el proyecto ClickAngle que asegura la estabilidad, el contexto y la integridad del flujo de datos entre las fases de la aplicación.
---

# Guardián ClickAngle

Esta habilidad contiene el conocimiento profundo de la arquitectura, el stack y las reglas de negocio de ClickAngle para evitar regresiones y pérdida de contexto durante el desarrollo.

## Stack Tecnológico

- **Frontend**: Vanilla JavaScript (ES Modules).
- **Build Tool**: Vite.
- **Backend/DB**: Supabase (Auth, Database, RPCs).
- **IA**: Google Generative AI (Gemini 3 Pro/Flash-preview) vía REST API (`v1beta`).
- **Estilos**: Vanilla CSS con variables personalizadas en `style.css`.
- **Router**: Router SPA basado en Hash (`src/router.js`).

## Arquitectura de Estado y Datos

1. **Estado Global**: Se maneja en `src/lib/state.js` usando un patrón Pub/Sub. Siempre usa `getState()` y `setState()` para interactuar con el estado.
2. **Persistencia**: La `activeChannelId` se persiste en `localStorage` con la clave `clickangles_active_channel`.
3. **Flujo de Inteligencia**:
   - **ADN (Brand Kit)**: Extrae la esencia del canal.
   - **Cerebro**: Analiza guiones basándose en el ADN. Usa `gemini-3.1-pro-preview`.
   - **Ángulos**: Propone miniaturas basadas en el análisis del Cerebro.
   - **Engine**: Orquestador final.
4. **Seguridad**: Las API Keys se manejan mediante RPCs de Supabase (`get_decrypted_api_key`) para mayor seguridad.

## Reglas de Oro (Para el Programador IA)

- **Identificadores de Modelos**: Para modelos Gemini 3+, siempre usar el sufijo `-preview` (ej. `gemini-3-flash-preview`). Consultar `ListModels` si un modelo da 404.
- **Modo JSON Estricto**: Siempre configurar `response_mime_type: "application/json"` en el `generationConfig` y pedir el esquema JSON explícitamente en el prompt para evitar errores de parsing.
- **Seguridad en UI**: Nunca asumir que el JSON de la IA contiene todos los campos. Usar optional chaining (`?.`) y valores por defecto (`|| []`) para evitar romper el renderizado.
- **No Romper la Navegación**: Cualquier cambio en paneles debe respetar la firma de la función `render(workspace)` y manejar errores con bloques `try/catch` para evitar pantallas en negro.
- **Diseño Premium**: Mantener la estética "Glassmorphism" y usar micro-animaciones (clase `animate-pulse` o similares). No usar colores básicos; usar las variables de `style.css`.
- **Timeouts**: Siempre implementar `Promise.race` con timeouts de 20-30s en llamadas a API o renderizados pesados para evitar que la UI se cuelgue.
- **Contexto de IA**: Al llamar a `callAI`, incluir siempre el `context` relevante (ADN del canal, datos del Cerebro, etc.) para que la respuesta sea coherente.

## Cuándo usar esta habilidad

- Al crear nuevos paneles en `src/panels/`.
- Al modificar la lógica de integración con Supabase o Gemini.
- Al refactorizar el sistema de navegación o estado.
- Cuando se detecten errores de "pantalla en negro" o cuelgues de la aplicación.

## Cómo usarla

1. **Consulta el Estado**: Verifica `src/lib/state.js` antes de asumir que un dato está disponible.
2. **Sigue el Flujo**: Si trabajas en "Ángulos", asegúrate de tener acceso a los datos generados en "Cerebro".
3. **Valida la API**: Usa `checkApiKey` en `src/lib/intelligence.js` antes de realizar operaciones costosas de IA.
