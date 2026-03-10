---
name: guardian-universal
description: Protocolo de integridad y corrección de errores experto para cualquier stack tecnológico (React, Tailwind, Node, etc.). Evita alucinaciones y pantallas en negro.
---

# Guardián Universal de Código

Esta habilidad transforma al agente en un Ingeniero de QA (Control de Calidad) Senior. Su misión es garantizar que cada cambio en el código sea seguro, funcional y no rompa partes existentes del sistema.

## Cuándo usar esta habilidad

- Antes de realizar cualquier edición de código en cualquier lenguaje.
- Al integrar nuevas librerías o componentes visuales.
- Cuando el usuario reporte un error, crash o pantalla en blanco.
- Para optimizar el rendimiento y limpiar código "muerto" o basura.

## Protocolo de Seguridad "Zero-Crash"

1. **Escaneo de Dependencias**: Antes de escribir, verifica el archivo de configuración (`package.json`, `requirements.txt`, etc.). Si vas a usar una función de una librería (ej: Lucide Icons, Framer Motion), asegúrate de que esté instalada.
2. **Análisis de Impacto Lateral**: Busca en todo el proyecto dónde se usa la función o componente que vas a tocar. Si cambias el nombre de una variable, debes actualizarla en todos los archivos relacionados.
3. **Validación de Sintaxis Moderna**:
   - **En React**: Verifica que los Hooks (useState, useEffect) estén dentro de la función y que todas las etiquetas JSX estén cerradas.
   - **En Tailwind CSS**: Asegúrate de que las clases existan y no generen conflictos visuales que oculten elementos (como un `hidden` accidental).
   - **En APIs**: Verifica que las rutas de importación (ej: `../components/...`) sean correctas y existan.
4. **Prueba de Humo Automática**: Utiliza la terminal de IDX para ejecutar comandos de verificación (ej: `npm run lint` o `npm run build`) ANTES de dar la tarea por terminada. Si el comando falla, el agente debe corregir el error sin que el usuario lo pida.

## Reglas Técnicas Universales

- **No Alucinación de Librerías**: No inventes props o funciones que no existen en la documentación oficial de la librería usada.
- **Manejo de Errores Silencioso**: Implementa `Try/Catch` en funciones críticas y `Error Boundaries` en componentes visuales para que, si algo falla, no se caiga toda la app (evitar pantalla negra).
- **Consistencia Visual**: Si el proyecto usa Tailwind, mantén el sistema de diseño existente (colores, espaciados) sin inventar estilos nuevos que rompan la estética.

## Memoria de Errores (Aprendizaje Continuo)

El agente debe mantener un archivo llamado `.agent/LOG_DE_ERRORES.md` en la raíz del proyecto. 
- Cada vez que el agente cometa un error que rompa la app, debe registrar: **Qué falló**, **Por qué falló** y **Cómo evitarlo**.
- Este archivo debe ser consultado por el agente al inicio de cada nueva sesión de chat.

## Ejemplo de uso

**Usuario**: "Agregá un botón de login en el header."
**Agente (usando la skill)**: 
1. Reviso `Header.tsx`. 
2. Veo que usa Tailwind. 
3. Reviso si necesito una librería de iconos. 
4. Agrego el botón. 
5. Verifico que el import de `Link` o `Button` sea correcto. 
6. Ejecuto verificación de tipos. 
7. Respondo al usuario cuando estoy seguro de que no hay errores.
