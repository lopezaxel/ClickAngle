---
name: creador-de-habilidades
description: Esta habilidad permite al agente crear otras habilidades con instrucciones y documentación completamente en español, siguiendo las mejores prácticas de Antigravity.
---

# Creador de Habilidades en Español

Esta habilidad te permite generar nuevas capacidades (skills) para el agente Antigravity, asegurando que toda la lógica, instrucciones y ejemplos estén escritos en un español claro y técnico.

## Cuándo usar esta habilidad

- Cuando el usuario solicite crear una nueva "habilidad" o "skill".
- Cuando se necesite documentar procesos o flujos de trabajo en español dentro del directorio `.agent/skills`.
- Cuando se requiera que el agente aprenda una nueva tarea específica y la explicación deba ser en español.

## Cómo usarla

1. **Identificar la necesidad**: Determina qué tarea nueva debe realizar el agente.
2. **Estructura de Carpeta**: Crea una nueva carpeta en `.agent/skills/<nombre_de_la_habilidad>`.
3. **Archivo SKILL.md**: Crea un archivo `SKILL.md` dentro de esa carpeta con el siguiente formato:
   - **Frontmatter YAML**: Incluye `name` (en minúsculas con guiones) y `description` (una breve explicación de la habilidad).
   - **Cuerpo del documento**: Usa encabezados de Markdown para:
     - `# Nombre de la Habilidad`
     - `## Cuándo usar esta habilidad`
     - `## Cómo usarla`
     - `## Ejemplos` (opcional pero recomendado)
4. **Instrucciones en Español**: Asegúrate de que todas las instrucciones dentro del cuerpo del Markdown sean en español, utilizando un tono profesional y directo.
5. **Verificación**: Una vez creado el archivo, el agente podrá utilizar las herramientas y procesos descritos en él para futuras peticiones relacionadas.

## Ejemplo de estructura

```markdown
---
name: mi-nueva-habilidad
description: Breve descripción de lo que hace.
---

# Mi Nueva Habilidad

## Cuándo usar esta habilidad
...

## Cómo usarla
...
```
