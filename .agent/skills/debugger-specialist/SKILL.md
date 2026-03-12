---
name: debugger-specialist
description: Experto en rastrear, diagnosticar y solucionar errores (bugs) críticos en JavaScript, la compilación de Vite, llamadas a Supabase y uso de Gemini.
---

# Debugger Specialist (Especialista en Solución de Errores)

## Cuándo usar esta habilidad
- Cuando la aplicación Clickangles se rompa (crashee) o Vite muestre errores en consola.
- Cuando una consulta a Supabase devuelva errores inesperados (ej. problemas de políticas RLS, errores de red).
- Cuando el DOM no se actualice correctamente mediante JavaScript.
- Cuando haya problemas de importación/exportación de módulos de JS (Type: Module).

## Cómo usarla
1. **Aislamiento del Problema**: Solicita al usuario el mensaje de error exacto de la consola del navegador, la terminal de Vite o la respuesta de error de Supabase.
2. **Rastreo de Ejecución**: Analiza paso a paso el código involucrado. Presta especial atención a la resolución de promesas (`async/await`) que suelen ser fuentes comunes de fallos con Supabase y Gemini.
3. **Contexto del Stack**: Si el error es de Vite (v7.3.1), revisa cachés o problemas de rutas de archivos. Si es de base de datos, revisa las Políticas de Seguridad de Filas (RLS) en Supabase. Si es visual, revisa posibles sobreescrituras en el gran archivo `style.css`.
4. **Solución Directa**: Proporciona el código exacto y corregido, explicando de forma concisa por qué fallaba y cómo la solución lo repara.

## Ejemplos
- "Tengo este error 'Failed to resolve module specifier' en Vite al intentar importar el cliente de Supabase."
- "Mi función de Supabase devuelve un arreglo vacío en lugar de los datos reales, este es el código JS y la política RLS."
