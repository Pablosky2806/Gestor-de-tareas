const { createApp, computed, reactive, toRefs } = Vue;

function createEmptyTicket() {
  return {
    id: null,
    titulo: "",
    descripcion: "",
    solicitante: "",
    prioridad: "media",
    estado: "abierto", // 'abierto' | 'cerrado'
    creadoEn: null,
    cerradoEn: null,
  };
}

const STORAGE_KEY = "gestor-tareas-mantenimiento-v1";

const App = {
  setup() {
    const state = reactive({
      tickets: [],
      filtroEstado: "todos",
      filtroPrio: "todas",
      busqueda: "",
      editandoId: null,
      form: createEmptyTicket(),
      errores: {},
    });

    function cargarDesdeStorage() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          state.tickets = parsed;
        }
      } catch (e) {
        console.error("No se pudieron cargar los tickets", e);
      }
    }

    function guardarEnStorage() {
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(state.tickets)
        );
      } catch (e) {
        console.error("No se pudieron guardar los tickets", e);
      }
    }

    function resetFormulario() {
      state.form = createEmptyTicket();
      state.editandoId = null;
      state.errores = {};
    }

    function validar() {
      const errores = {};
      if (!state.form.titulo.trim()) {
        errores.titulo = "El título es obligatorio.";
      }
      if (!state.form.descripcion.trim()) {
        errores.descripcion = "Añade una descripción corta del trabajo.";
      }
      if (!state.form.solicitante.trim()) {
        errores.solicitante = "Indica quién ha pedido la tarea.";
      }
      if (!["alta", "media", "baja"].includes(state.form.prioridad)) {
        errores.prioridad = "Selecciona una prioridad.";
      }
      state.errores = errores;
      return Object.keys(errores).length === 0;
    }

    function crearTicket() {
      if (!validar()) return;
      const ahora = new Date().toISOString();
      const nuevo = {
        ...state.form,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        creadoEn: ahora,
        estado: "abierto",
        cerradoEn: null,
      };
      state.tickets.unshift(nuevo);
      guardarEnStorage();
      resetFormulario();
    }

    function cargarParaEditar(ticket) {
      state.editandoId = ticket.id;
      state.form = {
        ...ticket,
      };
      state.errores = {};
    }

    function guardarEdicion() {
      if (!validar()) return;
      const idx = state.tickets.findIndex((t) => t.id === state.editandoId);
      if (idx === -1) return;
      const anterior = state.tickets[idx];

      const actualizado = {
        ...anterior,
        ...state.form,
      };

      if (anterior.estado === "abierto" && actualizado.estado === "cerrado") {
        actualizado.cerradoEn = new Date().toISOString();
      }
      if (anterior.estado === "cerrado" && actualizado.estado === "abierto") {
        actualizado.cerradoEn = null;
      }

      state.tickets.splice(idx, 1, actualizado);
      guardarEnStorage();
      resetFormulario();
    }

    function cancelarEdicion() {
      resetFormulario();
    }

    function alternarEstado(ticket) {
      const idx = state.tickets.findIndex((t) => t.id === ticket.id);
      if (idx === -1) return;
      const copia = { ...state.tickets[idx] };
      if (copia.estado === "abierto") {
        copia.estado = "cerrado";
        copia.cerradoEn = new Date().toISOString();
      } else {
        copia.estado = "abierto";
        copia.cerradoEn = null;
      }
      state.tickets.splice(idx, 1, copia);
      guardarEnStorage();
    }

    function borrar(ticket) {
      if (!window.confirm("¿Seguro que quieres borrar este ticket?")) return;
      state.tickets = state.tickets.filter((t) => t.id !== ticket.id);
      guardarEnStorage();
      if (state.editandoId === ticket.id) {
        resetFormulario();
      }
    }

    function formatoFecha(fechaIso) {
      if (!fechaIso) return "-";
      const fecha = new Date(fechaIso);
      return fecha.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const ticketsFiltrados = computed(() => {
      return state.tickets
        .filter((t) => {
          if (state.filtroEstado === "abierto" && t.estado !== "abierto") {
            return false;
          }
          if (state.filtroEstado === "cerrado" && t.estado !== "cerrado") {
            return false;
          }
          if (state.filtroPrio !== "todas" && t.prioridad !== state.filtroPrio) {
            return false;
          }
          const q = state.busqueda.trim().toLowerCase();
          if (!q) return true;
          return (
            t.titulo.toLowerCase().includes(q) ||
            t.descripcion.toLowerCase().includes(q) ||
            t.solicitante.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => {
          const prioOrden = { alta: 0, media: 1, baja: 2 };
          if (a.estado !== b.estado) {
            return a.estado === "abierto" ? -1 : 1;
          }
          if (prioOrden[a.prioridad] !== prioOrden[b.prioridad]) {
            return prioOrden[a.prioridad] - prioOrden[b.prioridad];
          }
          return (b.creadoEn || "").localeCompare(a.creadoEn || "");
        });
    });

    const totalAbiertos = computed(
      () => state.tickets.filter((t) => t.estado === "abierto").length
    );
    const totalCerrados = computed(
      () => state.tickets.filter((t) => t.estado === "cerrado").length
    );
    const totalAlta = computed(
      () =>
        state.tickets.filter(
          (t) => t.estado === "abierto" && t.prioridad === "alta"
        ).length
    );

    cargarDesdeStorage();

    return {
      ...toRefs(state),
      ticketsFiltrados,
      totalAbiertos,
      totalCerrados,
      totalAlta,
      crearTicket,
      cargarParaEditar,
      guardarEdicion,
      cancelarEdicion,
      alternarEstado,
      borrar,
      formatoFecha,
    };
  },
  template: `
    <div class="shell">
      <header class="shell-header">
        <div class="title-block">
          <h1>Gestor de Tareas · Mantenimiento</h1>
          <p>Control rápido de tickets que te piden en la empresa.</p>
        </div>
        <div class="pill">
          <span class="pill-dot"></span>
          Vista local (solo en este navegador)
        </div>
      </header>

      <div class="layout">
        <section class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">
                TICKETS <span>EN CURSO</span>
              </div>
              <p class="panel-sub">
                Ten a la vista lo que falta por hacer y lo que ya has cerrado.
              </p>
            </div>
            <span class="badge">
              {{ tickets.length }} tickets totales
            </span>
          </div>

          <div class="controls-row">
            <div class="search">
              <span>🔍</span>
              <input
                v-model="busqueda"
                type="text"
                placeholder="Buscar por título, descripción o solicitante..."
              />
            </div>
            <button class="btn btn-quiet" @click="filtroEstado = 'abierto'">
              <span class="icon">⚡</span>
              En curso: {{ totalAbiertos }}
            </button>
          </div>

          <div class="controls-row">
            <div class="chip-group">
              <button
                class="chip"
                :data-active="filtroEstado === 'todos'"
                @click="filtroEstado = 'todos'"
              >
                Todos
              </button>
              <button
                class="chip"
                :data-active="filtroEstado === 'abierto'"
                @click="filtroEstado = 'abierto'"
              >
                Solo abiertos
              </button>
              <button
                class="chip"
                :data-active="filtroEstado === 'cerrado'"
                @click="filtroEstado = 'cerrado'"
              >
                Cerrados
              </button>
            </div>
            <div class="chip-group">
              <button
                class="chip"
                :data-active="filtroPrio === 'todas'"
                data-variant="ghost"
                @click="filtroPrio = 'todas'"
              >
                Toda prioridad
              </button>
              <button
                class="chip"
                :data-active="filtroPrio === 'alta'"
                data-variant="ghost"
                @click="filtroPrio = 'alta'"
              >
                Alta
              </button>
              <button
                class="chip"
                :data-active="filtroPrio === 'media'"
                data-variant="ghost"
                @click="filtroPrio = 'media'"
              >
                Media
              </button>
              <button
                class="chip"
                :data-active="filtroPrio === 'baja'"
                data-variant="ghost"
                @click="filtroPrio = 'baja'"
              >
                Baja
              </button>
            </div>
          </div>

          <div class="ticket-list">
            <div v-if="ticketsFiltrados.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              Aún no hay tickets que cumplan este filtro.
              <div class="empty-hint">
                Crea un nuevo ticket en el panel derecho.
              </div>
            </div>

            <article
              v-for="ticket in ticketsFiltrados"
              :key="ticket.id"
              class="ticket"
            >
              <div class="ticket-main">
                <div class="ticket-title-row">
                  <h3 class="ticket-title">
                    {{ ticket.titulo || 'Sin título' }}
                  </h3>
                  <div class="ticket-meta-top">
                    <span
                      class="tag"
                      :class="'prio-' + ticket.prioridad"
                    >
                      Prioridad:
                      <strong style="text-transform: uppercase">
                        {{ ticket.prioridad }}
                      </strong>
                    </span>
                    <span
                      class="tag"
                      :class="ticket.estado === 'abierto' ? 'estado-abierto' : 'estado-cerrado'"
                    >
                      {{ ticket.estado === 'abierto' ? 'Abierto' : 'Cerrado' }}
                    </span>
                  </div>
                </div>

                <div class="ticket-body">
                  {{ ticket.descripcion }}
                </div>

                <div class="ticket-meta-bottom">
                  <span>👤 {{ ticket.solicitante || 'Sin especificar' }}</span>
                  <span>📅 {{ formatoFecha(ticket.creadoEn) }}</span>
                  <span v-if="ticket.cerradoEn">
                    ✅ Cerrado: {{ formatoFecha(ticket.cerradoEn) }}
                  </span>
                </div>
              </div>

              <div class="ticket-actions">
                <div class="ticket-actions-row">
                  <button
                    class="btn btn-ghost"
                    @click="cargarParaEditar(ticket)"
                  >
                    <span class="icon">✏️</span>
                    Editar
                  </button>
                  <button
                    class="btn"
                    :class="ticket.estado === 'abierto' ? 'btn-ok' : 'btn-danger'"
                    @click="alternarEstado(ticket)"
                  >
                    <span class="icon">
                      {{ ticket.estado === 'abierto' ? '✅' : '↩️' }}
                    </span>
                    {{ ticket.estado === 'abierto' ? 'Cerrar tarea' : 'Reabrir' }}
                  </button>
                </div>
                <button class="btn btn-quiet" @click="borrar(ticket)">
                  <span class="icon">🗑️</span>
                  Borrar
                </button>
              </div>
            </article>
          </div>

          <div class="divider"></div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Abiertos ahora</div>
              <div class="stat-value">{{ totalAbiertos }}</div>
              <div class="stat-pill">
                <span class="stat-dot"></span>
                Lo que aún te queda
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Cerrados</div>
              <div class="stat-value">{{ totalCerrados }}</div>
              <div class="stat-pill">
                ✅ Historial de trabajos hechos
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Prioridad alta abierta</div>
              <div class="stat-value">{{ totalAlta }}</div>
              <div class="stat-pill">
                ⚠️ Cosas para no olvidar
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <div class="panel-title">
                {{ editandoId ? 'EDITAR TICKET' : 'NUEVO TICKET' }}
              </div>
              <p class="panel-sub">
                Rellena rápido el pedido que te han hecho.
              </p>
            </div>
            <span
              class="badge"
              :class="{ critical: totalAlta > 0 }"
            >
              {{ totalAlta }} urgentes abiertas
            </span>
          </div>

          <form
            class="form"
            @submit.prevent="editandoId ? guardarEdicion() : crearTicket()"
          >
            <div class="field">
              <div class="field-label-row">
                <label for="titulo">Título</label>
                <span class="field-hint">
                  Ej: Fuga en baño 2ª planta
                </span>
              </div>
              <input
                id="titulo"
                class="input"
                v-model.trim="form.titulo"
                type="text"
                placeholder="Una frase corta para reconocer la tarea"
              />
              <p v-if="errores.titulo" class="error-text">
                {{ errores.titulo }}
              </p>
            </div>

            <div class="field">
              <div class="field-label-row">
                <label for="descripcion">Descripción</label>
                <span class="field-hint">
                  Añade los mínimos detalles para que te acuerdes.
                </span>
              </div>
              <textarea
                id="descripcion"
                class="textarea"
                v-model.trim="form.descripcion"
                placeholder="¿Qué hay que hacer exactamente?"
              ></textarea>
              <p v-if="errores.descripcion" class="error-text">
                {{ errores.descripcion }}
              </p>
            </div>

            <div class="meta-row">
              <div class="field">
                <div class="field-label-row">
                  <label for="solicitante">Quién lo pide</label>
                </div>
                <input
                  id="solicitante"
                  class="input"
                  v-model.trim="form.solicitante"
                  type="text"
                  placeholder="Departamento, persona, planta..."
                />
                <p v-if="errores.solicitante" class="error-text">
                  {{ errores.solicitante }}
                </p>
              </div>

              <div class="field">
                <div class="field-label-row">
                  <label for="prioridad">Prioridad</label>
                </div>
                <select
                  id="prioridad"
                  class="select"
                  v-model="form.prioridad"
                >
                  <option value="alta">Alta · Urgente</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
                <p v-if="errores.prioridad" class="error-text">
                  {{ errores.prioridad }}
                </p>
              </div>
            </div>

            <div class="meta-row" v-if="editandoId">
              <div class="field">
                <div class="field-label-row">
                  <label for="estado">Estado</label>
                  <span class="field-hint">
                    También lo puedes cambiar desde la lista.
                  </span>
                </div>
                <select
                  id="estado"
                  class="select"
                  v-model="form.estado"
                >
                  <option value="abierto">Abierto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              <div class="field">
                <div class="field-label-row">
                  <label>Fechas</label>
                </div>
                <div style="font-size: 0.75rem; color: rgba(148, 163, 184, 0.95)">
                  Creado: {{ formatoFecha(form.creadoEn) }}<br />
                  Cerrado: {{ formatoFecha(form.cerradoEn) }}
                </div>
              </div>
            </div>

            <div class="form-footer">
              <div class="form-footer-left">
                <span
                  class="pill-small"
                  :class="{
                    ok: !editandoId,
                    warn: !!editandoId,
                    danger: !!errores.titulo || !!errores.descripcion || !!errores.solicitante
                  }"
                >
                  <span v-if="!editandoId">➕</span>
                  <span v-else>✏️</span>
                  {{ editandoId ? 'Editando ticket existente' : 'Creando un ticket nuevo' }}
                </span>
                <span v-if="Object.keys(errores).length" class="error-text">
                  Revisa los campos marcados antes de guardar.
                </span>
              </div>

              <div class="form-footer-actions">
                <button
                  v-if="editandoId"
                  type="button"
                  class="btn btn-ghost"
                  @click="cancelarEdicion"
                >
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                  <span class="icon">
                    {{ editandoId ? '💾' : '➕' }}
                  </span>
                  {{ editandoId ? 'Guardar cambios' : 'Crear ticket' }}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  `,
};

createApp(App).mount("#app");

