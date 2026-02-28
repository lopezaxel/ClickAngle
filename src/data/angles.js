// Click Angles Database — 22 psychological angles for CTR engineering
export const ANGLE_CATEGORIES = {
  MIEDO: { label: 'Miedo', color: '#9CA3AF' },
  CURIOSIDAD: { label: 'Curiosidad', color: '#9CA3AF' },
  URGENCIA: { label: 'Urgencia', color: '#9CA3AF' },
  AUTORIDAD: { label: 'Autoridad', color: '#9CA3AF' },
  EXCLUSIVIDAD: { label: 'Exclusividad', color: '#9CA3AF' },
  CONTROVERSIA: { label: 'Controversia', color: '#9CA3AF' },
  LOGRO: { label: 'Logro', color: '#9CA3AF' },
  MISTERIO: { label: 'Misterio', color: '#9CA3AF' },
};

export const CLICK_ANGLES = [
  {
    id: 'reemplazo',
    name: 'El Reemplazo',
    category: 'MIEDO',
    title: 'X Va a Reemplazar a Y',
    description: 'Activa el miedo a la obsolescencia. El espectador siente que se está quedando atrás si no ve el video.',
    psychology: 'FOMO + Miedo a la obsolescencia profesional. El cerebro prioriza las amenazas a la supervivencia laboral.',
    example: '"Esta IA Reemplazará a los Programadores en 2026"',
    logicPrompt: 'Generate a thumbnail showing a dramatic comparison between old and new technology, with the old being visually "crossed out" or fading away.'
  },
  {
    id: 'caja-negra',
    name: 'Caja Negra',
    category: 'MISTERIO',
    title: 'Lo Que Nadie Te Muestra',
    description: 'Crea una brecha de curiosidad al implicar que hay información secreta detrás de una "capa" que solo tú levantarás.',
    psychology: 'Gap Theory de Loewenstein: la curiosidad surge cuando percibimos una brecha entre lo que sabemos y lo que queremos saber.',
    example: '"Lo Que Google NO Quiere Que Sepas de Gemini"',
    logicPrompt: 'Generate a mysterious thumbnail with a glowing box or hidden element partially revealed, dark atmosphere with a single bright accent.'
  },
  {
    id: 'atajo-secreto',
    name: 'Atajo Secreto',
    category: 'EXCLUSIVIDAD',
    title: 'El Truco Que Nadie Conoce',
    description: 'Promete una revelación que ahorrará tiempo/esfuerzo. El espectador siente que accederá a conocimiento privilegiado.',
    psychology: 'Principio de escasez cognitiva: la información "secreta" se percibe como más valiosa automáticamente.',
    example: '"El Prompt Secreto Que Hace a ChatGPT 10x Mejor"',
    logicPrompt: 'Generate a thumbnail with a "secret" or "shortcut" visual metaphor — a hidden path, a glowing key, or a locked door being opened.'
  },
  {
    id: 'countdown',
    name: 'El Countdown',
    category: 'URGENCIA',
    title: 'Solo Quedan X Días',
    description: 'Crea urgencia artificial con un límite de tiempo. El espectador siente que debe actuar ahora o perderá la oportunidad.',
    psychology: 'Sesgo de escasez temporal: la psicología muestra que los límites de tiempo aumentan el valor percibido hasta un 300%.',
    example: '"Solo Tienes 30 Días Para Aprender Esto"',
    logicPrompt: 'Generate a thumbnail with a timer, countdown clock, or urgent visual elements. Use red/orange tones for urgency.'
  },
  {
    id: 'revelacion',
    name: 'La Revelación',
    category: 'CURIOSIDAD',
    title: 'Por Fin Se Sabe La Verdad',
    description: 'Implica que una verdad oculta está a punto de ser expuesta. Genera un impulso irresistible de "necesito saber".',
    psychology: 'Efecto Zeigarnik: las tareas incompletas (como una revelación sin terminar) ocupan más espacio en la memoria de trabajo.',
    example: '"Descubrí Por Qué Apple Eliminó Esto"',
    logicPrompt: 'Generate a thumbnail with a "reveal" moment — pulling back a curtain, a dramatic light reveal, or an unveiled object.'
  },
  {
    id: 'antes-despues',
    name: 'Antes/Después',
    category: 'LOGRO',
    title: 'Transformación Visible',
    description: 'Muestra una transformación dramática. El cerebro humano está cableado para detectar cambios y contrastes.',
    psychology: 'Contraste visual: el cerebro procesa comparaciones 60,000x más rápido que texto. Un cambio visible = prueba social instantánea.',
    example: '"Mi Setup Antes y Después de Gastar $5000"',
    logicPrompt: 'Generate a split-screen thumbnail showing a dramatic before/after transformation, with clear visual contrast between both halves.'
  },
  {
    id: 'prohibido',
    name: 'El Prohibido',
    category: 'CONTROVERSIA',
    title: 'Lo Que NO Deberías Hacer',
    description: 'La prohibición crea atracción magnética. Cuando algo está "prohibido", el cerebro automáticamente quiere explorarlo.',
    psychology: 'Efecto Streisand: intentar ocultar información hace que sea exponencialmente más atractiva.',
    example: '"NO Uses Esta IA (Te Explico Por Qué)"',
    logicPrompt: 'Generate a thumbnail with prohibition symbols, red X marks, or "forbidden" visual elements. High contrast, dramatic lighting.'
  },
  {
    id: 'controversia',
    name: 'La Controversia',
    category: 'CONTROVERSIA',
    title: 'Contra La Corriente',
    description: 'Desafía una creencia popular del nicho. Genera polarización que impulsa engagement a través del debate.',
    psychology: 'Disonancia cognitiva: cuando una opinión contradice nuestras creencias, sentimos una necesidad urgente de resolverla.',
    example: '"Python Está Muerto (Y Nadie Te Lo Dice)"',
    logicPrompt: 'Generate a confrontational thumbnail with VS layout, opposing sides, or a bold statement being challenged.'
  },
  {
    id: 'desafio',
    name: 'El Desafío',
    category: 'LOGRO',
    title: 'Acepta El Reto',
    description: 'Plantea un desafío directo al espectador. Activa el instinto competitivo y la necesidad de probarse.',
    psychology: 'Motivación intrínseca: los desafíos activan el sistema de recompensa dopaminérgico antes incluso de completarlos.',
    example: '"¿Puedes Resolver Esto en 5 Minutos? (El 99% Falla)"',
    logicPrompt: 'Generate a thumbnail with a challenge/competition visual — a target, a puzzle, or a bold "challenge accepted" pose.'
  },
  {
    id: 'no-cuentan',
    name: 'Lo Que No Te Cuentan',
    category: 'EXCLUSIVIDAD',
    title: 'La Verdad Silenciada',
    description: 'Implica una conspiración de silencio en la industria. El espectador se siente "elegido" por descubrir esta información.',
    psychology: 'Sesgo de conspiración benigna: creer que existe información oculta nos hace sentir más inteligentes que la masa.',
    example: '"Lo Que Las Empresas de IA No Te Cuentan"',
    logicPrompt: 'Generate a thumbnail with a "shh" gesture, redacted text, or hidden/classified document aesthetic.'
  },
  {
    id: 'ranking',
    name: 'El Ranking',
    category: 'AUTORIDAD',
    title: 'Top X de [Categoría]',
    description: 'Los rankings crean orden en el caos. El espectador necesita validar si su favorito está en la lista.',
    psychology: 'Sesgo de anclaje: los números en rankings crean un marco de referencia que el cerebro no puede ignorar.',
    example: '"Top 5 Lenguajes de Programación para 2026"',
    logicPrompt: 'Generate a thumbnail with a numbered ranking layout, podium, or leaderboard visual. Clean, authoritative design.'
  },
  {
    id: 'hack',
    name: 'El Hack',
    category: 'EXCLUSIVIDAD',
    title: 'Hack de Productividad',
    description: 'Promete un atajo técnico que pocos conocen. Apela al deseo de eficiencia y superioridad técnica.',
    psychology: 'Principio de menor esfuerzo: el cerebro está cableado para preferir la ruta más fácil hacia un resultado.',
    example: '"Este Hack de VS Code Me Ahorra 2 Horas/Día"',
    logicPrompt: 'Generate a thumbnail showing a clever hack or workaround — a shortcut key, a hidden menu, or a "life hack" moment.'
  },
  {
    id: 'error-fatal',
    name: 'Error Fatal',
    category: 'MIEDO',
    title: 'El Error Que Arruina Todo',
    description: 'Alerta sobre un error que el espectador podría estar cometiendo sin saberlo. Activa la ansiedad preventiva.',
    psychology: 'Aversión a la pérdida: las personas reaccionan 2x más fuerte a pérdidas potenciales que a ganancias equivalentes.',
    example: '"El Error #1 Que Destruye Tu Código (Y No Lo Sabes)"',
    logicPrompt: 'Generate a thumbnail with error/danger visual — red screens, warning signs, broken code, or system crash aesthetic.'
  },
  {
    id: 'futuro',
    name: 'El Futuro',
    category: 'CURIOSIDAD',
    title: 'Lo Que Viene',
    description: 'Proyecta una visión del futuro cercano. El espectador necesita prepararse para lo que viene.',
    psychology: 'Sesgo de optimismo temporal: sobreestimamos cambios a corto plazo, lo que genera urgencia y curiosidad.',
    example: '"Así Será La Programación en 2027 (No Estás Listo)"',
    logicPrompt: 'Generate a futuristic thumbnail with sci-fi elements, holographic displays, or next-gen technology visuals.'
  },
  {
    id: 'dinero',
    name: 'La Máquina de Dinero',
    category: 'LOGRO',
    title: 'Monetización Directa',
    description: 'Conecta directamente con el deseo de éxito financiero. Los números específicos aumentan la credibilidad.',
    psychology: 'Prueba social financiera: los montos específicos activan el sistema de recompensa financiera del cerebro.',
    example: '"Cómo Gano $10K/Mes con IA (Sin Programar)"',
    logicPrompt: 'Generate a thumbnail with money/wealth visuals — dollar signs, growth charts, or a "money machine" metaphor.'
  },
  {
    id: 'expert',
    name: 'La Voz del Experto',
    category: 'AUTORIDAD',
    title: 'Según Los Expertos',
    description: 'Usa la autoridad de terceros para validar el contenido. El sesgo de autoridad hace que la gente confíe más.',
    psychology: 'Principio de autoridad de Cialdini: las personas siguen automáticamente las recomendaciones de figuras de autoridad.',
    example: '"Un Ingeniero de Google Revela Cómo Prepara Sus Entrevistas"',
    logicPrompt: 'Generate a thumbnail with an authority figure, expert badge, or institutional backdrop suggesting credibility.'
  },
  {
    id: 'vs',
    name: 'El Versus',
    category: 'CONTROVERSIA',
    title: 'X vs Y — El Duelo',
    description: 'Confrontación directa entre dos opciones. El espectador tiene una preferencia y necesita validarla.',
    psychology: 'Sesgo de confirmación: las personas buscan activamente contenido que valide sus opiniones existentes.',
    example: '"GPT-5 vs Gemini Ultra: ¿Cuál Es REALMENTE Mejor?"',
    logicPrompt: 'Generate a dramatic VS thumbnail with two competing elements facing each other, split screen with electric/spark effects.'
  },
  {
    id: 'tutorial-impossible',
    name: 'Tutorial Imposible',
    category: 'CURIOSIDAD',
    title: 'Hice Lo Imposible',
    description: 'Muestra un resultado que parece inalcanzable. El espectador necesita saber cómo fue logrado.',
    psychology: 'Efecto de incredulidad: cuando algo parece imposible, el cerebro necesita resolverlo para restaurar la coherencia.',
    example: '"Construí Una App con IA en 10 Minutos (En Vivo)"',
    logicPrompt: 'Generate a thumbnail showing an "impossible" achievement — a complex result with a surprisingly simple setup.'
  },
  {
    id: 'lista-negra',
    name: 'La Lista Negra',
    category: 'MIEDO',
    title: 'Evita Estos A Toda Costa',
    description: 'Una lista de cosas que NO hacer. El miedo a estar en la "lista" de errores motiva el clic.',
    psychology: 'Negativity bias: el cerebro procesa información negativa con más profundidad que la positiva.',
    example: '"5 Herramientas de IA Que NUNCA Deberías Usar"',
    logicPrompt: 'Generate a thumbnail with a blacklist/avoid aesthetic — crossed-out items, red flags, or danger list visuals.'
  },
  {
    id: 'exclusivo',
    name: 'Acceso Exclusivo',
    category: 'EXCLUSIVIDAD',
    title: 'Solo Para Pocos',
    description: 'Crea la percepción de exclusividad. El espectador siente que pertenece a un grupo selecto si ve el video.',
    psychology: 'Principio de escasez: los recursos limitados se perciben como más valiosos, impulsando la acción inmediata.',
    example: '"Acceso Anticipado: La IA Que Nadie Ha Probado Aún"',
    logicPrompt: 'Generate a thumbnail with exclusive/VIP aesthetic — locked content, early access badge, or premium gate visuals.'
  },
  {
    id: 'destructor',
    name: 'El Destructor',
    category: 'CONTROVERSIA',
    title: 'Esto Lo Cambia Todo',
    description: 'Posiciona un evento como un punto de inflexión irreversible. El espectador no puede ignorar algo "destructivo".',
    psychology: 'Sesgo de impacto: sobreestimamos la importancia de eventos que suenan dramáticos o irreversibles.',
    example: '"OpenAI Acaba de Destruir Toda Una Industria"',
    logicPrompt: 'Generate a thumbnail with destruction/disruption visuals — explosions, shattering glass, or world-changing impact.'
  },
  {
    id: 'guia-definitiva',
    name: 'Guía Definitiva',
    category: 'AUTORIDAD',
    title: 'Todo Lo Que Necesitas Saber',
    description: 'Promete ser el recurso final sobre un tema. Ahorra tiempo al espectador al concentrar todo en un video.',
    psychology: 'Principio de completitud: el cerebro prefiere información completa y organizada sobre fragmentos dispersos.',
    example: '"La Guía DEFINITIVA de Cursor AI (De 0 a Experto)"',
    logicPrompt: 'Generate a thumbnail with a comprehensive/definitive guide aesthetic — a complete roadmap, a book, or a masterclass badge.'
  },
];
