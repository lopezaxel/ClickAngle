import { supabase } from './supabase.js';
import { setState } from './state.js';

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
    CHANNEL_ADN: 'gemini-1.5-flash',
    BRANDING_ANALYSIS: 'gemini-1.5-flash',
    SCRIPT_ANALYSIS: 'gemini-1.5-pro', // High context for scripts
    ESPIONAGE_ANALYSIS: 'gemini-1.5-flash',
    IMAGE_GEN: 'gemini-2.0-flash', 
};

export async function checkApiKey() {
    try {
        const { data: apiKeyData, error: rpcError } = await supabase.rpc('get_decrypted_api_key', {
            key_name: 'google_ai_key'
        });

        if (rpcError || !apiKeyData) {
            setState({ apiKeyStatus: 'not_connected' });
            return false;
        }

        const cleanKey = apiKeyData.trim();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                setState({ apiKeyStatus: 'connected' });
                return true;
            } else {
                setState({ apiKeyStatus: 'disconnected' });
                return false;
            }
        } catch (apiErr) {
            clearTimeout(timeoutId);
            setState({ apiKeyStatus: 'disconnected' });
            return false;
        }
    } catch (err) {
        console.error('Critical checkApiKey error:', err);
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
            throw new Error("API Key de Google no configurada. Verificá en Settings.");
        }

        const systemPrompt = SYSTEM_PROMPTS[promptType];
        const model = MODEL_MAPPING[promptType] || 'gemini-1.5-flash';
        const fullPrompt = `${systemPrompt}\n\nCONTEXTO: ${JSON.stringify(context)}\n\nCONTENIDO A ANALIZAR:\n${userContent}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyData.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: fullPrompt }]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (response.status === 401) {
                setState({ apiKeyStatus: 'disconnected' });
                throw new Error("API Key inválida.");
            }
            throw new Error(errData.error?.message || "Error en la API de Google");
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) throw new Error("La IA no devolvió respuesta.");

        setState({ apiKeyStatus: 'connected' });

        // Robust JSON cleaning
        let cleanJson = aiText.trim();
        const jsonMatch = cleanJson.match(/[\{\[]([\s\S]*)[\}\]]/);
        if (jsonMatch) {
            cleanJson = jsonMatch[0];
        } else if (cleanJson.includes('```')) {
            cleanJson = cleanJson.replace(/```json|```/g, '').trim();
        }

        try {
            return JSON.parse(cleanJson);
        } catch (parseErr) {
            console.error('JSON Parse Error:', aiText);
            throw new Error("Formato de datos inválido.");
        }
    } catch (err) {
        console.error(`AI Error (${promptType}):`, err);
        throw err;
    }
}


