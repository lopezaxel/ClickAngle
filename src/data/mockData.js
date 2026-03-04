// Mock data for ClickAngles demo

export const CREATIVE_DATA = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
        { label: 'Proyectos', data: [3, 5, 4, 6, 8, 7, 9, 11, 10, 13, 15, 18], color: '#DC2626' },
        { label: 'Miniaturas', data: [8, 12, 10, 15, 20, 18, 22, 28, 25, 32, 38, 42], color: '#10B981' },
    ]
};

export const METRICS = {
    activeProjects: { value: '12', change: '+3', direction: 'up', label: 'Proyectos Activos' },
    thumbnails: { value: '42', change: '+8', direction: 'up', label: 'Miniaturas Generadas' },
    anglesUsed: { value: '18', change: '+5', direction: 'up', label: 'Ángulos Usados' },
    avgScore: { value: '89', change: '+4', direction: 'up', label: 'Score Promedio' },
};

export const ALERTS = [
    {
        id: 1,
        type: 'success',
        title: 'Nuevo Record de Productividad',
        message: 'Has generado 42 miniaturas este mes, superando tu récord anterior de 38. ¡Excelente ritmo creativo!',
        time: 'Hace 2 horas',
    },
    {
        id: 2,
        type: 'info',
        title: 'Tendencia de Ángulo',
        message: 'Los ángulos de tipo "Controversia" están generando scores 35% más altos en el nicho Tech esta semana.',
        time: 'Hace 5 horas',
    },
    {
        id: 3,
        type: 'warning',
        title: 'Proyecto Sin Finalizar',
        message: 'El proyecto "Cursor vs VSCode" lleva 5 días en borrador. ¿Querés completarlo o archivarlo?',
        time: 'Hace 1 día',
    }
];

export const RECENT_PROJECTS = [
    {
        id: 1,
        title: 'GPT-5 vs Gemini Ultra',
        angle: 'El Versus',
        score: 94,
        status: 'published',
        date: '2026-02-27'
    },
    {
        id: 2,
        title: 'Este Prompt Secreto Cambia Todo',
        angle: 'Atajo Secreto',
        score: 91,
        status: 'published',
        date: '2026-02-25'
    },
    {
        id: 3,
        title: 'Lo Que OpenAI No Quiere Que Sepas',
        angle: 'Caja Negra',
        score: 88,
        status: 'draft',
        date: '2026-02-24'
    },
    {
        id: 4,
        title: 'Construí Una App en 10 Min',
        angle: 'Tutorial Imposible',
        score: 85,
        status: 'published',
        date: '2026-02-22'
    },
];

export const BRAND_KIT = {
    colors: ['#DC2626', '#10B981', '#F5F5F5', '#6B7280', '#3B82F6', '#F59E0B'],
    fonts: {
        primary: 'Inter',
        impact: 'Bangers',
    },
    faces: [
        { id: 1, label: 'Sorpresa' },
        { id: 2, label: 'Confianza' },
        { id: 3, label: 'Señalando' },
        { id: 4, label: 'Pensando' },
    ]
};

export const COMPETITOR_REFS = [
    { id: 1, channel: 'Fireship', style: 'Minimalista, fondo degradado, texto código', ctr: '~18%' },
    { id: 2, channel: 'Theo', style: 'Cara expresiva, fondo oscuro, texto grande', ctr: '~12%' },
    { id: 3, channel: 'The AI Grip', style: 'Split comparison, colores neón, badges', ctr: '~15%' },
];

export const ENGINE_VARIANTS = [
    { id: 1, angle: 'El Versus', text: 'GPT-5 vs GEMINI', style: 'split-dramatic', score: 94 },
    { id: 2, angle: 'Caja Negra', text: 'LO QUE GOOGLE OCULTA', style: 'mystery-dark', score: 88 },
    { id: 3, angle: 'El Reemplazo', text: 'CURSOR MATA A VSCODE', style: 'replace-strike', score: 91 },
    { id: 4, angle: 'Atajo Secreto', text: 'EL PROMPT PROHIBIDO', style: 'secret-glow', score: 85 },
    { id: 5, angle: 'La Revelación', text: 'LA VERDAD SOBRE DEEPSEEK', style: 'reveal-curtain', score: 82 },
    { id: 6, angle: 'Error Fatal', text: 'ESTE BUG DESTRUYE TODO', style: 'error-red', score: 79 },
];
