---
name: instancia-google
description: Habilidad para gestionar el despliegue, alojamiento y optimización de la aplicación dentro del ecosistema de Google (Chrome, Firebase, GCP).
---

# Instancia Google: Alojamiento y Optimización

Esta habilidad profesionaliza la relación entre el código de ClickAngle y la infraestructura de Google, asegurando un despliegue sin errores y una ejecución fluida en el navegador Chrome.

## Ecosistema de Alojamiento (Hosting)

### Opción A: Firebase Hosting (Recomendado para SPA)
1. **Inicialización**: `firebase init hosting`.
2. **Configuración**: Asegurar que `public` sea el directorio de build (Vite: `dist`).
3. **Despliegue**: `npm run build` seguido de `firebase deploy`.
4. **Sincronización**: Configurar GitHub Actions para despliegue continuo (CI/CD) en Firebase.

### Opción B: Google Cloud Run / App Engine
1. **Dockerización**: Crear un `Dockerfile` optimizado para servir archivos estáticos.
2. **Registro**: Subir imagen a Google Artifact Registry.
3. **Servidores**: Desplegar en Cloud Run con escalado automático.

## Optimización para Google Chrome

- **Renderizado V8**: Escritura de código JavaScript limpio (ES6+) que favorezca la optimización del motor V8 (evitar "deoptimizations" por tipos cambiantes).
- **Core Web Vitals**:
  - **LCP (Largest Contentful Paint)**: Optimizar carga de fuentes de Google y pre-renderizado de esqueletos (skeletons).
  - **CLS (Cumulative Layout Shift)**: Reservar espacio para imágenes y elementos dinámicos en `style.css`.
- **APIs de Chrome**: Uso correcto de `Service Workers` para PWA y `Cache API` para persistencia offline técnica.

## Resolución de Errores de Instancia (Concatenación)

1. **Errores de CORS**: Configurar cabeceras en Firebase/GCP para permitir peticiones desde dominios autorizados (Google Auth).
2. **Inconsistencia de Entorno**: Usar `.env` estrictos para separar la instancia de desarrollo (`localhost`) de la instancia de Google (`clickangle.app`).
3. **Depuración de Red**: Protocolo de inspección de la pestaña "Network" y "Application" en Chrome DevTools para detectar fallos de "handshake" con los servidores de Google.

## Cuándo usar esta habilidad

- Al preparar la aplicación para salir a producción.
- Al configurar dominios personalizados en Google Domains/Cloud.
- Cuando la aplicación presente lentitud o fallos específicos al ejecutarse en Chrome.
- Al integrar servicios avanzados de Google (Analytics, Google Sign-In, Cloud Functions).

## Cómo usarla

1. **Build First**: Antes de desplegar, siempre ejecutar `npm run build` y verificar la carpeta `dist`.
2. **Audit**: Usar Lighthouse en Chrome para auditar la instancia antes de cada commit importante.
3. **Console Hygiene**: No dejar logs de desarrollo en la instancia de producción que puedan comprometer la seguridad o el performance.
