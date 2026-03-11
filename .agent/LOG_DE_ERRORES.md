# Log de Errores - Proyecto ClickAngle

Este archivo registra los errores críticos cometidos por el agente para evitar recurrencia y mejorar la fiabilidad del código.

## Registro de Errores

| Fecha | Qué falló | Por qué falló | Cómo evitarlo |
|-------|-----------|----------------|----------------|
| 2026-03-09 | Conexión API Key colgando | Unawaited `checkApiKey`, endpoint `v1`, falta de timeout. | Arreglado: `v1beta` habilitado, timeouts de 8s, parsing JSON robusto y UI mejorada. |
| 2026-03-10 | Pantalla negra / Cierre de sesión | Colisiones de renderizado y timeouts agresivos en Auth. | Arreglado: Router robusto con colas/timeout, Auth timeout 15s sin wipes de sesión por red. |
| 2026-03-11 | `Panel Render Timeout` en Hub y Settings | Los paneles `renderChannelSelector` y `renderSettings` hacían `await` de Supabase antes de retornar, el router's timeout los mataba. | **Regla**: Todo panel que necesite datos de Supabase debe renderizar la UI skeleton SINCRÓNICAMENTE primero y luego hacer el fetch en background. Nunca bloquear el retorno inicial del render. |
| 2026-03-11 | `Timer 'DB_Fetch_Channels' already exists` | `loadUserChannels` era invocado en paralelo desde `auth.js` y `channel-selector.js` sin deduplicación. | **Regla**: Funciones de fetch costosas deben usar un patrón `let promise = null` (deduplicación de in-flight). El Hub NO debe cargar datos de Supabase, solo leer del state. |
| 2026-03-11 | Botón de logout no funcionaba | `document.getElementById('btn-logout')` fallaba silenciosamente porque el sidebar puede estar fuera del scope del documento o el elemento ya perdido. | **Regla**: Siempre usar event delegation en el `container` local (no `document.getElementById`) para elementos dinámicos del sidebar y paneles. |
| 2026-03-11 | Logout bloqueando la UI | `await signOut()` esperaba a Supabase antes de limpiar el estado local, mostrando la app colgada. | **Regla**: En logout, limpiar el estado local INMEDIATAMENTE (localStorage + `setState`) y luego llamar a `supabase.auth.signOut()` como fire-and-forget con `.catch()`. |
