import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHOP_WEBHOOK_SECRET    = Deno.env.get('WHOP_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL           = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? ''

async function verifySignature(rawBody: string, receivedSig: string): Promise<boolean> {
  if (!WHOP_WEBHOOK_SECRET || !receivedSig) return false
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WHOP_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const computed = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return computed === receivedSig
  } catch {
    return false
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await req.text()

  // Loggeamos todos los headers en los primeros runs para confirmar el nombre del header de firma
  const headersLog: Record<string, string> = {}
  req.headers.forEach((v, k) => { headersLog[k] = v })
  console.log('WHOP WEBHOOK HEADERS:', JSON.stringify(headersLog))
  console.log('WHOP WEBHOOK BODY:', rawBody.substring(0, 800))

  const signature = req.headers.get('whop-signature') ?? ''
  const isValid = await verifySignature(rawBody, signature)

  if (!isValid) {
    // Durante el testing inicial loggeamos sin bloquear para confirmar la firma correcta.
    // Una vez confirmado, reemplazar este bloque por: return new Response('Unauthorized', { status: 401 })
    console.warn('⚠️ Firma inválida o header incorrecto. Recibida:', signature)
    console.warn('Verificá el nombre del header de firma en los logs de arriba.')
  }

  let payload: { action?: string; data?: { object?: Record<string, unknown> } }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  console.log('EVENTO:', payload.action)

  // Solo procesamos el evento de membership activada (pago exitoso)
  // Whop puede enviar 'membership.activated' o 'membership_activated' según la versión
  const action = payload.action ?? ''
  if (action !== 'membership.activated' && action !== 'membership_activated') {
    return new Response('OK - evento ignorado', { status: 200 })
  }

  // Extraer email defensivamente desde múltiples rutas posibles del payload
  const obj = (payload.data?.object ?? {}) as Record<string, unknown>
  const user = obj.user as Record<string, unknown> | undefined
  const email = (user?.email ?? obj.email) as string | undefined

  if (!email) {
    console.error('No se encontró email en el payload:', JSON.stringify(payload))
    return new Response('No email found', { status: 400 })
  }

  console.log('Procesando membership.activated para:', email)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Verificar si el usuario ya existe en profiles (compra duplicada o retest)
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let userId: string

  if (existingProfile?.id) {
    userId = existingProfile.id as string
    console.log('Usuario ya existe, actualizando suscripción:', userId)
  } else {
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://clickangles.sistemaniki.com/'
    })
    if (inviteError) {
      console.error('Error al invitar usuario:', inviteError)
      return new Response('Error inviting user', { status: 500 })
    }
    userId = inviteData.user.id
    console.log('Usuario invitado exitosamente:', userId)
  }

  const now = new Date().toISOString()

  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert(
      { user_id: userId, status: 'active', duration_type: 'lifetime', start_date: now },
      { onConflict: 'user_id' }
    )
  if (subError) console.error('Error en subscriptions:', subError)

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, email, subscription_tier: 'founder' },
      { onConflict: 'id' }
    )
  if (profileError) console.error('Error en profiles:', profileError)

  console.log('✅ Procesamiento completo para:', email)
  return new Response(JSON.stringify({ ok: true, userId, email }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
})
