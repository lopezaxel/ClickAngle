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
Responde SIEMPRE en formato JSON puro.`
};

export async function callAI(promptType, userContent, context = {}) {
    try {
        const { data: apiKeyData, error: keyError } = await supabase.rpc('get_decrypted_api_key', {
            key_name: 'google_ai_key'
        });

        if (keyError || !apiKeyData) {
            throw new Error("API Key de Google no configurada en Settings.");
        }

        const systemPrompt = SYSTEM_PROMPTS[promptType];
        const fullPrompt = `${systemPrompt}\n\nCONTEXTO: ${JSON.stringify(context)}\n\nCONTENIDO A ANALIZAR:\n${userContent}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKeyData}`, {
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
        if (data.error) throw new Error(data.error.message);

        const aiText = data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (err) {
        console.error(`AI Error (${promptType}):`, err);
        throw err;
    }
}
