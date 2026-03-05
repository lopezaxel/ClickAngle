import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Manejo de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Obtener la llave desencriptada usando el RPC seguro que creamos
        // Este RPC verifica que el usuario esté autenticado y solo devuelve SU llave
        const { data: apiKey, error: keyError } = await supabaseClient.rpc('get_decrypted_api_key', {
            key_name: 'google_ai_key'
        })

        if (keyError || !apiKey) {
            return new Response(JSON.stringify({ error: "No se pudo recuperar la llave API. Asegúrate de haberla configurado en Settings." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 2. Obtener el cuerpo de la petición (prompt, etc.)
        const { prompt, systemInstruction } = await req.json()

        // 3. Llamar a Google AI Studio (Gemini API) desde el servidor
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `${systemInstruction}\n\nCONTENIDO A ANALIZAR:\n${prompt}` }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            })
        })

        const result = await response.json()

        // Devolver el resultado a la aplicación (sin la llave!)
        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
