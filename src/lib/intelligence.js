import { supabase } from './supabase.js';

/**
 * Intelligence Layer for ClickAngle
 * Handles specialized prompts and AI calls for different creative phases.
 */

const SYSTEM_PROMPTS = {
    CHANNEL_ADN: `Eres un experto estratega de YouTube y branding digital. 
Tu tarea es realizar un análisis profundo del "ADN" de un canal basándote en su descripción y nicho.
Debes identificar:
1. Branding Visual (Colores, atmósfera, estilo de miniaturas sugerido).
2. Tono de Comunicación (Formal, agresivo, educativo, humorístico).
3. Temas Clave y Pilares de Contenido.
4. Perfil del Espectador Ideal (Psicografía y deseos).
Responde SIEMPRE en formato JSON puro.`,

    BRANDING_ANALYSIS: `Eres un experto en diseño de miniaturas de alto rendimiento (Ingeniería de CTR).
Analizarás las miniaturas actuales de un creador para identificar qué elementos visuales atraen clics.
Evalúa: Composición, uso del color, legibilidad del texto y expresiones faciales recurrentes.
Responde SIEMPRE en formato JSON puro.`,

    SCRIPT_ANALYSIS: `Eres un guionista experto en retención visual.
Tu objetivo es desglosar un guión de video para extraer los 3 pilares de una miniatura ganadora:
1. HOOK: El gancho visual inmediato.
2. TENSIÓN: El conflicto o curiosidad que genera el deseo de hacer clic.
3. PROMESA: El beneficio claro de ver el video.
También recomienda 3 ángulos de miniatura específicos basados en este guión.
Responde SIEMPRE en formato JSON puro.`,

    ESPIONAGE_ANALYSIS: `Eres un analista de competencia especializado en YouTube.
Analiza miniaturas de referencia de otros creadores para decodificar por qué funcionan.
Identifica patrones visuales, psicología del color y estructuras de composición que el usuario debería replicar.
Responde SIEMPRE en formato JSON puro.`,

    IMAGE_GEN: `Eres un experto en generación de prompts para miniaturas de YouTube. 
Tu objetivo es crear una descripción visual altamente detallada que sea optimizada para modelos de generación de imagen.
Enfócate en: Composición, Iluminación Cinematográfica, Expresiones de alto impacto y Estilo "Clickbait" Profesional.`
};

const MODEL_MAPPING = {
    CHANNEL_ADN: 'gemini-1.5-flash-latest',
    BRANDING_ANALYSIS: 'gemini-1.5-flash-latest',
    SCRIPT_ANALYSIS: 'gemini-1.5-pro-latest', // High context for scripts
    ESPIONAGE_ANALYSIS: 'gemini-1.5-flash-latest',
    IMAGE_GEN: 'gemini-2.0-flash', // Still valid
};

import { setState } from './state.js';

export async function checkApiKey() {
    try {
        const { data: apiKeyData, error: rpcError } = await supabase.rpc('get_decrypted_api_key', {
            key_name: 'google_ai_key'
        });

        if (rpcError) {
            console.error('RPC Error fetching key:', rpcError);
            if (rpcError.message?.includes('Refresh Token')) {
                // If token is invalid, we can't do anything until relogin
                setState({ apiKeyStatus: 'not_connected' });
                return false;
            }
        }

        if (!apiKeyData) {
            setState({ apiKeyStatus: 'not_connected' });
            return false;
        }

        const cleanKey = apiKeyData.trim();

        // Quick test call to verify key - using v1 and gemini-1.5-flash:generateContent
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${cleanKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });

        if (response.ok) {
            setState({ apiKeyStatus: 'connected' });
            return true;
        } else {
            const errData = await response.json().catch(() => ({}));
            console.error('Google API Error Validation:', errData);

            // If it's a 404, maybe the model name is still wrong? Try fallback
            if (response.status === 404) {
                console.warn('404 on gemini-1.5-flash, key might be restricted or project not configured.');
            }

            setState({ apiKeyStatus: 'disconnected' });
            return false;
        }
    } catch (err) {
        console.error('Error verificando API key:', err);
        setState({ apiKeyStatus: 'disconnected' });
        return false;
    }
}

export async function callAI(promptType, userContent, context = {}) {
    try {
        const { data: apiKeyData, error: keyError } = await supabase.rpc('get_decrypted_api_key', {
            key_name: 'google_ai_key'
        });

        if (keyError || !apiKeyData) {
            setState({ apiKeyStatus: 'not_connected' });
            throw new Error("API Key de Google no configurada en Settings.");
        }

        const systemPrompt = SYSTEM_PROMPTS[promptType];
        const model = MODEL_MAPPING[promptType] || 'gemini-1.5-flash';
        const fullPrompt = `${systemPrompt}\n\nCONTEXTO: ${JSON.stringify(context)}\n\nCONTENIDO A ANALIZAR:\n${userContent}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyData}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: fullPrompt }]
                }]
            })
        });

        const data = await response.json();

        if (data.error) {
            if (data.error.code === 401 || data.error.status === 'UNAUTHENTICATED') {
                setState({ apiKeyStatus: 'disconnected' });
            }
            throw new Error(data.error.message);
        }

        // Successfully called
        setState({ apiKeyStatus: 'connected' });

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (err) {
        console.error(`AI Error (${promptType}):`, err);
        throw err;
    }
}

