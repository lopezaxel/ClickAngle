---
name: vercel-deploy
description: Skill senior de deploy en Vercel para ClickAngle — Vite SPA vanilla JS. Cubre vercel.json, vite.config.js, variables de entorno, diagnóstico de errores de build, checklist pre-deploy y resolución de problemas en producción. Basada en documentación oficial de Vercel (verificada 2026-03).
---

# Vercel Deploy — ClickAngle

Skill de referencia para deployar y mantener ClickAngle en Vercel sin errores. El proyecto es una **Vite 7 SPA vanilla JS** con hash-based routing, sin SSR, sin API routes.

---

## Archivos de configuración de esta app

### `vercel.json` — Estado actual: NO EXISTE (debe crearse)

El archivo `vercel.json` **no existe** en el repositorio. Sin él, Vercel usa autodetección y puede generar comportamientos inesperados. Crearlo en la raíz del proyecto con:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Por qué el rewrite `/(.*) → /index.html`:**
ClickAngle usa hash-based routing (`#dashboard`, `#cerebro`, etc.). Los hashes nunca llegan al servidor, pero si alguien accede directamente a la URL raíz o se produce un 404, Vercel debe servir siempre `index.html` para que el router del cliente tome el control. Sin este rewrite, Vercel devuelve 404 en rutas no existentes.

**Por qué el header de assets con `immutable`:**
Vite genera assets con hash en el nombre (`index-BxKj3a2.js`). Son inmutables por definición — el cache agresivo es seguro y mejora el LCP.

---

### `vite.config.js` — Estado actual: configuración mínima

El archivo actual solo configura el puerto del dev server. Para producción es suficiente porque Vite detecta automáticamente:
- `outputDirectory`: `dist` (default de Vite)
- `base`: `/` (raíz del dominio — correcto para `clickangles.sistemaniki.com`)

**NO modificar `base`** a menos que la app se sirva desde un subdirectorio (ej. `/app/`). En un dominio raíz, el valor por defecto `/` es el correcto.

Si en el futuro se necesita exponer variables de entorno al cliente:

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  // Solo agregar 'define' si se necesitan constantes de build-time
  // Las variables VITE_* de .env se exponen automáticamente vía import.meta.env
});
```

---

## Variables de entorno

### Regla crítica de Vite + Vercel

**Solo las variables con prefijo `VITE_` son accesibles en el código del cliente** vía `import.meta.env.VITE_NOMBRE`. Las variables sin ese prefijo solo existen durante el build (en `vite.config.js`) y NUNCA en el browser.

### Variables de entorno de ClickAngle

| Variable | Prefijo necesario | Dónde vive hoy | Estado |
|---|---|---|---|
| Supabase URL | No aplica | Hardcodeada en `src/lib/supabase.js` | ✅ Correcto — es pública |
| Supabase Anon Key | No aplica | Hardcodeada en `src/lib/supabase.js` | ✅ Correcto — es pública |
| Gemini API Key | No aplica | En Supabase cifrada, acceso via RPC | ✅ Correcto — nunca en cliente |
| Sentry DSN | `VITE_SENTRY_DSN` | Hardcodeada en `src/lib/sentry.js` | ⚠️ Mover a env var |

**Para mover Sentry DSN a variable de entorno:**

1. En Vercel Dashboard → Project → Settings → Environment Variables:
   - Nombre: `VITE_SENTRY_DSN`
   - Valor: el DSN de Sentry
   - Entornos: Production ✅, Preview ✅

2. En `src/lib/sentry.js` reemplazar el DSN hardcodeado:
   ```js
   dsn: import.meta.env.VITE_SENTRY_DSN,
   ```

3. Para desarrollo local, crear `.env.local` en la raíz (gitignoreado):
   ```
   VITE_SENTRY_DSN=https://...@sentry.io/...
   ```

### Entornos de Vercel

| Entorno | Cuándo aplica |
|---|---|
| **Production** | Push a `main` o deploy manual con `--prod` |
| **Preview** | Push a cualquier otra rama |
| **Development** | `vercel dev` local (raramente necesario) |

Para esta app, solo usar **Production**. No hay lógica diferenciada por entorno.

---

## Proceso de deploy

### Flujo normal (deploy automático)

```
git push origin main
→ Vercel detecta el push
→ Ejecuta: npm install
→ Ejecuta: npm run build  (→ vite build)
→ Output: dist/
→ Sirve dist/ como static site
→ Deploy en producción
```

### Build local antes de pushear (obligatorio)

Siempre correr el build localmente antes de hacer push para no romper producción:

```bash
npm run build
```

Si el build local pasa, el de Vercel también pasará (misma versión de Vite, mismo `package.json`).

Si hay errores en `npm run build`, **no pushear** hasta resolverlos.

### Preview antes de producción

Para testear cambios grandes sin afectar producción:

```bash
# En una rama separada
git checkout -b feature/cambio
git push origin feature/cambio
# Vercel crea automáticamente una URL de preview
```

---

## Diagnóstico de errores de build

### Error: `Failed to resolve import "..."`

**Causa:** Una importación apunta a un archivo que no existe o tiene el path incorrecto.

**Diagnóstico:**
```bash
npm run build
# Leer el mensaje exacto: qué módulo falla y desde qué archivo
```

**Solución:** Verificar que el archivo existe y que el path relativo es correcto. En Vite, los paths son case-sensitive en Linux (Vercel corre en Linux aunque el dev sea Windows).

**Gotcha crítico:** En Windows, `import './lib/Auth.js'` puede funcionar localmente pero falla en Vercel porque Linux distingue entre `Auth.js` y `auth.js`. Usar siempre minúsculas en los nombres de archivo.

---

### Error: `Uncaught ReferenceError: X is not defined` en producción

**Causa:** Una variable de entorno `VITE_*` está configurada en `.env.local` pero no en Vercel Dashboard.

**Diagnóstico:** Abrir la app en producción → DevTools → Console. Si el error es una variable de entorno, será `undefined`.

**Solución:** Agregar la variable en Vercel Dashboard → Project → Settings → Environment Variables.

---

### Error: Pantalla en blanco en producción (funciona en dev)

**Causa más común:** El `base` en `vite.config.js` está mal configurado, o el `vercel.json` no tiene el rewrite de SPA.

**Diagnóstico:**
1. Abrir DevTools → Network
2. Ver si `index.html` carga con 200
3. Ver si los assets JS/CSS cargan con 200
4. Si los assets dan 404 → problema de `base` o `outputDirectory`
5. Si el JS carga pero la app no arranca → error en `main.js`, revisar Console

**Solución:** Verificar que `vercel.json` tiene el rewrite correcto y que `outputDirectory` es `dist`.

---

### Error: `Module "X" has been externalized` (warning de Vite)

**No es un error de deploy.** Es un warning de compatibilidad de Vite con módulos Node.js. No afecta el build ni el deploy. Ignorar.

---

### Error de build: dependencia faltante

**Causa:** Un paquete está en `devDependencies` pero se usa en runtime, o fue instalado localmente pero no está en `package.json`.

**Diagnóstico:** El log de Vercel mostrará `Cannot find module 'nombre-paquete'`.

**Solución:**
```bash
npm install nombre-paquete --save  # Mover a dependencies si es runtime
```
Luego pushear el `package.json` y `package-lock.json` actualizados.

---

### Error: deploy anterior funcionaba, el nuevo está roto

**Rollback inmediato en Vercel Dashboard:**
1. Vercel Dashboard → Project → Deployments
2. Seleccionar el deploy anterior (el que funcionaba)
3. Click en `...` → **Promote to Production**

Esto restaura la versión anterior en segundos sin tocar el código.

---

## Checklist pre-deploy

Antes de cada push a `main`, verificar:

- [ ] `npm run build` pasa localmente sin errores
- [ ] No hay `console.log` de debugging que expongan datos sensibles
- [ ] Las variables de entorno nuevas están dadas de alta en Vercel Dashboard
- [ ] Si se agregó un archivo nuevo, el nombre es en minúsculas (case-sensitive en Linux)
- [ ] Si se modificó `vite.config.js`, testear el build localmente
- [ ] Si se modificó `vercel.json`, validar el JSON con un linter
- [ ] Actualizar `.agent/DEVLOG.md` con los cambios de la sesión

---

## Estructura del deploy en Vercel

```
Repo: github.com/lopezaxel/ClickAngle
Branch producción: main
URL producción: https://clickangles.sistemaniki.com/
Framework detectado: Vite
Build command: npm run build
Output directory: dist/
```

### Archivos que Vercel ignora

Vercel solo sirve el contenido de `dist/`. Los siguientes directorios nunca llegan a producción:
- `src/` — código fuente
- `node_modules/` — dependencias
- `.agent/` — skills y logs internos
- `.env.local` — variables locales

---

## Variables del sistema de Vercel disponibles en Vite

Si en algún momento se necesita saber en qué entorno corre la app:

```js
// En vite.config.js (build-time), usando process.env:
const isProduction = process.env.VERCEL_ENV === 'production';

// En el código cliente (runtime), usando import.meta.env con prefijo VITE_:
// Requiere agregar VITE_VERCEL_ENV en Dashboard o en vercel.json
const env = import.meta.env.VITE_VERCEL_ENV; // 'production' | 'preview' | 'development'
```

---

## Cuándo usar esta skill

- Al crear `vercel.json` por primera vez (ya es necesario)
- Al agregar variables de entorno nuevas al proyecto
- Cuando un deploy falla en Vercel pero el build local pasa
- Cuando la app funciona en dev pero está rota en producción
- Al hacer rollback a un deploy anterior
- Al diagnosticar diferencias de comportamiento entre local y producción
