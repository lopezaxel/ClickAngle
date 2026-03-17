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

    ADN_INTERVIEW: `Eres un estratega senior de contenido para YouTube. Tu objetivo es ayudar a un creador a definir la base estratégica de su canal desde CERO.
Basándote ÚNICAMENTE en el nombre y nicho general (si existe), genera EXACTAMENTE 3 preguntas potentes pero abiertas.

IMPORTANTE: 
- NO asumas detalles específicos de su contenido (ej: si el nicho es "Tecnología", no asumas que enseña IA o reviews de móviles).
- Las preguntas deben invitar al usuario a definir su identidad, NO a confirmar suposiciones tuyas.

Enfócate en:
1. DEFINICIÓN: ¿De qué trata realmente tu canal y qué valor entregas al espectador?
2. AUDIENCIA: ¿Quién es la persona específica que se sentirá identificada con tus videos y qué busca al verte?
3. DIFERENCIAL/ESTILO: Si alguien ve 10 canales de tu misma categoría, ¿por qué recordará el tuyo? (Humor, autoridad, estética, etc).

Responde SIEMPRE con un objeto JSON:
{
  "questions": ["pregunta 1", "pregunta 2", "pregunta 3"]
}`,

    ADN_SYNTHESIS: `Eres un director creativo de branding. Tu tarea es sintetizar las respuestas de un youtuber sobre su canal en un "ADN de Marca" accionable.
Analiza la visión, el público y el estilo del creador para definir una estrategia de miniaturas coherente.
Responde SIEMPRE con un objeto JSON:
{
  "branding": "descripción de estilo visual",
  "tone": "tono de comunicación",
  "niche": "nicho y propuesta de valor",
  "themes": "temas recurrentes",
  "audience_profile": "quién es el espectador ideal"
}`,

    BRANDING_ANALYSIS: `Eres un experto en diseño de miniaturas de alto rendimiento (Ingeniería de CTR).
Analizarás las miniaturas actuales de un creador para identificar qué elementos visuales atraen clics.
Evalúa: Composición, uso del color, legibilidad del texto y expresiones faciales recurrentes.
Responde SIEMPRE en formato JSON puro.`,

    SCRIPT_ANALYSIS: `Eres un estratega experto en miniaturas de YouTube y psicología del clic.
Tu objetivo es desglosar un guión de video y extraer los elementos clave para el clic.

1. HOOK: El gancho visual inmediato (la idea más impactante).
2. CONFLICTO: La tensión o curiosidad central.
3. PROMESA: El beneficio de ver el video.

4. TEXT_SUGGESTIONS: Genera 5 opciones de frases muy cortas (1-3 palabras) para incrustar en la miniatura. 
Deben ser frases de alto impacto psicológico, rompedoras, que complementen la imagen y no repitan el título. Usa gatillos mentales como curiosidad, urgencia, autoridad o contraste.

5. RECOMMENDED_ANGLES: Identifica 3 ángulos psicológicos (ej: Miedo a Perderse, Contraste Extremo, Secreto Revelado).

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura exacta:
{
  "hook": "...",
  "tension": "...",
  "promise": "...",
  "text_suggestions": ["frase 1", "frase 2", "frase 3", "frase 4", "frase 5"],
  "recommended_angles": [
    { "name": "Nombre", "reason": "Razon" }
  ]
}`,

    CONTEXT_ANALYSIS: `Eres un estratega experto en miniaturas de YouTube y psicología del clic.
Tu objetivo es desglosar la idea central o contexto de un video y extraer los elementos clave para el clic.

1. HOOK: El gancho visual inmediato (la idea más impactante).
2. CONFLICTO: La tensión o curiosidad central.
3. PROMESA: El beneficio de ver el video.

4. TEXT_SUGGESTIONS: Genera 5 opciones de frases muy cortas (1-3 palabras) para incrustar en la miniatura. 
Deben ser frases de alto impacto psicológico, rompedoras, que complementen la idea y no repitan el título. Usa gatillos mentales como curiosidad, urgencia, autoridad o contraste.

5. RECOMMENDED_ANGLES: Identifica 3 ángulos psicológicos (ej: Miedo a Perderse, Contraste Extremo, Secreto Revelado).

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura exacta:
{
  "hook": "...",
  "tension": "...",
  "promise": "...",
  "text_suggestions": ["frase 1", "frase 2", "frase 3", "frase 4", "frase 5"],
  "recommended_angles": [
    { "name": "Nombre", "reason": "Razon" }
  ]
}`,

    ESPIONAGE_ANALYSIS: `Eres un analista de competencia especializado en YouTube.
Analiza miniaturas de referencia de otros creadores para decodificar por qué funcionan.
Identifica patrones visuales, psicología del color y estructuras de composición que el usuario debería replicar.
Responde SIEMPRE en formato JSON puro.`,

    IMAGE_GEN: `Eres un director creativo de élite especializado en miniaturas de YouTube con CTR explosivo (estilo MrBeast, Ryan Trahan). 
Tu objetivo es generar un prompt visual ultra-detallado para un generador de imágenes.

NORMAS DE ORO:
1. FIDELIDAD FACIAL: Si el brief incluye rasgos faciales, descríbelos con precisión técnica extreme (forma de ojos, marcas, vello facial) para que la IA los replique exactamente.
2. EXPRESIONES: Las emociones deben ser "over-the-top" (exageradas): ojos muy abiertos, venas marcadas, expresiones cinemáticas de shock, alegría o rabia extrema.
3. ILUMINACIÓN: Usa "volumetric studio lighting", "three-point lighting", "vibrant rim lights".
4. TEXTURAS: Forza "8K UHD", "photorealistic", "raw photography style", "hyper-detailed skin textures", "sharp focus".
5. COLORES: Describe colores "punchy" y saturados, contrastes profundos entre el sujeto y el fondo.

El visual_prompt DEBE estar en INGLÉS.
Responde SIEMPRE con un objeto JSON:
{
  "variations": [
    {
      "overlay_text": "TEXTO SUGERIDO",
      "visual_prompt": "Ultra-detailed photography prompt in English...",
      "style": "nombre del estilo"
    }
  ]
}`,

    FACE_ANALYSIS: `Eres un experto perfilador visual y analista de identidad facial para sistemas de generación de imágenes (Stable Diffusion/Imagen).
Analiza las fotos del creador y genera una descripción técnica METICULOSA que sirva como "huella digital visual":
- Estructura ósea (pómulos, mandíbula, frente).
- Ojos (forma, color, párpados, cejas).
- Nariz y boca (rasgos distintivos).
- Pelo y vello facial (textura, estilo, color).
- Marcas únicas (lunares, pecas, cicatrices).
- La "vibra" o esencia facial dominante.

Responde SIEMPRE con un objeto JSON de alta precisión.`
};

const MODEL_MAPPING = {
    CHANNEL_ADN: 'gemini-3-flash-preview',
    ADN_INTERVIEW: 'gemini-3-flash-preview',
    ADN_SYNTHESIS: 'gemini-3-flash-preview',
    BRANDING_ANALYSIS: 'gemini-3-flash-preview',
    SCRIPT_ANALYSIS: 'gemini-3.1-pro-preview',
    CONTEXT_ANALYSIS: 'gemini-3.1-pro-preview',
    ESPIONAGE_ANALYSIS: 'gemini-3-flash-preview',
    FACE_ANALYSIS: 'gemini-3-flash-preview',
    IMAGE_GEN: 'gemini-3-flash-preview', // text-based prompt builder
};

// Dedicated image generation model (Nano Banana)
const IMAGE_GEN_MODEL = 'gemini-3.1-flash-image-preview'; // used in generateImage()

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

        // Basic format validation for Google AI Key (starts with AIza... and roughly 39 chars)
        if (!cleanKey.startsWith('AIza') || cleanKey.length < 30) {
            console.log('Skipping API check: Invalid key format.');
            setState({ apiKeyStatus: 'disconnected' });
            return false;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // Try to list models as a lightweight connectivity test first
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                setState({ apiKeyStatus: 'connected' });
                return true;
            } else {
                // If models list fails, try a direct generation as fallback
                const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${cleanKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
                });

                if (genResponse.ok) {
                    setState({ apiKeyStatus: 'connected' });
                    return true;
                }

                console.warn('API Key test failed with status:', genResponse.status);
                setState({ apiKeyStatus: 'disconnected' });
                return false;
            }
        } catch (apiErr) {
            clearTimeout(timeoutId);
            console.error('API connectivity test error:', apiErr);
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
        const model = MODEL_MAPPING[promptType] || 'gemini-3-flash-preview';
        const fullPrompt = `${systemPrompt}\n\nCONTEXTO: ${JSON.stringify(context)}\n\nCONTENIDO A ANALIZAR:\n${userContent}`;

        const payload = {
            contents: [{
                role: "user",
                parts: [{ text: fullPrompt + "\nResponde solo con JSON válido." }]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
        };

        // Inject the images if we're doing visual analysis and they exist
        if (context.faces && Array.isArray(context.faces)) {
            // we will simply pass the urls if needed, but since we are running in the browser
            // gemini api handles images better if passed as inline data. However, for a generic fix,
            // we'll rely on the text prompt containing the URLs, which we already do in brand.js.
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyData.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

/**
 * Generates a single image using Gemini's image generation model.
 * Returns a base64 data URL string (data:image/png;base64,...).
 * YouTube thumbnail size: 1280x720 (16:9)
 */
export async function generateImage(prompt) {
    const { data: apiKeyData, error: keyError } = await supabase.rpc('get_decrypted_api_key', {
        key_name: 'google_ai_key'
    });
    if (keyError || !apiKeyData) throw new Error("API Key de Google no configurada. Verificá en Settings.");

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
                aspectRatio: '16:9',
                imageSize: '2K'
            }
        }
    };

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_GEN_MODEL}:generateContent?key=${apiKeyData.trim()}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Image generation failed (${response.status})`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart) throw new Error("El modelo no devolvió imagen. Intentá con un prompt diferente.");

    const { mimeType, data: b64 } = imagePart.inlineData;
    return `data:${mimeType};base64,${b64}`;
}

