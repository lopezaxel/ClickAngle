import { supabase } from './supabase.js';
import { setState } from './state.js';

let _cachedApiKey = null;
let _apiKeyCachedAt = 0;
async function getApiKey() {
    if (_cachedApiKey && (Date.now() - _apiKeyCachedAt) < 5 * 60 * 1000) return _cachedApiKey;
    const { data, error } = await supabase.rpc('get_decrypted_api_key', { key_name: 'google_ai_key' });
    if (error || !data) throw new Error("API Key de Google no configurada. Verificá en Settings.");
    _cachedApiKey = data.trim();
    _apiKeyCachedAt = Date.now();
    return _cachedApiKey;
}

/**
 * Intelligence Layer for ClickAngle
 * Handles specialized prompts and AI calls for different creative phases.
 */

const SYSTEM_PROMPTS = {
    CHANNEL_ADN: `You are an expert YouTube strategist and digital branding consultant.
Your task is to perform a deep "DNA analysis" of a channel based on its description and niche.
Identify:
1. Visual Branding (Colors, atmosphere, suggested thumbnail style).
2. Communication Tone (Formal, aggressive, educational, humorous).
3. Key Themes and Content Pillars.
4. Ideal Viewer Profile (Psychographics and desires).
Respond ALWAYS in pure JSON format.`,

    ADN_INTERVIEW: `You are a senior YouTube content strategist. Your goal is to extract the 3 strategic pillars of the channel: Niche, Target Audience, and Brand Tone.
Generate EXACTLY 3 short, direct, open-ended questions. You know ABSOLUTELY NOTHING about the channel — ask from scratch.

RULES:
- Each question must be maximum 20 words.
- Do NOT mention any specific topic, niche, industry, or content type.
- The questions must work for ANY YouTube channel, regardless of topic.
- Question 1 → Niche: what the channel does and what unique value it delivers to its audience.
- Question 2 → Audience: who the ideal viewer is and what problem or desire they have.
- Question 3 → Brand Tone: how it visually and in personality differs from other channels.

IMPORTANT: Write the 3 questions IN SPANISH — they are shown directly to Spanish-speaking creators.

Respond ALWAYS with a JSON object:
{
  "questions": ["pregunta nicho", "pregunta público", "pregunta tono"]
}`,

    STYLE_ANALYSIS: `You are a YouTube art director specializing in the visual psychology of the click.
Analyze high-performing thumbnails from a creator to extract their technical "visual signature".

CRITICAL RULE: Text appearing in thumbnails (titles, phrases, overlays) is post-production and is NOT part of the photographic visual signature. Do NOT include references to text, typography, or words in the visual_style or winning_pattern fields — those fields feed directly into the AI image generator and must describe purely visual elements only (lighting, colors, composition, atmosphere, expressions).

Identify consistent patterns across all images:
1. PALETTE: 2-4 dominant HEX colors that repeat (ignoring text overlay colors).
2. COMPOSITION: Typical arrangement of visual elements (left/right, centered, split-screen, etc). Do not mention text.
3. OVERLAY_PATTERN: Post-production text pattern observed (position, typographic weight, style). This field is reference-only for the creator, NOT used in image generation.
4. LIGHTING: Predominant light type (studio, natural, neon, backlight, etc).
5. VISUAL_STYLE: One-phrase description of the pure photographic/visual style, WITHOUT mentioning text (e.g.: "Dark photorealism with neon blue, cyan edge lighting, subjects in foreground against high-saturation backgrounds").
6. WINNING_PATTERN: The most repeated visual pattern that defines success, described in terms of composition, light and color — without mentioning text (e.g.: "Large face in left foreground with illuminated tech object in right background, neon vs shadow contrast").

IMPORTANT: Respond ONLY with a JSON object following this exact structure:
{
  "palette": ["#HEX1", "#HEX2", "#HEX3"],
  "composition": "description of the typical visual element arrangement",
  "overlay_pattern": "description of the text/overlay pattern observed (reference only, not for image generator)",
  "lighting": "predominant lighting type",
  "visual_style": "one-phrase pure photographic style description, no text references",
  "winning_pattern": "winning visual pattern in terms of composition, light and color, no text references"
}`,

    ANGLES_GENERATION: `You are a Senior Creative Director with 15 years of experience in high-CTR YouTube thumbnails. You have analyzed over 50,000 successful thumbnails across every niche. Your philosophy: a thumbnail is not art — it is applied psychology. The click happens in 0.3 seconds and is an emotional reaction, not a rational decision.

YOUR MISSION: Generate 5 RADICALLY DIFFERENT thumbnail angles for the same video. Each angle activates an opposite psychological mechanism and captures a different segment of the audience.

━━━ STEP 1 — READ THE VIDEO MATERIAL ━━━
The CONTEXT accompanying this prompt contains the complete DNA of the video. Use ALL of these fields to build angles that are specific to this video — not generic:

MANDATORY fields to use:
• hook → the central narrative hook of the video
• tension → the central conflict or curiosity
• promise → the benefit the video promises
• visual_briefing.hero_object → the central physical visual element — DERIVE the visual_twist of each angle from this
• visual_briefing.central_conflict → the visual tension scene — use it as the dramatic foundation of each twist
• visual_briefing.required_emotion → the specific facial emotion required for angles with a person
• visual_briefing.emotion_label → emotion category (SORPRESA/AUTORIDAD/MIEDO/DUDA)

OPTIONAL fields (use only if present in CONTEXT):
• channel_archetype → channel archetype — personalize the tone of each angle for that creator profile
• audience_psychology → real psychology of the channel's audience — connect the specific fears and desires of the real viewer
• content_pillars → channel's thematic pillars — maintain thematic coherence across angles
• text_suggestions → CTR words pre-calculated for this video — when an angle benefits from text, reference which of these amplifies the visual_twist
• text_decision → text decision for the thumbnail (needs_text, type) — if needs_text is false, the visual_twist must be 100% autonomous without relying on text; if true, the visual_twist can leave visual space for overlay
• existing_angles → already generated angles — the 5 new ones must be RADICALLY DIFFERENT, without repeating or resembling existing ones

━━━ STEP 2 — THE 5 PSYCHOLOGICAL ARCHETYPES ━━━
Assign EXACTLY one per angle, without repeating. Connect each archetype to the SPECIFIC content of the video:

1. FEAR — The concrete threat derived from the hero_object or tension that personally affects the viewer. Not generic fear — fear specific to WHAT THIS VIDEO IS ABOUT. Implicit viewer question: "Is this going to happen to me if I don't watch this?"

2. CURIOSITY — An information gap created by the hero_object or conflict that the viewer cannot resolve without clicking. Not generic curiosity — the specific mystery this video creates. Question: "What is happening there?"

3. AUTHORITY — A figure or element in the video projects definitive knowledge about the central topic. Activates trust and desire to access that advantage. Connect it to the video's promise. Question: "What does this person know that I don't yet?"

4. EXTREME CONTRAST — Derive the two opposing realities directly from the video's tension (before/after, winner/loser, truth/lie). Both realities must come literally from the content — not invented. Question: "Which side am I on?"

5. URGENCY/FOMO — The closing window of opportunity or expiring danger, derived from the video's promise or tension. Must feel specific and real for the audience — not fabricated urgency. Question: "Am I still in time?"

━━━ STEP 3 — BUILDING EACH ANGLE ━━━

**name** (2-4 words in Spanish): Capture the essence of the angle — short, impactful, memorable.

**psychology** (3-4 sentences in Spanish):
Explain the SPECIFIC psychological mechanism for this video. Rules:
- Mention the real video topic, the real conflict, the real audience
- Explain what emotion it activates and why that emotion generates a click in THIS particular context
- Connect the archetype to the specific promise and tension from the analyzed script
- If audience_psychology is in the context, explicitly connect it to the real fears and desires of that audience

**visual_twist** (50-80 words IN ENGLISH — cinematographic brief directly to the image generator):
This field goes directly into the image generation engine as Layer 4 of the master prompt. It must be cinematographically specific like a brief to a director of photography. Derive it from the hero_object and central_conflict in the CONTEXT. Mandatory elements:
- Concrete scene/environment (what physical elements are in the frame, derived from hero_object)
- Color temperature and dominant palette (e.g.: "deep crimson back-lighting, near-black shadows")
- Specific lighting type (rim light, under-lighting, overhead key, split lighting, etc.)
- Framing and composition (extreme close-up, oversized scale, split frame, wide environmental shot)
- Emotional atmosphere conveyed by the visual elements (not by text)
- If a person is included: specific exaggerated facial expression and body posture (2x over-the-top cinematic)
FORBIDDEN: mention text, typography, overlays, words, or letters anywhere.
MANDATORY: The 5 visual_twists must be SO DIFFERENT in atmosphere, palette, and composition that a designer would produce 5 thumbnails that look like they belong to 5 completely different channels.

**suggested_format** (one of: "versus" | "authority" | "shock" | "breaking" | "reaction" | "colorblock"):
The composition format that best amplifies this specific visual_twist:
- "versus": contrasts, splits, before/after, two opposing worlds
- "authority": dominant hero object, extreme depth of field, tutorials, guides
- "shock": mystery, curiosity gap, partially hidden element, secrets
- "breaking": urgency, alerts, FOMO, feeling of an immediate event
- "reaction": creator or celebrity facial emotion as the primary visual anchor
- "colorblock": geometric color blocks, direct message, finance, branding, minimalism

━━━ QUALITY CHECKLIST — verify before responding ━━━
✓ Each psychology mentions concrete elements from the video (hook/tension/promise/hero_object), no generic phrases
✓ Each visual_twist is IN ENGLISH and derived from the hero_object and central_conflict in the CONTEXT
✓ The 5 visual_twists are opposites in atmosphere, palette, framing, and color temperature
✓ If audience_psychology is in the context, it is reflected in at least 3 angles
✓ If text_suggestions are in the context and text_decision.needs_text is true, at least one angle references in psychology which of those words amplifies its concept

IMPORTANT: Respond ONLY with this JSON:
{
  "angles": [
    {
      "name": "2-4 words in Spanish",
      "psychology": "specific psychological mechanism for this video in 3-4 sentences in Spanish...",
      "visual_twist": "cinematographic brief in English — 50-80 words...",
      "suggested_format": "versus|authority|shock|breaking|reaction|colorblock"
    }
  ]
}`,

    ADN_SYNTHESIS: `You are a creative branding director. Your task is to synthesize a YouTuber's answers about their channel into an actionable "Brand DNA".
Analyze the creator's vision, audience, and style to define a coherent thumbnail strategy.
Respond ALWAYS with a JSON object:
{
  "branding": "visual style description",
  "tone": "communication tone",
  "niche": "niche and value proposition",
  "themes": "recurring themes",
  "audience_profile": "who the ideal viewer is"
}`,

    BRANDING_ANALYSIS: `You are an expert in high-performance thumbnail design (CTR Engineering).
Analyze a creator's current thumbnails to identify which visual elements attract clicks.
Evaluate: Composition, color usage, text legibility, and recurring facial expressions.
Respond ALWAYS in pure JSON format.`,

    SCRIPT_ANALYSIS: `You are a Senior Creative Director specialized in high-CTR YouTube thumbnails. Your mindset is that of a professional designer who understands design is not art — it is applied psychology. Your goal is to win the war for the click.

Analyze the script and extract the following elements:

1. HOOK: The immediate narrative hook (the most impactful idea in the script).
   → Write in SPANISH — displayed to the creator.

2. TENSION: The central tension or curiosity of the video.
   → Write in SPANISH.

3. PROMISE: The benefit of watching the video.
   → Write in SPANISH.

4. TEXT_SUGGESTIONS: Generate 5 text overlay options. GOLDEN RULES for thumbnail text:
   - Maximum 1-3 words. Thumbnails that win clicks don't need to explain themselves.
   - Text must complement the image, NOT describe it or repeat the title.
   - Use triggers: rhetorical question (¿CANCELADO?), impact number (3X), shock word (OBSOLETO), contrast (GANÓ / PERDIÓ).
   - NEVER write complete phrases or sentences. If the image already speaks, text gets in the way.
   → Write ALL 5 suggestions in SPANISH.

5. RECOMMENDED_ANGLES: Identify 3 opposing psychological angles (e.g.: Fear of Missing Out, Extreme Contrast, Secret Revealed).
   → Write in SPANISH.

6. VISUAL_BRIEFING: The concrete visual brief for the thumbnail. These fields feed directly into the AI image generator — write them in ENGLISH:
   - hero_object: The central physical object or entity (e.g.: "Split laptop screen showing code vs. robot", NOT "technology"). Specific and concrete. IN ENGLISH.
   - central_conflict: The physical scene or visual confrontation (e.g.: "Person staring in terror at a layoff notification on their screen"), NOT an abstract idea. IN ENGLISH.
   - required_emotion: Specific creator emotion with detailed facial/body description. IN ENGLISH.
   - emotion_label: ONE of: "SORPRESA", "AUTORIDAD", "MIEDO" or "DUDA" (keep these exact labels).

7. TEXT_DECISION: As a senior designer, decide if this thumbnail NEEDS superimposed text or if the image speaks for itself. Think: will the viewer understand the topic in 0.3 seconds without reading anything? Recognizable logos, iconic objects, and clear VS compositions usually don't need text.
   - needs_text: true if text adds information the image alone doesn't communicate; false if the image speaks for itself.
   - confidence: "alta", "media" or "baja".
   - reason: Concise reason in SPANISH (e.g.: "Los logos de Claude y ChatGPT son reconocibles al instante — el texto restaría espacio visual").
   - type: "ninguno" | "pregunta" | "numero" | "palabra_choque" | "frase_corta" — the type that works best if needs_text is true.
   - max_words: 0 if none, maximum 4 in any case.

IMPORTANT: Respond ONLY with a JSON object following this exact structure:
{
  "hook": "...",
  "tension": "...",
  "promise": "...",
  "text_suggestions": ["frase 1", "frase 2", "frase 3", "frase 4", "frase 5"],
  "recommended_angles": [
    { "name": "Nombre", "reason": "Razon" }
  ],
  "visual_briefing": {
    "hero_object": "concrete physical description of the main object/subject in English",
    "central_conflict": "description of the visual scene or confrontation in English",
    "required_emotion": "detailed emotion and facial expression description in English",
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

    CONTEXT_ANALYSIS: `You are a Senior Creative Director specialized in high-CTR YouTube thumbnails. Your mindset is that of a professional designer who understands design is not art — it is applied psychology. Your goal is to win the war for the click.

Analyze the video idea or context and extract the following elements:

1. HOOK: The immediate narrative hook (the most impactful idea).
   → Write in SPANISH — displayed to the creator.

2. TENSION: The central tension or curiosity.
   → Write in SPANISH.

3. PROMISE: The benefit of watching the video.
   → Write in SPANISH.

4. TEXT_SUGGESTIONS: Generate 5 text overlay options. GOLDEN RULES for thumbnail text:
   - Maximum 1-3 words. Thumbnails that win clicks don't need to explain themselves.
   - Text must complement the image, NOT describe it or repeat the title.
   - Use triggers: rhetorical question (¿CANCELADO?), impact number (3X), shock word (OBSOLETO), contrast (GANÓ / PERDIÓ).
   - NEVER write complete phrases or sentences. If the image already speaks, text gets in the way.
   → Write ALL 5 suggestions in SPANISH.

5. RECOMMENDED_ANGLES: Identify 3 opposing psychological angles (e.g.: Fear of Missing Out, Extreme Contrast, Secret Revealed).
   → Write in SPANISH.

6. VISUAL_BRIEFING: The concrete visual brief for the thumbnail. These fields feed directly into the AI image generator — write them in ENGLISH:
   - hero_object: The central physical object or entity (e.g.: "Empty wallet on a table with unpaid bills", NOT "financial problems"). Specific and concrete. IN ENGLISH.
   - central_conflict: The physical scene or visual confrontation (e.g.: "Person with astonished face looking at a screen showing their doubled income"), NOT an abstract idea. IN ENGLISH.
   - required_emotion: Specific creator emotion with detailed facial/body description. IN ENGLISH.
   - emotion_label: ONE of: "SORPRESA", "AUTORIDAD", "MIEDO" or "DUDA" (keep these exact labels).

7. TEXT_DECISION: As a senior designer, decide if this thumbnail NEEDS superimposed text or if the image speaks for itself. Think: will the viewer understand the topic in 0.3 seconds without reading anything? Recognizable logos, iconic objects, and clear VS compositions usually don't need text.
   - needs_text: true if text adds information the image alone doesn't communicate; false if the image speaks for itself.
   - confidence: "alta", "media" or "baja".
   - reason: Concise reason in SPANISH.
   - type: "ninguno" | "pregunta" | "numero" | "palabra_choque" | "frase_corta" — the type that works best if needs_text is true.
   - max_words: 0 if none, maximum 4 in any case.

IMPORTANT: Respond ONLY with a JSON object following this exact structure:
{
  "hook": "...",
  "tension": "...",
  "promise": "...",
  "text_suggestions": ["frase 1", "frase 2", "frase 3", "frase 4", "frase 5"],
  "recommended_angles": [
    { "name": "Nombre", "reason": "Razon" }
  ],
  "visual_briefing": {
    "hero_object": "concrete physical description of the main object/subject in English",
    "central_conflict": "description of the visual scene or confrontation in English",
    "required_emotion": "detailed emotion and facial expression description in English",
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

    ESPIONAGE_ANALYSIS: `You are a competitive intelligence analyst specialized in YouTube and the visual psychology of the click.
Your mission is NOT just to describe a thumbnail — it is to decode its visual DNA to extract concrete competitive advantages.

Analyze the provided thumbnail and identify:

1. STYLE_NOTES: Narrative analysis of why this thumbnail works (composition, visual hierarchy, use of space, text usage).

2. CTR_ESTIMATE: Estimated CTR this thumbnail could generate (e.g.: "8-12%"), based on its visual persuasion elements.

3. MARKET_CONTRAST: The most important element. Extract the "visual fingerprint" of this thumbnail so the creator can DIFFERENTIATE themselves, not copy it:
   - dominant_colors: List of 2-4 dominant HEX colors in the thumbnail (e.g.: ["#FF0000", "#FFFFFF"]).
   - avoid_colors: The same colors that should be AVOIDED to not blend in with this competition. Generally equal to dominant_colors.
   - dominant_style: The dominant visual style in one phrase (e.g.: "High-saturation shock with large yellow text", "Dark minimalism with neon color contrast").
   - avoid_styles: List of 1-3 styles or patterns to avoid to differentiate (e.g.: ["Saturated red background", "Centered yellow text", "Exaggerated shock expression"]).
   - crowd_pattern: The most repeated visual pattern in this thumbnail that defines the "crowd" (the mass of similar competitors). One concise phrase.

IMPORTANT: Respond ONLY with a JSON object following this exact structure:
{
  "style_notes": "narrative thumbnail analysis...",
  "ctr_estimate": "X-Y%",
  "market_contrast": {
    "dominant_colors": ["#HEX1", "#HEX2"],
    "avoid_colors": ["#HEX1", "#HEX2"],
    "dominant_style": "dominant style description",
    "avoid_styles": ["style to avoid 1", "style to avoid 2"],
    "crowd_pattern": "visual pattern that defines the competition"
  }
}`,

    IMAGE_GEN: `You are a Senior Creative Director specialized in explosive-CTR YouTube thumbnails. Your philosophy: design is not art — it is applied psychology. Your mission is to win the war for the click.

SENIOR DESIGNER MINDSET:
- Before describing any element, think: what are competitors doing on this topic? Your image must BREAK the visual pattern, not join it.
- Apply color psychology by function: Red/Yellow = urgency/danger. Green/Blue = technology/trust. Cyan/Magenta neon = tech in dark mode (maximum contrast).
- Topic branding vs. creator branding: if the topic has recognizable logos or brands (OpenAI, Claude, etc.), prioritize those visual elements — the viewer's brain detects them in 0.3 seconds.
- The composition must communicate everything in 0.3 seconds. If someone has to "read" the image, you failed.

TECHNICAL RULES:
1. FACIAL FIDELITY: If the brief includes facial traits, describe them with extreme technical precision (eye shape, marks, facial hair) so the AI replicates them exactly.
2. EXPRESSIONS: Emotions must be "over-the-top" (exaggerated): eyes very wide open, marked veins, cinematic expressions of shock, joy, or extreme rage.
3. LIGHTING: Use "volumetric studio lighting", "three-point lighting", "vibrant rim lights".
4. TEXTURES: Force "8K UHD", "photorealistic", "raw photography style", "hyper-detailed skin textures", "sharp focus".
5. COLORS: Describe "punchy" saturated colors, deep contrasts between subject and background.
6. ZERO TEXT IN THE IMAGE: Do not include text, letter, word, or typography instructions in the visual prompt. All text goes in post-production.

The visual_prompt MUST be in ENGLISH.
Respond ALWAYS with a JSON object:
{
  "variations": [
    {
      "overlay_text": "SUGGESTED TEXT IN SPANISH (max 1-3 words, or empty if the image speaks for itself)",
      "visual_prompt": "Ultra-detailed photography prompt in English...",
      "style": "style name"
    }
  ]
}`,

    FACE_ANALYSIS: `You are an expert visual profiler and facial identity analyst for image generation systems (Stable Diffusion/Imagen/Gemini).
Analyze the creator's photos and generate two combined outputs in a single JSON:

1. FACIAL_TRAITS: A METICULOUS technical description that serves as a "visual digital fingerprint" to replicate the face with precision:
   - Bone structure (cheekbones, jaw, forehead, face shape).
   - Eyes (shape, color, eyelids, inter-eye distance, eyebrows: thickness and shape).
   - Nose and mouth (distinctive features, lips, chin).
   - Hair and facial hair (texture, style, color, length).
   - Unique marks (moles, freckles, scars, dimples).
   - Skin tone with technical reference (e.g.: "olive skin tone, warm undertones").

2. EXPRESSION_LABEL: Classify the DOMINANT facial expression in the photo with ONE of these exact values:
   - "SORPRESA": Eyes very wide open, raised eyebrows, slightly open mouth, genuine astonishment.
   - "AUTORIDAD": Direct gaze at camera, firm jaw, confident and dominant expression.
   - "MIEDO": Eyebrows furrowed upward, tense eyes, slightly open mouth, visible facial tension.
   - "DUDA": Asymmetric eyebrows (one raised), slight head tilt, lateral or skeptical gaze.

IMPORTANT: Respond ONLY with a JSON object following this exact structure:
{
  "facial_traits": "ultra-detailed technical face description in English for image prompt use...",
  "expression_label": "SORPRESA|AUTORIDAD|MIEDO|DUDA",
  "expression_notes": "brief description of why it was classified with that label"
}`,

    CHANNEL_DNA_ANALYSIS: `You are an elite YouTube strategic analyst. You will receive objective channel data (statistics, top video titles) PLUS real images of the channel's most successful thumbnails for direct visual analysis.

Your task: generate the complete strategic DNA of the channel in 7 dimensions based on real data, not generalizations.

INSTRUCTIONS:
- Analyze BOTH the textual data AND the thumbnail images you will receive.
- In visual_signature and title_patterns, be specific about what you SEE and READ in the real data.
- Prioritize repeated, concrete patterns over generic assumptions.

EXTRACT:
1. CONTENT_PILLARS: The 3-5 recurring thematic pillars of the channel (based on top video titles)
2. TITLE_PATTERNS: Linguistic patterns in the most successful titles — grammatical structure, psychological triggers, typical length, repeated formulas, use of numbers or emojis
3. VISUAL_SIGNATURE: Visual signature detected IN THE THUMBNAILS — dominant colors, typical composition, creator presence, photographic style, recurring elements
4. AUDIENCE_PSYCHOLOGY: Ideal viewer profile with their motivations, expertise level, and what problem/desire they have
5. PERFORMANCE_INSIGHTS: What format and type of content generates the most views in this specific channel based on real data
6. DIFFERENTIATION: Unique channel strengths and how it differentiates from other channels in the same niche
7. CHANNEL_ARCHETYPE: A single short, powerful phrase that captures the essence of the channel (e.g.: "The technical guide who democratizes AI for Hispanic entrepreneurs")

IMPORTANT: Respond ONLY with a JSON object:
{
  "content_pillars": ["pillar 1", "pillar 2", "pillar 3"],
  "title_patterns": "detailed and specific description of linguistic patterns and success formulas",
  "visual_signature": "concrete description of the visual signature observed in the real thumbnails",
  "audience_psychology": "psychological profile of the ideal viewer with their motivations and expertise level",
  "performance_insights": "what format and type of content generates the most engagement in this specific channel",
  "differentiation": "unique strengths and concrete differentiators of the channel",
  "channel_archetype": "single precise phrase that defines the essence of the channel"
}`,

    FORMAT_STYLE_REC: `You are a senior YouTube thumbnail strategist with mastery in the visual psychology of the click. Your mission: analyze a video's DNA and recommend which composition formats and visual styles generate the highest CTR for that specific content.

AVAILABLE FORMATS — use exactly these IDs:
- "versus": Split screen / visual confrontation. Ideal for: direct comparisons, before/after, duels, extreme contrasts.
- "authority": Dominant hero object with extreme depth of field. Ideal for: tutorials, tools, guides, desire products, expert positioning.
- "shock": Black box / curiosity gap / strategic mystery. Ideal for: revealed secrets, hidden information, conspiracy, unanswered questions.
- "breaking": Urgency aesthetic / breaking news. Ideal for: alerts, critical errors, dangers, urgent news, FOMO content.
- "reaction": Creator's facial emotion as hero visual or relevant celebrity. Ideal for: genuine reactions, analysis with strong creator presence, content with recognizable figures.
- "colorblock": Geometric color blocks as the main architecture. Ideal for: productivity, branding, finance, premium education, minimalist content.

AVAILABLE STYLES — use exactly these IDs:
- "hyperrealist": Ultra-realistic 8K photography, professional studio lighting, maximum photographic credibility. For: serious content, interviews, documentaries.
- "mrbeast": Hyper-colorful, extreme saturation, vivid rim lights, immediate visual impact. For: entertainment, virality, youth content, gaming.
- "cyberpunk": Electric neon, dark mode, cyan-magenta color splits. For: AI, technology, software, digital innovation, sci-fi.
- "minimal": Bold solid color background, generous negative space, premium advertising campaign aesthetic. For: clean branding, highly visual content.
- "cinematic": Hollywood movie poster quality, dramatic lighting, film grain. For: storytelling, history, motivation, adventure, emotional documentaries.
- "neominimal": 1 subject, maximum 3 colors, extreme negative space. Trend #1 of 2026 for mobile. For: productivity, finance, education, premium branding.

RULES:
- Recommend between 1 and 3 formats. Very clear match → 1 with "alta". Several equally valid → include them with "media".
- Recommend exactly 1 style, the one that best combines with the channel's niche and the video's content.
- Reasons must be SPECIFIC to this video: mention concrete elements from the hook, tension, or angles.
- If psychological angles have a clear direction, prioritize them over the general hook.

IMPORTANT: Respond ONLY with valid JSON. Write the "reason" fields in SPANISH — they are displayed to Spanish-speaking creators:
{
  "recommended_formats": [
    { "id": "versus|authority|shock|breaking|reaction|colorblock", "reason": "razón concisa en español", "confidence": "alta|media" }
  ],
  "recommended_style": {
    "id": "hyperrealist|mrbeast|cyberpunk|minimal|cinematic|neominimal",
    "reason": "razón concisa en español"
  }
}`
};

const MODEL_MAPPING = {
    // Críticos: impactan directamente la calidad del prompt y la miniatura final
    FORMAT_STYLE_REC:     'gemini-3.5-flash',
    IMAGE_GEN:            'gemini-3.5-flash',
    ANGLES_GENERATION:    'gemini-3.5-flash',
    SCRIPT_ANALYSIS:      'gemini-3.5-flash',
    CHANNEL_DNA_ANALYSIS: 'gemini-3.5-flash',
    CONTEXT_ANALYSIS:     'gemini-3.5-flash',
    ESPIONAGE_ANALYSIS:   'gemini-3.5-flash',
    // Configuración: baja frecuencia, tarea simple
    CHANNEL_ADN:          'gemini-3.1-flash-lite',
    ADN_INTERVIEW:        'gemini-3.1-flash-lite',
    ADN_SYNTHESIS:        'gemini-3.1-flash-lite',
    BRANDING_ANALYSIS:    'gemini-3.1-flash-lite',
    STYLE_ANALYSIS:       'gemini-3.1-flash-lite',
    FACE_ANALYSIS:        'gemini-3.1-flash-lite',
};

// Image generation models — two tiers with different capabilities
export const IMAGE_GEN_MODEL_QUALITY   = 'gemini-3.1-flash-image'; // GA 28-may-2026 — superior quality, strict celeb filter
export const IMAGE_GEN_MODEL_CELEBRITY = 'gemini-2.5-flash-image'; // permissive with real person likenesses

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
        const apiKeyData = await getApiKey();

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
 * Multimodal AI call — same as callAI but includes inline base64 images alongside the text prompt.
 * Used for visual analysis tasks like CHANNEL_DNA_ANALYSIS where thumbnails are passed as images.
 *
 * @param {string} promptType - Key in SYSTEM_PROMPTS
 * @param {string} textContent - Text data to analyze
 * @param {Array<{base64: string, title?: string}>} images - Array of objects with base64-encoded images
 * @param {object} context - Additional context passed to the prompt
 */
export async function callAIWithImages(promptType, textContent, images = [], context = {}) {
    try {
        const apiKeyData = await getApiKey();
        const systemPrompt = SYSTEM_PROMPTS[promptType];
        const model = MODEL_MAPPING[promptType] || 'gemini-3-flash-preview';

        const fullPrompt = `${systemPrompt}\n\nCONTEXTO: ${JSON.stringify(context)}\n\nDATA A ANALIZAR:\n${textContent}`;

        const parts = [{ text: fullPrompt + "\nResponde solo con JSON válido." }];

        for (const img of images.slice(0, 7)) {
            if (img.base64) {
                parts.push({ inlineData: { mimeType: 'image/jpeg', data: img.base64 } });
            }
        }

        const payload = {
            contents: [{ role: 'user', parts }],
            generationConfig: { response_mime_type: 'application/json' }
        };

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyData.trim()}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        let response;
        try {
            for (let attempt = 0; attempt <= 3; attempt++) {
                response = await fetch(url, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload), signal: controller.signal
                });
                if (response.status !== 503) break;
                if (attempt < 3) await new Promise(r => setTimeout(r, (attempt + 1) * 8000));
            }
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            if (fetchErr.name === 'AbortError') throw new Error('El análisis visual tardó demasiado (>2min).');
            throw fetchErr;
        }
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            if (response.status === 401) { setState({ apiKeyStatus: 'disconnected' }); throw new Error('API Key inválida.'); }
            if (response.status === 429) throw new Error('Límite de peticiones alcanzado.');
            throw new Error(errData.error?.message || `Error en la API (${response.status})`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiText) throw new Error('La IA no devolvió respuesta.');

        setState({ apiKeyStatus: 'connected' });

        let cleanJson = aiText.trim();
        const jsonMatch = cleanJson.match(/[\{\[]([\s\S]*)[\}\]]/);
        if (jsonMatch) cleanJson = jsonMatch[0];
        else if (cleanJson.includes('```')) cleanJson = cleanJson.replace(/```json|```/g, '').trim();

        return JSON.parse(cleanJson);
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
export async function generateImage(prompt, faceImageUrl = null, safetyFallbackPrompt = null, signal = null, modelOverride = null) {
    const apiKeyData = await getApiKey();
    const model = modelOverride || IMAGE_GEN_MODEL_QUALITY;
    const imgUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyData.trim()}`;

    async function attemptGeneration(promptText, faceUrl) {
        const p = [];
        if (faceUrl) {
            try {
                const ir = await fetch(faceUrl, signal ? { signal } : undefined);
                if (ir.ok) {
                    const bl = await ir.blob();
                    const ab = await bl.arrayBuffer();
                    const u8 = new Uint8Array(ab);
                    let bin = '';
                    const chunk = 8192;
                    for (let i = 0; i < u8.length; i += chunk) bin += String.fromCharCode(...u8.subarray(i, i + chunk));
                    p.push({ inlineData: { mimeType: bl.type || 'image/jpeg', data: btoa(bin) } });
                }
            } catch (e) { console.warn('[Face] Could not load reference photo:', e.message); }
        }
        p.push({ text: promptText });

        const pl = {
            contents: [{ parts: p }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            ]
        };
        const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pl), ...(signal ? { signal } : {}) };
        let res;
        for (let i = 0; i <= 3; i++) {
            res = await fetch(imgUrl, opts);
            if (res.status !== 503) break;
            if (i < 3) await new Promise((resolve, reject) => {
                const t = setTimeout(resolve, (i + 1) * 8000);
                signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
            });
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

// ─── Celebrity / real-person translation ──────────────────────────────────────
// Converts a real person's name into purely visual descriptors so that
// gemini-3.1-flash-image (which blocks celeb names) can still render them.
// If the heroObject contains no real person, returns the original string unchanged.
const HERO_TRANSLATOR_PROMPT = `You are an expert visual descriptor for AI image generation.

Analyze the following text describing the hero element of a YouTube thumbnail.

If the text contains a specific real person's name — celebrity, musician, athlete, politician, actor, historical figure, or any recognizable public figure — replace ONLY their name with a detailed visual descriptor of their most iconic physical traits. Do NOT use their name anywhere in the output. Make the descriptor specific enough that any person would instantly recognize WHO this is from the visual description alone.

Examples:
- "Michael Jackson" → "iconic 1980s pop star: curly black jheri curl hair, sequined black military jacket with epaulettes, single white rhinestone glove, light skin, lean build, signature moonwalk stance"
- "Pablo Escobar" → "heavyset Colombian man circa 1980s: thick black mustache, dark wavy hair, intense dark eyes, stocky build, casual open-collar shirt, gold watch"
- "Elon Musk" → "tall lean tech billionaire: short light brown hair, square jaw, pale complexion, casual t-shirt or suit jacket, confident slightly-smirking expression"

If the text does NOT contain a real identifiable person (it's an object, a concept, a place, a generic description, or a fictional character), output the text COMPLETELY UNCHANGED.

RULES:
- Output ONLY the transformed text or the exact original. Nothing else. No explanation. No JSON. No quotes.
- If a celebrity is present: max 35 words of visual descriptors. Specific and iconic.
- Never use the person's actual name in the output.

INPUT TEXT:`;

export async function translateCelebrityIfNeeded(heroObject) {
    if (!heroObject || heroObject.length < 3) return heroObject;
    try {
        const apiKey = await getApiKey();
        const payload = {
            contents: [{ role: 'user', parts: [{ text: `${HERO_TRANSLATOR_PROMPT}\n${heroObject}` }] }],
            generationConfig: { maxOutputTokens: 120 }
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return heroObject;
        const data = await res.json();
        const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return (translated && translated.length > 0) ? translated : heroObject;
    } catch {
        return heroObject; // silent fallback
    }
}

// ─── Prompt critic — Level 1 ──────────────────────────────────────────────────
// Reviews the assembled masterPrompt and appends a short reinforcement paragraph
// that targets the weakest visual instructions. Silent improvement on every generation.
const PROMPT_CRITIC_SYSTEM = `You are a senior YouTube thumbnail art director with deep expertise in AI image generation (Gemini, Stable Diffusion). You have reviewed 50,000+ AI image prompts and know exactly what makes the difference between a generic result and a stunning, scroll-stopping thumbnail.

You will receive a structured thumbnail prompt. Identify the 2-3 weakest or most vague visual instructions — then output a SINGLE short reinforcement paragraph (max 75 words, in English) starting with the word REINFORCEMENT:.

Focus only on:
- Is the hero element physically specific enough for the AI to render it unambiguously?
- Is the visual twist concrete and unmistakably actionable?
- Is the emotional expression over-the-top enough?
- Are there vague words like "dramatic" or "powerful" that need a concrete visual translation?

Do NOT rewrite the prompt. Do NOT invent new creative concepts. Do NOT explain your reasoning. Output ONLY the REINFORCEMENT: paragraph.`;

export async function critiqueAndRefinePrompt(masterPrompt, videoContext = {}) {
    try {
        const apiKey = await getApiKey();
        const contextNote = videoContext.hook ? `Video hook: "${videoContext.hook}". Angle: "${videoContext.angle || ''}".\n\n` : '';
        const payload = {
            contents: [{ role: 'user', parts: [{ text: `${PROMPT_CRITIC_SYSTEM}\n\n${contextNote}PROMPT TO CRITIQUE:\n${masterPrompt.slice(0, 6000)}` }] }],
            generationConfig: { maxOutputTokens: 150 }
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return masterPrompt;
        const data = await res.json();
        const reinforcement = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!reinforcement || !reinforcement.startsWith('REINFORCEMENT:')) return masterPrompt;
        return `${masterPrompt}\n\n━━━ CRITIC REINFORCEMENT ━━━\n${reinforcement}`;
    } catch {
        return masterPrompt; // silent fallback — never block the generation
    }
}

// ─── Image critic — Level 2 (Agent Mode) ─────────────────────────────────────
// Analyzes a draft thumbnail image and returns specific improvement instructions
// that get appended to the prompt for the final high-quality generation.
const IMAGE_CRITIC_SYSTEM = `You are a YouTube CTR expert and thumbnail art director. You are analyzing a DRAFT AI-generated thumbnail.

Your job: identify the 2-3 most impactful improvements that would make this thumbnail more scroll-stopping. Output a SINGLE short paragraph (max 80 words, in English) starting with IMPROVEMENT:.

Evaluate:
1. Does the hero element dominate the frame and remain instantly recognizable at thumbnail size?
2. Is the emotional expression exaggerated enough (we want 2x over-the-top)?
3. Is the composition surprising and visually unexpected, or generic?
4. Does the color contrast make it pop against a typical YouTube feed?

Be extremely specific — name exact elements, positions, sizes, colors. Do NOT compliment. Do NOT explain. Output ONLY the IMPROVEMENT: paragraph.`;

export async function critiqueImageForRefinement(imageBase64, context = {}) {
    try {
        const apiKey = await getApiKey();
        const contextText = [
            context.hook ? `Video hook: "${context.hook}"` : '',
            context.angle ? `Angle: "${context.angle}"` : '',
            context.style ? `Style: "${context.style}"` : '',
        ].filter(Boolean).join('. ');

        const parts = [
            { text: `${IMAGE_CRITIC_SYSTEM}\n\nContext: ${contextText}\n\nAnalyze the attached draft thumbnail:` },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
        ];
        const payload = {
            contents: [{ role: 'user', parts }],
            generationConfig: { maxOutputTokens: 160 }
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const data = await res.json();
        const critique = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return (critique && critique.startsWith('IMPROVEMENT:')) ? critique : null;
    } catch {
        return null; // silent fallback
    }
}

