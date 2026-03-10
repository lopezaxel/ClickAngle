---
name: experto-supabase
description: Habilidad de ingeniero senior/arquitecto experto en Supabase (PostgreSQL, Auth, RLS, RPCs). Asegura integridad, seguridad y performance en la capa de datos.
---

# Experto Supabase: Ingeniería de Datos Senior

Esta habilidad dota al agente de un conocimiento profundo sobre la plataforma Supabase y PostgreSQL, permitiendo diseñar esquemas robustos, políticas de seguridad infalibles y consultas de alto rendimiento para ClickAngle.

## Arquitectura de Datos en ClickAngle

- **Esquema Público**: 
  - `profiles`: Datos de usuario extendidos (vía triggers de auth).
  - `channels`: Entidad principal de canales de YouTube.
  - `channel_members`: Tabla de unión para roles y permisos.
- **Seguridad (RLS)**:
  - Todas las tablas deben tener RLS activo.
  - Las políticas deben basarse en `auth.uid()`.
  - Ejemplo de política: `(owner_id = auth.uid())` o mediante chequeo en `channel_members`.

## Protocolos de Programación Experta

### 1. Consultas Eficientes
- **No usar `select('*')`**: Solicitar solo las columnas necesarias para reducir ancho de banda.
- **Filtros del lado del servidor**: Siempre usar `.eq()`, `.in()`, `.gt()` antes de recibir los datos.
- **Relaciones (Joins)**: Usar la sintaxis de Supabase para traer datos relacionados en una sola petición (ej. `select('*, profiles(*)')`).

### 2. Lógica Segura con RPCs
- **Datos Sensibles**: Almacenamiento cifrado de API Keys. Acceso únicamente mediante RPCs con `security definer`.
- **Validación**: Implementar lógica de validación dentro de funciones PostgreSQL para asegurar integridad antes de insertar datos.

### 3. Autenticación y Sesión
- **Persistencia**: Manejo correcto del estado local sincronizado con `supabase.auth.onAuthStateChange`.
- **Errores de Token**: Protocolo de limpieza de `localStorage` ante errores de refresco de token ("Stuck transitions").

## Resolución de Errores Críticos

- **PostgREST Errors**: Diagnóstico rápido de errores 406 (Not Acceptable), 409 (Conflict) y 425 (Too Many Requests).
- **RLS Debugging**: Si una consulta devuelve un array vacío sin error, verificar la política de SELECT en la tabla.
- **Connection Timeouts**: Implementar lógica de reintento exponencial para peticiones críticas.

## Cuándo usar esta habilidad

- Al modificar el esquema de la base de datos.
- Al crear o ajustar políticas de Row Level Security.
- Al depurar problemas de inicio de sesión o permisos.
- Al integrar nuevas tablas o funciones (RPC) en el flujo de la aplicación.

## Cómo usarla

1. **Planifica el Query**: Antes de escribir el código JS, mentaliza la estructura del JSON resultante.
2. **Verifica Permisos**: Asegúrate de que el usuario logueado tiene los permisos de RLS necesarios para la operación.
3. **Maneja el Error**: Siempre desestructura `{ data, error }` y maneja el error explícitamente.
