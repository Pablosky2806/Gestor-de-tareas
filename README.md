# Gestor de Tareas para Mantenimiento

Aplicación sencilla de gestión de tickets de mantenimiento desarrollada con **Vue 3** (via CDN) y desplegada como sitio estático.  
Está pensada para que un responsable de mantenimiento pueda anotar rápidamente las tareas que le llegan (averías, peticiones, incidencias), seguir su estado y priorizarlas.

## Características

- ✅ Creación de tickets con:
  - Título
  - Descripción
  - Quién pide la tarea
  - Prioridad (alta, media, baja)
- ✏️ Edición de tickets existentes:
  - Se puede modificar cualquier campo incluso después de haber marcado la tarea como cerrada.
- 🔁 Cambio rápido de estado:
  - Botón para **cerrar tarea** o **reabrirla** desde la lista.
- 🔎 Filtros y búsqueda:
  - Filtro por estado (todos, abiertos, cerrados)
  - Filtro por prioridad
  - Buscador por título, descripción o solicitante
- 📊 Resumen visual:
  - Total de tickets
  - Tickets abiertos y cerrados
  - Número de tareas abiertas con prioridad alta
- 💾 Persistencia local:
  - Los datos se guardan en `localStorage`, por lo que al recargar la página se mantienen los tickets en ese navegador.

## Tecnologías utilizadas

- **HTML5** y **CSS3**
- **Vue 3** (modo CDN, sin build)
- **JavaScript** vanilla
- Despliegue como **sitio estático** (por ejemplo, en Vercel)

## Estructura del proyecto
