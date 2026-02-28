// Mock data for ClickAngles demo

export const CTR_DATA = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
        { label: 'Tu CTR', data: [4.2, 5.1, 6.3, 5.8, 7.2, 8.1, 7.6, 9.2, 10.1, 11.3, 12.5, 13.8], color: '#DC2626' },
        { label: 'Benchmark', data: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], color: '#333' },
        { label: 'Target 2026', data: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], color: '#10B981' },
    ]
};

export const METRICS = {
    avgCTR: { value: '13.8%', change: '+2.3%', direction: 'up', label: 'CTR Promedio' },
    impressions: { value: '245K', change: '+18%', direction: 'up', label: 'Impresiones' },
    totalClicks: { value: '33.8K', change: '+24%', direction: 'up', label: 'Clics Totales' },
    thumbScore: { value: '92', change: '+5', direction: 'up', label: 'Thumb Score' },
};

export const ALERTS = [
    {
        id: 1,
        type: 'warning',
        title: 'Penalización de Clickbait Detectada',
        message: 'Tu video "IA Destruye Todo" fue marcado por YouTube por discrepancia título-contenido. CTR cayó 40% en 48h.',
        time: 'Hace 2 horas',
        video: 'IA Destruye Todo'
    },
    {
        id: 2,
        type: 'success',
        title: 'Benchmark Superado',
        message: 'Tu CTR promedio de los últimos 7 días (13.8%) supera el benchmark 2026 de 10%. ¡Excelente rendimiento!',
        time: 'Hace 5 horas',
        video: null
    },
    {
        id: 3,
        type: 'info',
        title: 'Tendencia de Ángulo',
        message: 'Los ángulos de tipo "Controversia" están generando un CTR 35% mayor en el nicho Tech esta semana.',
        time: 'Hace 1 día',
        video: null
    }
];

export const RECENT_PROJECTS = [
    {
        id: 1,
        title: 'GPT-5 vs Gemini Ultra',
        angle: 'El Versus',
        ctr: '14.2%',
        status: 'published',
        date: '2026-02-27'
    },
    {
        id: 2,
        title: 'Este Prompt Secreto Cambia Todo',
        angle: 'Atajo Secreto',
        ctr: '16.1%',
        status: 'published',
        date: '2026-02-25'
    },
    {
        id: 3,
        title: 'Lo Que OpenAI No Quiere Que Sepas',
        angle: 'Caja Negra',
        ctr: '12.8%',
        status: 'draft',
        date: '2026-02-24'
    },
    {
        id: 4,
        title: 'Construí Una App en 10 Min',
        angle: 'Tutorial Imposible',
        ctr: '11.5%',
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

