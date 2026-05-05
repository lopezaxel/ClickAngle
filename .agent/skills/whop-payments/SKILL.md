---
name: whop-payments
description: Skill oficial para integrar Whop como pasarela de pagos en ClickAngles. Cubre webhooks, verificación de firma HMAC, flujo membership.activated → Supabase Edge Function → invite de usuario. Basada en documentación oficial de Whop (API v1, OpenAPI spec verificada).
---

# Whop Payments — Integración ClickAngles

Skill construida desde la documentación oficial de Whop (https://docs.whop.com). Todo lo marcado como ⚠️ INFERIDO no está explicitado en los docs y debe verificarse con la primera prueba del $1.

---

## ¿Qué es Whop?

Plataforma de pagos y membresías digitales. Permite aceptar pagos globales, gestionar accesos (memberships), y recibir webhooks en tiempo real. Para ClickAngles usamos Whop solo como checkout — el control de acceso vive en Supabase.

**API Base URL:** `https://api.whop.com/api/v1`  
**Checkout URL format:** `https://whop.com/checkout/{plan_id}`  
**SDK JS:** `@whop/sdk` (no usado en Edge Functions — usamos fetch directo)

---

## Conceptos Clave

| Concepto | Descripción |
|---|---|
| **Plan** | Configuración de precio. Tiene `id` (formato `plan_xxxxx`). El checkout URL lo usa. |
| **Membership** | Acceso de un usuario a un producto. Se activa al pagar. |
| **Company** | La cuenta del vendedor (nosotros). Tiene un `company_id` (formato `biz_xxxxx`). |
| **Webhook** | Endpoint HTTP POST que Whop llama cuando ocurre un evento. |
| **webhook_secret** | Clave HMAC. Formato: `whsec_abc123def456`. **Solo se devuelve al crear el webhook, nunca después.** Guardarlo en Supabase Secrets inmediatamente. |

---

## Eventos de Webhook (33 disponibles)

Lista completa del enum `WebhookEvent` confirmada por OpenAPI spec:

```
invoice.created, invoice.marked_uncollectible, invoice.paid,
invoice.past_due, invoice.voided,
membership.activated,          ← ✅ EL QUE USAMOS (pago exitoso = acceso activo)
membership.deactivated,        ← útil para suspender acceso futuro
membership.cancel_at_period_end_changed,
payment.created, payment.succeeded, payment.failed, payment.pending,
entry.created, entry.approved, entry.denied, entry.deleted,
setup_intent.requires_action, setup_intent.succeeded, setup_intent.canceled,
withdrawal.created, withdrawal.updated,
course_lesson_interaction.completed,
payout_method.created, verification.succeeded,
payout_account.status_updated,
resolution_center_case.created, resolution_center_case.updated, resolution_center_case.decided,
refund.created, refund.updated,
dispute.created, dispute.updated, dispute_alert.created
```

**¿Por qué `membership.activated` y no `payment.succeeded`?**
- `membership.activated` confirma que el acceso fue concedido (no solo que el pago fue procesado).
- Es el evento correcto para one-time payments Y para futuros modelos de suscripción.
- Contiene el objeto membership completo con datos del usuario.

---

## Objeto Webhook (respuesta de la API)

```json
{
  "id": "hook_xxxxxxxxxxxxx",
  "url": "https://tu-endpoint.com/whop-webhook",
  "enabled": true,
  "events": ["membership.activated"],
  "api_version": "v5",
  "created_at": "2023-12-01T05:00:00.401Z",
  "child_resource_events": false,
  "testable_events": ["membership.activated"],
  "resource_id": "biz_xxxxxxxxxxxxxx",
  "webhook_secret": "whsec_abc123def456"
}
```

**CRÍTICO:** `webhook_secret` SOLO aparece en la respuesta de **Create** (POST /webhooks). No aparece en Retrieve ni List. Guardarlo inmediatamente en Supabase Secrets como `WHOP_WEBHOOK_SECRET`.

---

## Objeto Membership (campos relevantes)

```json
{
  "id": "mem_xxxxxxxxxxxxx",
  "status": "active",
  "user": {
    "id": "user_xxxxxxxxxxxxx",
    "username": "juanperez",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "plan": { "id": "plan_xxxxxxxxxxxxx" },
  "product": { "id": "prod_xxx", "title": "ClickAngles Fundador" },
  "company": { "id": "biz_xxx", "title": "ClickAngles" },
  "currency": "usd",
  "manage_url": "https://whop.com/...",
  "cancel_at_period_end": false,
  "created_at": "2023-12-01T05:00:00.401Z"
}
```

**Status posibles:** `trialing`, `active`, `past_due`, `completed`, `canceled`, `expired`, `unresolved`, `drafted`, `canceling`

**Nota:** El campo `user.email` requiere permiso `member:email:read` en la API key de Whop.

---

## Payload del Webhook Entrante

⚠️ **INFERIDO** — La documentación describe el objeto membership pero no el envelope exacto del webhook. Basado en el SDK oficial y comportamiento estándar de Whop, el payload que llega a nuestro endpoint es:

```json
{
  "action": "membership.activated",
  "data": {
    "object": {
      "id": "mem_xxxxxxxxxxxxx",
      "status": "active",
      "user": {
        "id": "user_xxxxxxxxxxxxx",
        "email": "juan@example.com",
        "name": "Juan Pérez"
      },
      "plan": { "id": "plan_xxxxxxxxxxxxx" },
      "product": { "id": "prod_xxx", "title": "ClickAngles Fundador" }
    }
  }
}
```

**Extracción del email (defensiva):**
```typescript
const obj = payload.data?.object ?? payload.data ?? {}
const email = obj.user?.email ?? obj.email
```

Usar la primera prueba con el producto de $1 para loggear el payload real y confirmar la estructura exacta.

---

## Verificación de Firma HMAC

⚠️ **PARCIALMENTE INFERIDO** — La doc confirma que existe HMAC con el `webhook_secret`. El header y algoritmo exactos son inferidos del SDK.

**Lo que confirma la doc oficial:**
- El campo `webhook_secret` existe y se usa para "HMAC validation logic"
- Formato del secret: `whsec_abc123def456`

**Implementación para Supabase Edge Function (Deno):**

```typescript
async function verifyWhopSignature(
  rawBody: string,
  receivedSignature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Comparación timing-safe aproximada (Deno no tiene timingSafeEqual nativo)
    return computedSig === receivedSignature
  } catch {
    return false
  }
}
```

**Header de firma esperado:** ⚠️ INFERIDO como `whop-signature`

```typescript
const signature = req.headers.get('whop-signature') ?? ''
```

**En la primera prueba real, loggear TODOS los headers:**
```typescript
console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())))
```

---

## Autenticación de la API de Whop

Para llamadas REST desde backend (no necesario para el webhook handler, pero útil para verificar memberships):

```bash
Authorization: Bearer YOUR_WHOP_API_KEY
```

**Tipos de API Keys:**
- **Company API key** → para leer/escribir datos de tu propia empresa (nuestro caso)
- **App API key** → para apps en el marketplace de Whop
- **OAuth tokens** → para actuar en nombre de usuarios

Dashboard para crear keys: `https://whop.com/dashboard/developer`  
Permiso necesario para webhooks: `developer:manage_webhook`

---

## Flujo Completo ClickAngles

```
Usuario → Whop Checkout ($67 / $1 test)
    ↓ pago exitoso
Whop → POST a Edge Function "whop-webhook"
    ├── Verificar firma HMAC (webhook_secret)
    ├── Filtrar evento: solo "membership.activated"
    ├── Extraer email del membership object
    ├── Buscar en profiles si el usuario ya existe
    │     SI existe → usar su user_id
    │     NO existe → supabase.auth.admin.inviteUserByEmail(email, { redirectTo: app_url })
    ├── upsert subscriptions: { user_id, status:'active', duration_type:'lifetime', start_date }
    └── update profiles: { subscription_tier:'founder' }
         ↓
Usuario recibe email de invitación de Supabase
    ↓ hace clic → setea contraseña → sesión activa
App lee subscription.status = 'active' → acceso completo ✅
```

---

## Edge Function — Variables de Entorno Requeridas

| Variable | Dónde obtenerla | Descripción |
|---|---|---|
| `WHOP_WEBHOOK_SECRET` | Al crear el webhook en Whop Dashboard | Clave HMAC, formato `whsec_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Permite operaciones admin (invitar usuarios) |
| `SUPABASE_URL` | Auto-disponible en Supabase Edge Functions | No hay que configurarla manualmente |

**Configuración en Supabase:** Dashboard → Edge Functions → [función] → Secrets

---

## Configuración del Webhook en Whop Dashboard

1. Ir a `https://whop.com/dashboard/developer`
2. Sección "Webhooks" → Crear nuevo webhook
3. **URL:** `https://ahbrflukfncghlyscogq.supabase.co/functions/v1/whop-webhook`
4. **Eventos:** seleccionar `membership.activated`
5. **API Version:** `v5` (la más reciente)
6. Guardar → **copiar el `webhook_secret` inmediatamente** (no vuelve a mostrarse)
7. Pegar el secret en Supabase Secrets como `WHOP_WEBHOOK_SECRET`

---

## Protocolo de Testing (producto de $1)

1. Deployar Edge Function con logging completo de headers y body
2. Comprar el producto de $1: `https://whop.com/checkout/plan_3u0rsp8JZuLnG`
3. Revisar logs en Supabase Dashboard → Edge Functions → Logs
4. Confirmar:
   - Nombre exacto del header de firma
   - Estructura exacta del payload JSON
   - Que el email llega correctamente
5. Ajustar el código si hay diferencias con lo inferido
6. Verificar que el usuario recibió el email de invitación de Supabase
7. Verificar que `subscriptions` y `profiles` se insertaron correctamente

---

## Gotchas y Errores Conocidos

| Problema | Causa | Solución |
|---|---|---|
| Usuario ya existe al pagar de nuevo | `inviteUserByEmail` falla si el email ya está registrado | Buscar primero en `profiles` por email; si existe, usar ese `user_id` |
| `webhook_secret` perdido | Solo se muestra al crear el webhook | Guardarlo inmediatamente en Supabase Secrets |
| Email no llega en payload | Permiso `member:email:read` ausente en API key de Whop | Verificar permisos al crear la Company API key |
| Firma no válida | Secret incorrecto o body parseado antes de leerlo como texto | Leer el body como `req.text()` ANTES de `JSON.parse()` |
| Edge Function timeout | Operaciones de Supabase lentas | Usar Supabase Pro (ya configurado) con timeouts de 15s |

---

## URLs de Referencia del Proyecto

- **App:** `https://clickangles.sistemaniki.com/`
- **Supabase Project:** `https://ahbrflukfncghlyscogq.supabase.co`
- **Edge Function URL:** `https://ahbrflukfncghlyscogq.supabase.co/functions/v1/whop-webhook`
- **Checkout test ($1):** `https://whop.com/checkout/plan_3u0rsp8JZuLnG`
- **Checkout producción ($67):** pendiente de configurar en Whop
- **Whop Developer Dashboard:** `https://whop.com/dashboard/developer`
