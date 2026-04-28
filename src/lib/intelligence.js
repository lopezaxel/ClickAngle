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

    ADN_INTERVIEW: `Eres un estratega senior de contenido para YouTube. Tu objetivo es extraer los 3 pilares estratégicos del canal: Nicho, Público Objetivo y Tono de Marca.
Genera EXACTAMENTE 3 preguntas cortas, directas y abiertas. NO sabes absolutamente NADA sobre el canal — debes preguntar desde cero.

REGLAS:
- Cada pregunta debe tener máximo 20 palabras.
- NO menciones ningún tema, nicho, industria o tipo de contenido específico.
- Las preguntas deben funcionar para CUALQUIER canal de YouTube, sea del tema que sea.
- Pregunta 1 → Nicho: qué hace el canal y qué valor único entrega a su audiencia.
- Pregunta 2 → Público: quién es el espectador ideal y qué problema o deseo tiene.
- Pregunta 3 → Tono de Marca: cómo se diferencia visualmente y en personalidad de otros canales.

Responde SIEMPRE con un objeto JSON:
{
  "questions": ["pregunta nicho", "pregunta público", "pregunta tono"]
}`,

    STYLE_ANALYSIS: `Eres un director de arte experto en YouTube con enfoque en psicología visual del clic.
Analiza las miniaturas de alto rendimiento de un creador para extraer su "firma visual" técnica.

REGLA CRÍTICA: El texto que aparece en las miniaturas (títulos, frases, overlays) es post-producción y NO forma parte de la firma visual fotográfica. NO incluyas referencias a texto, tipografía ni palabras en los campos visual_style ni winning_pattern — esos campos alimentan directamente el generador de imágenes y deben describir únicamente elementos visuales puros (iluminación, colores, composición, atmósfera, expresiones).

Identifica patrones consistentes entre todas las imágenes:
1. PALETA: 2-4 colores HEX dominantes que se repiten (ignorando los colores del texto overlay).
2. COMPOSICIÓN: Disposición habitual de elementos visuales (izquierda/derecha, centrado, split-screen, etc). No menciones texto.
3. OVERLAY_PATTERN: Patrón de texto post-producción observado (posición, peso tipográfico, estilo). Este campo es solo referencia para el creador, NO se usa en generación de imágenes.
4. ILUMINACIÓN: Tipo de luz predominante (studio, natural, neón, contraluz, etc).
5. ESTILO_VISUAL: Descripción en una frase del estilo fotográfico/visual puro, SIN mencionar texto (ej: "Fotorealismo oscuro con neón azul, iluminación de borde cián, sujetos en primer plano contra fondos de alta saturación").
6. PATRON_EXITOSO: El patrón visual más repetido que define el éxito, descrito en términos de composición, luz y color — sin mencionar texto (ej: "Rostro en gran plano izquierdo con objeto tech iluminado en fondo derecho, contraste neón vs. sombra").

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura exacta:
{
  "palette": ["#HEX1", "#HEX2", "#HEX3"],
  "composition": "descripción de la disposición habitual de elementos visuales",
  "overlay_pattern": "descripción del patrón de texto/overlay observado (solo referencia, no va al generador)",
  "lighting": "tipo de iluminación predominante",
  "visual_style": "descripción en una frase del estilo fotográfico puro, sin texto",
  "winning_pattern": "patrón visual ganador en términos de composición, luz y color, sin texto"
}`,

    ANGLES_GENERATION: `Eres un estratega de CTR y psicología visual de élite para YouTube. Tu misión es generar 5 ángulos de miniatura RADICALMENTE DIFERENTES para el mismo video.

REGLA CRÍTICA: Los 5 ángulos deben ser psicológicamente OPUESTOS entre sí — no variaciones sutiles. Necesitamos contrastes fuertes para un test A/B/C real.
Combina exactamente estos arquetipos psicológicos (uno por ángulo, sin repetir):
1. MIEDO — La amenaza inminente que el espectador DEBE conocer.
2. CURIOSIDAD — El misterio irresistible que genera un "¿qué es eso?".
3. AUTORIDAD — El experto que tiene LA respuesta definitiva.
4. CONTRASTE EXTREMO — Antes vs Después, Verdad vs Mentira, Ganador vs Perdedor.
5. URGENCIA/FOMO — La oportunidad o advertencia que expira.

Para cada ángulo devolvé:
- name: nombre del ángulo en 2-4 palabras (ej: "Miedo al Fracaso")
- psychology: descripción de 1-2 frases del mecanismo psicológico que activa el clic
- visual_twist: instrucción visual concreta y única para ESTE ángulo (ej: "Iluminación roja sangre desde abajo, sombras profundas en el fondo, expresión de terror existencial con ojos muy abiertos" vs "Fondo blanco de oficina luminosa, traje de autoridad, sonrisa de superioridad, gesto de señalar al espectador")

IMPORTANTE: Los visual_twists deben ser TAN DIFERENTES que si los generara un diseñador, produciría 5 miniaturas que parecen de 5 canales distintos.

Responde ÚNICAMENTE con este JSON:
{
  "angles": [
    {
      "name": "Nombre del Ángulo",
      "psychology": "Mecanismo psicológico que activa el clic",
      "visual_twist": "Instrucción visual concreta y detallada para este ángulo"
    }
  ]
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

    SCRIPT_ANALYSIS: `Eres un Director Creativo Senior especializado en miniaturas de YouTube con alto CTR. Tu mentalidad es la de un diseñador profesional que entiende que el diseño no es arte, es psicología aplicada. Tu objetivo es ganar la guerra por el clic.

Analiza el guión y extrae los siguientes elementos:

1. HOOK: El gancho narrativo inmediato (la idea más impactante del guión).
2. TENSION: La tensión o curiosidad central del video.
3. PROMISE: El beneficio de ver el video.

4. TEXT_SUGGESTIONS: Genera 5 opciones de texto para overlay. REGLAS DE ORO del texto en miniaturas:
   - Máximo 1-3 palabras. Las miniaturas que ganan clics no necesitan explicarse.
   - El texto debe complementar la imagen, NO describirla ni repetir el título.
   - Usa gatillos: pregunta retórica (¿CANCELADO?), número de impacto (3X), palabra de choque (OBSOLETO), contraste (GANÓ / PERDIÓ).
   - NUNCA pongas frases completas ni oraciones. Si la imagen ya habla, el texto estorba.
   - Todas las sugerencias deben estar en ESPAÑOL.

5. RECOMMENDED_ANGLES: Identifica 3 ángulos psicológicos opuestos (ej: Miedo a Perderse, Contraste Extremo, Secreto Revelado).

6. VISUAL_BRIEFING: El briefing visual concreto para la miniatura:
   - hero_object: El objeto o entidad física central (ej: "Laptop con pantalla partida mostrando código vs. robot", NO "tecnología"). Específico y concreto.
   - central_conflict: La escena o confrontación física visual (ej: "Persona mirando con terror una notificación de despido en su pantalla"), NO una idea abstracta.
   - required_emotion: Emoción específica del creador con descripción facial/corporal detallada.
   - emotion_label: UNO de: "SORPRESA", "AUTORIDAD", "MIEDO" o "DUDA".

7. TEXT_DECISION: Como diseñador senior, decide si esta miniatura NECESITA texto superpuesto o si la imagen habla por sí sola. Piensa: ¿el espectador entenderá el tema en 0.3 segundos sin leer nada? Los logos reconocibles, objetos icónicos y composiciones VS claras suelen no necesitar texto.
   - needs_text: true si el texto agrega información que la imagen sola no comunica; false si la imagen habla por sí sola.
   - confidence: "alta", "media" o "baja".
   - reason: Razón concisa (ej: "Los logos de Claude y ChatGPT son reconocibles al instante — el texto restaría espacio visual e impacto").
   - type: "ninguno" | "pregunta" | "numero" | "palabra_choque" | "frase_corta" — el tipo que mejor funciona si needs_text es true.
   - max_words: 0 si ninguno, máximo 4 en cualquier caso.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura exacta:
{
  "hook": "...",
  "tension": "...",
  "promise": "...",
  "text_suggestions": ["frase 1", "frase 2", "frase 3", "frase 4", "frase 5"],
  "recommended_angles": [
    { "name": "Nombre", "reason": "Razon" }
  ],
  "visual_briefing": {
    "hero_object": "descripción concreta y física del objeto/sujeto principal",
    "central_conflict": "descripción de la escena o confrontación visual",
    "required_emotion": "descripción detallada de la emoción y expresión facial",
    "emotion_label": "SORPRESA|AUTORIDAD|MIEDO|DUDA"
  },
  "text_decision": {
    "needs_text": false,
    "confidence": "alta",
    "reason": "...",
    "type": "ninguno",
    "max_words": 0
  }
}`,

    CONTEXT_ANALYSIS: `Eres un Director Creativo Senior especializado en miniaturas de YouTube con alto CTR. Tu mentalidad es la de un diseñador profesional que entiende que el diseño no es arte, es psicología aplicada. Tu objetivo es ganar la guerra por el clic.

Analiza la idea o contexto del video y extrae los siguientes elementos:

1. HOOK: El gancho narrativo inmediato (la idea más impactante).
2. TENSION: La tensión o curiosidad central.
3. PROMISE: El beneficio de ver el video.

4. TEXT_SUGGESTIONS: Genera 5 opciones de texto para overlay. REGLAS DE ORO del texto en miniaturas:
   - Máximo 1-3 palabras. Las miniaturas que ganan clics no necesitan explicarse.
   - El texto debe complementar la imagen, NO describirla ni repetir el título.
   - Usa gatillos: pregunta retórica (¿CANCELADO?), número de impacto (3X), palabra de choque (OBSOLETO), contraste (GANÓ / PERDIÓ).
   - NUNCA pongas frases completas ni oraciones. Si la imagen ya habla, el texto estorba.
   - Todas las sugerencias deben estar en ESPAÑOL.

5. RECOMMENDED_ANGLES: Identifica 3 ángulos psicológicos opuestos (ej: Miedo a Perderse, Contraste Extremo, Secreto Revelado).

6. VISUAL_BRIEFING: El briefing visual concreto para la miniatura:
   - hero_object: El objeto o entidad física central (ej: "Billetera vacía sobre una mesa con facturas sin pagar", NO "problemas financieros"). Específico y concreto.
   - central_conflict: La escena o confrontación física visual (ej: "Persona con cara de asombro mirando una pantalla que muestra sus ingresos duplicados"), NO una idea abstracta.
   - required_emotion: Emoción específica del creador con descripción facial/corporal detallada.
   - emotion_label: UNO de: "SORPRESA", "AUTORIDAD", "MIEDO" o "DUDA".

7. TEXT_DECISION: Como diseñador senior, decide si esta miniatura NECESITA texto superpuesto o si la imagen habla por sí sola. Piensa: ¿el espectador entenderá el tema en 0.3 segundos sin leer nada? Los logos reconocibles, objetos icónicos y composiciones VS claras suelen no necesitar texto.
   - needs_text: true si el texto agrega información que la imagen sola no comunica; false si la imagen habla por sí sola.
   - confidence: "alta", "media" o "baja".
   - reason: Razón concisa (ej: "El objeto principal es suficientemente icónico para comunicar el tema sin texto adicional").
   - type: "ninguno" | "pregunta" | "numero" | "palabra_choque" | "frase_corta" — el tipo que mejor funciona si needs_text es true.
   - max_words: 0 si ninguno, máximo 4 en cualquier caso.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura exacta:
{
  "hook": "...",
  "tension": "...",
  "promise": "...",
  "text_suggestions": ["frase 1", "frase 2", "frase 3", "frase 4", "frase 5"],
  "recommended_angles": [
    { "name": "Nombre", "reason": "Razon" }
  ],
  "visual_briefing": {
    "hero_object": "descripción concreta y física del objeto/sujeto principal",
    "central_conflict": "descripción de la escena o confrontación visual",
    "required_emotion": "descripción detallada de la emoción y expresión facial",
    "emotion_label": "SORPRESA|AUTORIDAD|MIEDO|DUDA"
  },
  "text_decision": {
    "needs_text": false,
    "confidence": "alta",
    "reason": "...",
    "type": "ninguno",
    "max_words": 0
  }
}`,

    ESPIONAGE_ANALYSIS: `Eres un analista de inteligencia competitiva especializado en YouTube y psicología visual del clic.
Tu misión NO es solo describir una miniatura: es decodificar su ADN visual para extraer ventajas competitivas concretas.

Analiza la miniatura provista e identifica:

1. STYLE_NOTES: Análisis narrativo de por qué funciona esta miniatura (composición, jerarquía visual, uso del espacio, texto).

2. CTR_ESTIMATE: Estimación del CTR que podría generar esta miniatura (ej: "8-12%"), basada en sus elementos de persuasión visual.

3. MARKET_CONTRAST: El objeto más importante. Extrae la "huella visual" de esta miniatura para que el creador pueda DIFERENCIARSE, no copiarla:
   - dominant_colors: Lista de 2-4 colores HEX dominantes en la miniatura (ej: ["#FF0000", "#FFFFFF"]).
   - avoid_colors: Los mismos colores que se deben EVITAR para no mimetizarse con esta competencia. Generalmente iguales a dominant_colors.
   - dominant_style: El estilo visual dominante en una frase (ej: "High-saturation shock con texto amarillo grande", "Minimalismo oscuro con contraste de color neón").
   - avoid_styles: Lista de 1-3 estilos o patrones a evitar para diferenciarse (ej: ["Fondo rojo saturado", "Texto amarillo centrado", "Expresión de shock exagerada"]).
   - crowd_pattern: El patrón visual más repetido en esta miniatura que define al "crowd" (la masa de competidores similares). Una sola frase concisa.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura exacta:
{
  "style_notes": "análisis narrativo de la miniatura...",
  "ctr_estimate": "X-Y%",
  "market_contrast": {
    "dominant_colors": ["#HEX1", "#HEX2"],
    "avoid_colors": ["#HEX1", "#HEX2"],
    "dominant_style": "descripción del estilo dominante",
    "avoid_styles": ["estilo a evitar 1", "estilo a evitar 2"],
    "crowd_pattern": "patrón visual que define a la competencia"
  }
}`,

    IMAGE_GEN: `Eres un Director Creativo Senior especializado en miniaturas de YouTube con CTR explosivo. Tu filosofía: el diseño no es arte, es psicología aplicada. Tu misión es ganar la guerra por el clic.

MENTALIDAD DEL DISEÑADOR SENIOR:
- Antes de describir cualquier elemento, piensa: ¿qué están haciendo los competidores en este tema? Tu imagen debe ROMPER el patrón visual, no sumarse a él.
- Aplica psicología del color según función: Rojo/Amarillo = urgencia/peligro. Verde/Azul = tecnología/confianza. Cian/Magenta neón = tech en dark mode (máximo contraste).
- Branding del tema vs. branding del creador: si el tema tiene logos o marcas reconocibles (OpenAI, Claude, etc.), prioriza esos elementos visuales porque el cerebro del espectador los detecta en 0.3 segundos.
- La composición debe comunicar todo en 0.3 segundos. Si alguien tiene que "leer" la imagen, fallaste.

NORMAS TÉCNICAS:
1. FIDELIDAD FACIAL: Si el brief incluye rasgos faciales, descríbelos con precisión técnica extrema (forma de ojos, marcas, vello facial) para que la IA los replique exactamente.
2. EXPRESIONES: Las emociones deben ser "over-the-top" (exageradas): ojos muy abiertos, venas marcadas, expresiones cinemáticas de shock, alegría o rabia extrema.
3. ILUMINACIÓN: Usa "volumetric studio lighting", "three-point lighting", "vibrant rim lights".
4. TEXTURAS: Forza "8K UHD", "photorealistic", "raw photography style", "hyper-detailed skin textures", "sharp focus".
5. COLORES: Describe colores "punchy" y saturados, contrastes profundos entre el sujeto y el fondo.
6. CERO TEXTO EN LA IMAGEN: No incluyas instrucciones de texto, letras, palabras ni tipografía en el prompt visual. Todo texto va en post-producción.

El visual_prompt DEBE estar en INGLÉS.
Responde SIEMPRE con un objeto JSON:
{
  "variations": [
    {
      "overlay_text": "TEXTO SUGERIDO EN ESPAÑOL (1-3 palabras máx, o vacío si la imagen habla sola)",
      "visual_prompt": "Ultra-detailed photography prompt in English...",
      "style": "nombre del estilo"
    }
  ]
}`,

    FACE_ANALYSIS: `Eres un experto perfilador visual y analista de identidad facial para sistemas de generación de imágenes (Stable Diffusion/Imagen/Gemini).
Analiza las fotos del creador y genera dos outputs combinados en un solo JSON:

1. FACIAL_TRAITS: Una descripción técnica METICULOSA que sirva como "huella digital visual" para replicar el rostro con precisión:
   - Estructura ósea (pómulos, mandíbula, frente, forma del rostro).
   - Ojos (forma, color, párpados, distancia entre ojos, cejas: grosor y forma).
   - Nariz y boca (rasgos distintivos, labios, mentón).
   - Pelo y vello facial (textura, estilo, color, largo).
   - Marcas únicas (lunares, pecas, cicatrices, hoyuelos).
   - Tono de piel con referencia técnica (ej: "olive skin tone, warm undertones").

2. EXPRESSION_LABEL: Clasifica la expresión facial DOMINANTE en la foto con UNO de estos 4 valores exactos:
   - "SORPRESA": Ojos muy abiertos, cejas levantadas, boca entreabierta, asombro genuino.
   - "AUTORIDAD": Mirada directa a cámara, mandíbula firme, expresión segura y dominante.
   - "MIEDO": Cejas fruncidas hacia arriba, ojos tensos, boca ligeramente abierta, tensión facial visible.
   - "DUDA": Cejas asimétricas (una levantada), leve inclinación de cabeza, mirada lateral o escéptica.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura exacta:
{
  "facial_traits": "descripción técnica ultra-detallada del rostro en inglés para uso en prompts de imagen...",
  "expression_label": "SORPRESA|AUTORIDAD|MIEDO|DUDA",
  "expression_notes": "breve descripción de por qué se clasificó con ese label"
}`
};

const MODEL_MAPPING = {
    CHANNEL_ADN: 'gemini-3-flash-preview',
    ADN_INTERVIEW: 'gemini-3-flash-preview',
    ADN_SYNTHESIS: 'gemini-3-flash-preview',
    ANGLES_GENERATION: 'gemini-3-flash-preview',
    BRANDING_ANALYSIS: 'gemini-3-flash-preview',
    STYLE_ANALYSIS: 'gemini-3-flash-preview',
    SCRIPT_ANALYSIS: 'gemini-3-flash-preview',
    CONTEXT_ANALYSIS: 'gemini-3-flash-preview',
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

        // Truncate very long scripts to avoid token limits and timeouts.
        // ~20k chars ≈ 5k tokens — enough for the full narrative DNA extraction.
        const MAX_CONTENT_CHARS = 20000;
        const safeContent = userContent.length > MAX_CONTENT_CHARS
            ? userContent.slice(0, MAX_CONTENT_CHARS) + '\n\n[--- GUIÓN TRUNCADO: muy extenso, se analizaron los primeros 20,000 caracteres ---]'
            : userContent;

        const fullPrompt = `${systemPrompt}\n\nCONTEXTO: ${JSON.stringify(context)}\n\nCONTENIDO A ANALIZAR:\n${safeContent}`;

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

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyData.trim()}`;
        const fetchOpts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };

        let response;
        const maxRetries = 3;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s hard timeout

        try {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                response = await fetch(url, { ...fetchOpts, signal: controller.signal });
                if (response.status !== 503) break;
                if (attempt < maxRetries) {
                    const delay = (attempt + 1) * 8000; // 8s, 16s, 24s
                    await new Promise(res => setTimeout(res, delay));
                }
            }
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            if (fetchErr.name === 'AbortError') {
                throw new Error("El análisis tardó demasiado (>90s). El guión puede ser muy largo — intentá acortarlo o volvé a intentarlo.");
            }
            throw fetchErr;
        }
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (response.status === 401) {
                setState({ apiKeyStatus: 'disconnected' });
                throw new Error("API Key inválida.");
            }
            if (response.status === 429) {
                throw new Error("Límite de peticiones alcanzado. Esperá unos segundos y volvé a intentarlo.");
            }
            if (response.status === 503) {
                throw new Error("El modelo de IA está sobrecargado. Esperá unos segundos y volvé a intentarlo.");
            }
            throw new Error(errData.error?.message || `Error en la API de Google (${response.status})`);
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
 *
 * @param {string} prompt - The text prompt for image generation
 * @param {string|null} faceImageUrl - Optional public URL of the creator's face photo.
 *   When provided, the image is fetched and sent as inline data so the model uses
 *   the REAL face instead of generating a fictional one from a text description.
 */
export async function generateImage(prompt, faceImageUrl = null, safetyFallbackPrompt = null) {
    const { data: apiKeyData, error: keyError } = await supabase.rpc('get_decrypted_api_key', {
        key_name: 'google_ai_key'
    });
    if (keyError || !apiKeyData) throw new Error("API Key de Google no configurada. Verificá en Settings.");


    const imgUrl = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_GEN_MODEL}:generateContent?key=${apiKeyData.trim()}`;

    async function attemptGeneration(promptText, faceUrl) {
        const p = [];
        if (faceUrl) {
            try {
                const ir = await fetch(faceUrl);
                if (ir.ok) {
                    const bl = await ir.blob();
                    const ab = await bl.arrayBuffer();
                    const u8 = new Uint8Array(ab);
                    let bin = ''; for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
                    p.push({ inlineData: { mimeType: bl.type || 'image/jpeg', data: btoa(bin) } });
                }
            } catch (e) { console.warn('[Face] Could not load reference photo:', e.message); }
        }
        p.push({ text: promptText });

        const pl = {
            contents: [{ parts: p }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '16:9', imageSize: '2K' } },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            ]
        };
        const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pl) };
        let res;
        for (let i = 0; i <= 3; i++) {
            res = await fetch(imgUrl, opts);
            if (res.status !== 503) break;
            if (i < 3) await new Promise(r => setTimeout(r, (i + 1) * 8000));
        }
        return res;
    }

    let response = await attemptGeneration(prompt, faceImageUrl);

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 503) throw new Error("El modelo de imagen está sobrecargado. Esperá unos segundos y volvé a intentarlo.");
        throw new Error(errData.error?.message || `Image generation failed (${response.status})`);
    }

    let data = await response.json();
    let candidate = data.candidates?.[0];
    let imagePart = candidate?.content?.parts?.find(p => p.inlineData);

    // IMAGE_SAFETY retry: use the caller-supplied safety fallback (thematically relevant, no heavy language)
    // or fall back to slicing the first 1200 chars as emergency measure
    if (!imagePart && (candidate?.finishReason === 'IMAGE_SAFETY' || candidate?.finishReason === 'SAFETY')) {
        console.warn('[generateImage] IMAGE_SAFETY on first attempt — retrying with safety fallback prompt.');
        const fallbackPrompt = safetyFallbackPrompt || prompt.slice(0, 1200) + '\n\nGenerate a visually compelling YouTube thumbnail in 16:9 format. High-impact composition, professional lighting, vibrant colors. No text or letters in the image.';
        response = await attemptGeneration(fallbackPrompt, null); // no face on retry
        if (response.ok) {
            data = await response.json();
            candidate = data.candidates?.[0];
            imagePart = candidate?.content?.parts?.find(p => p.inlineData);
        }
    }

    if (!imagePart) {
        const finishReason = candidate?.finishReason || 'unknown';
        const textPart = candidate?.content?.parts?.find(p => p.text)?.text?.slice(0, 300) || '';
        const blockReason = data.promptFeedback?.blockReason || '';
        console.error('[generateImage] No image returned.', { finishReason, blockReason, textPart, candidateCount: data.candidates?.length });
        if (blockReason) throw new Error(`Imagen bloqueada por política de contenido: ${blockReason}`);
        if (finishReason === 'IMAGE_SAFETY' || finishReason === 'SAFETY') throw new Error(`Este ángulo contiene elementos visuales que el modelo de imagen no puede generar. Probá regenerar — cada intento usa una variación diferente.`);
        throw new Error(`El modelo no devolvió imagen (${finishReason}). ${textPart ? 'Modelo dice: ' + textPart : 'Intentá con un prompt diferente.'}`);
    }

    const { mimeType, data: b64 } = imagePart.inlineData;
    return `data:${mimeType};base64,${b64}`;
}

