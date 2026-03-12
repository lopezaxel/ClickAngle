---
name: code-reviewer
description: Revisa, optimiza y refactoriza el código de Clickangles aplicando buenas prácticas de JavaScript Moderno (ES6+), Vanilla CSS y uso eficiente de Supabase.
---

# Code Reviewer (Revisor y Optimizador de Código)

## Cuándo usar esta habilidad
- Cuando el código funciona, pero está desordenado, repetitivo o es difícil de leer.
- Para optimizar consultas lentas o redundantes hacia Supabase.
- Para limpiar y modularizar el extenso archivo `style.css` (más de 40kb) o el `main.js`.
- Para refactorizar promesas anidadas (Callback Hell) hacia un estilo asíncrono moderno (`async/await`).

## Cómo usarla
1. **Auditoría de Buenas Prácticas**: Lee el código proporcionado y evalúa si cumple con los estándares modernos de ES6+ (destructuración, arrow functions, template literals).
2. **Principio DRY (Don't Repeat Yourself)**: Identifica lógicas repetidas en el JavaScript o clases CSS redundantes y sugiere funciones o estilos reutilizables.
3. **Optimización de Supabase**: Verifica que las consultas solo pidan los campos necesarios (ej. usar `select('id, nombre')` en lugar de `select('*')`) para ahorrar recursos.
4. **Transición a Futuro**: Como Vite (v7.3.1) facilita el uso de TypeScript, estructura el código de manera que tenga JSDoc o esté fuertemente tipado semánticamente para facilitar una futura migración si el usuario lo decide.
5. **Entrega del Refactor**: Muestra un bloque con "Código Anterior" y "Código Refactorizado", explicando los beneficios de la optimización (rendimiento, lectura, mantenibilidad).

## Ejemplos
- "Revisa este archivo main.js, funciona pero tiene 500 líneas y siento que está muy desordenado."
- "Tengo esta serie de consultas a Supabase en cadena. ¿Cómo puedo optimizarlas para que Clickangles cargue más rápido?"
