# Log de Errores - Proyecto ClickAngle

Este archivo registra los errores críticos cometidos por el agente para evitar recurrencia y mejorar la fiabilidad del código.

## Registro de Errores

| Fecha | Qué falló | Por qué falló | Cómo evitarlo |
|-------|-----------|----------------|----------------|
| 2026-03-09 | Conexión API Key colgando | Unawaited `checkApiKey`, endpoint `v1`, falta de timeout. | Arreglado: `v1beta` habilitado, timeouts de 8s, parsing JSON robusto y UI mejorada. |
| 2026-03-10 | Pantalla negra / Cierre de sesión | Colisiones de renderizado y timeouts agresivos en Auth. | Arreglado: Router robusto con colas/timeout, Auth timeout 15s sin wipes de sesión por red. |
