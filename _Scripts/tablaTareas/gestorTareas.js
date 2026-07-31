/* ============================================================================
   DOCUMENTACIÓN Y GUÍA DE USO (README)
   ============================================================================
   
   --- CÓMO LLAMAR A LA FUNCIÓN DESDE CUALQUIER NOTA .MD ---

   1. Cargar el script en una nota de Obsidian (DataviewJS):
      ```dataviewjs
      const scriptContent = await app.vault.adapter.read("_Scripts/tablaTareas/gestorTareas.js");
      const module = { exports: {} };
      new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);
      const { gestorTareas } = module.exports;

      gestorTareas(this.container, { 
          proceso: true, 
          finalizadas: false, 
          submenu: true 
      });
      ```

   --- PARÁMETROS DEL OBJETO DE CONFIGURACIÓN ---
   - proceso (boolean): true para mostrar la tabla de tareas "En Proceso".
   - finalizadas (boolean): true para mostrar la tabla de tareas "Finalizadas".
   - submenu (boolean): true para renderizar el panel interactivo de filtros superior.
   - filtrosDirectos (object): opcional, ej: { fecha: "PERSONALIZADO", fechaInicio: "2024-01-01", fechaFin: "2024-12-31", tag: "#tarea" }.

   ============================================================================ */

// ============================================================================
// CONFIGURACIÓN DE RUTAS Y CONSTANTES
// ============================================================================
const RUTAS_BUSQUEDA = '"00Diario" or "01Cursos"';
const TAGS_OBJETIVO = ["#pendiente", "#duda", "#tarea"];

// Variables de estado global (para la persistencia del menú interactivo)
if (typeof window.filtroFechaSeleccionado === "undefined") window.filtroFechaSeleccionado = "TODOS";
if (typeof window.filtroFechaInicio === "undefined") window.filtroFechaInicio = "";
if (typeof window.filtroFechaFin === "undefined") window.filtroFechaFin = "";
if (typeof window.filtroTagSeleccionado === "undefined") window.filtroTagSeleccionado = "TODOS";
if (typeof window.filtroTipoSeleccionado === "undefined") window.filtroTipoSeleccionado = "TODOS";

// ============================================================================
// 1. MÓDULO DE OBTENCIÓN Y FILTRADO DE DATOS
// ============================================================================
function obtenerDatosVault() {
    const todasLasTareas = dv.pages(RUTAS_BUSQUEDA).file.tasks;
    const tiposEncontrados = new Set();
    
    todasLasTareas.forEach(t => {
        const archivoPagina = dv.page(t.link.path);
        if (archivoPagina && archivoPagina.tipo) {
            const val = Array.isArray(archivoPagina.tipo) ? archivoPagina.tipo[0] : archivoPagina.tipo;
            if (val) tiposEncontrados.add(String(val).trim());
        }
    });

    return {
        tareas: todasLasTareas,
        listaTipos: Array.from(tiposEncontrados).sort()
    };
}

function aplicarFiltrosAtareas(tareas, conMenuFiltro = false, filtrosDirectos = {}) {
    const modoFecha = conMenuFiltro ? window.filtroFechaSeleccionado : (filtrosDirectos.fecha || "TODOS");
    const tagFiltro = conMenuFiltro ? window.filtroTagSeleccionado : (filtrosDirectos.tag || "TODOS");
    const tipoFiltro = conMenuFiltro ? window.filtroTipoSeleccionado : (filtrosDirectos.tipo || "TODOS");

    return tareas.where(t => {
        // 1. Validar Tags
        const tieneTagValido = TAGS_OBJETIVO.some(tag => t.tags.includes(tag));
        if (!tieneTagValido) return false;

        if (tagFiltro !== "TODOS" && !t.tags.includes(tagFiltro)) return false;

        // 2. Validar Tipo (propiedad YAML/Frontmatter)
        const archivoPagina = dv.page(t.link.path);
        let tipoPropiedad = "Sin tipo";
        if (archivoPagina && archivoPagina.tipo) {
            tipoPropiedad = Array.isArray(archivoPagina.tipo) ? archivoPagina.tipo[0] : archivoPagina.tipo;
        }
        if (tipoFiltro !== "TODOS" && tipoPropiedad !== tipoFiltro) return false;

        // 3. Obtener Fechas
        const matchCreacion = t.text.match(/(?:➕|\+)\s*(\d{4}-\d{2}-\d{2})/);
        const matchFin = t.text.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
        
        let fechaRef = "Sin fecha";
        if (t.completed) {
            fechaRef = matchFin ? matchFin[1] : (t.completion ? dv.date(t.completion).toFormat("yyyy-MM-dd") : dv.date("today").toFormat("yyyy-MM-dd"));
        } else {
            fechaRef = matchCreacion ? matchCreacion[1] : "Sin fecha";
        }

        if (modoFecha === "TODOS" || !fechaRef || fechaRef === "Sin fecha") return true;

        const hoy = dv.date("today");
        const fechaObj = dv.date(fechaRef);
        if (!fechaObj) return true;

        // Filtros de fecha relativos
        if (modoFecha === "7_DIAS") return fechaObj >= hoy.minus({ days: 7 }) && fechaObj <= hoy;
        if (modoFecha === "30_DIAS") return fechaObj >= hoy.minus({ days: 30 }) && fechaObj <= hoy;
        if (modoFecha === "ESTE_MES") return fechaObj.month === hoy.month && fechaObj.year === hoy.year;
        if (modoFecha === "3_MESES") return fechaObj >= hoy.minus({ months: 3 }) && fechaObj <= hoy;
        if (modoFecha === "6_MESES") return fechaObj >= hoy.minus({ months: 6 }) && fechaObj <= hoy;

        // Filtro de fecha personalizado
        if (modoFecha === "PERSONALIZADO") {
            const fInicio = conMenuFiltro ? window.filtroFechaInicio : filtrosDirectos.fechaInicio;
            const fFin = conMenuFiltro ? window.filtroFechaFin : filtrosDirectos.fechaFin;

            if (fInicio && fechaObj < dv.date(fInicio)) return false;
            if (fFin && fechaObj > dv.date(fFin)) return false;
            return true;
        }

        return true;
    });
}

// ============================================================================
// 2. MÓDULO DE FORMATO Y TABLAS
// ============================================================================
function obtenerFormatoTag(tags) {
    if (tags.includes("#duda")) return '<span style="color: #61afef; font-weight: bold;">#duda</span>';
    if (tags.includes("#pendiente")) return '<span style="color: #c678dd; font-weight: bold;">#pendiente</span>';
    if (tags.includes("#tarea")) return '<span style="color: #98c379; font-weight: bold;">#tarea</span>';
    return "—";
}

function limpiarTextoTarea(texto) {
    return texto
        .replace(/#pendiente|#duda|#tarea/g, "")
        .replace(/(?:➕|\+)\s*\d{4}-\d{2}-\d{2}/g, "")
        .replace(/✅\s*\d{4}-\d{2}-\d{2}/g, "")
        .replace(/\[solucion::\s*[^\]]+\]/gi, "")
        .trim();
}

function renderTablaEnProceso(tareas) {
    const tareasProceso = tareas.where(t => !t.completed);
    dv.header(3, '⏳ Registro de Tareas en <span style="color: #e5c07b;">Proceso</span>');

    if (tareasProceso.length === 0) {
        dv.paragraph("*No hay tareas en proceso que coincidan.*");
        return;
    }

    const filas = tareasProceso.map(t => {
        const archivoPagina = dv.page(t.link.path);
        const tipoPropiedad = archivoPagina && archivoPagina.tipo 
            ? (Array.isArray(archivoPagina.tipo) ? archivoPagina.tipo[0] : archivoPagina.tipo) : "Sin tipo";

        const matchCreacion = t.text.match(/(?:➕|\+)\s*(\d{4}-\d{2}-\d{2})/);
        const fechaCreacion = matchCreacion ? matchCreacion[1] : "Sin fecha";

        const nombreArchivo = t.link.path.split('/').pop().replace('.md', '');
        const origenLimpio = dv.fileLink(t.link.path, false, nombreArchivo);

        return [
            tipoPropiedad,
            origenLimpio,
            fechaCreacion,
            '<span style="color: #e5c07b; font-weight: bold;">🟡 En Proceso</span>',
            obtenerFormatoTag(t.tags),
            limpiarTextoTarea(t.text)
        ];
    });

    dv.table(["Tipo", "Origen", "Creación", "Estado", "Tag", "Descripción"], filas);
}

function renderTablaFinalizadas(tareas) {
    const tareasFinalizadas = tareas.where(t => t.completed);
    dv.header(3, '✅ Registro de Tareas <span style="color: #98c379;">Finalizadas</span>');

    if (tareasFinalizadas.length === 0) {
        dv.paragraph("*No hay tareas finalizadas que coincidan.*");
        return;
    }

    const filas = tareasFinalizadas.map(t => {
        const archivoPagina = dv.page(t.link.path);
        const tipoPropiedad = archivoPagina && archivoPagina.tipo 
            ? (Array.isArray(archivoPagina.tipo) ? archivoPagina.tipo[0] : archivoPagina.tipo) : "Sin tipo";

        // 1. Buscar fecha explícita con ✅ YYYY-MM-DD
        const matchFin = t.text.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
        
        // 2. Intentar obtener fecha del título del archivo (ej. 2026-07-30.md)
        const matchFechaArchivo = t.link.path.match(/(\d{4}-\d{2}-\d{2})/);
        
        // 3. Fallback: Fecha de modificación de la nota o Fecha de Hoy
        let fechaFin = "0000-00-00";
        if (matchFin) {
            fechaFin = matchFin[1];
        } else if (t.completion) {
            fechaFin = dv.date(t.completion).toFormat("yyyy-MM-dd");
        } else if (matchFechaArchivo) {
            fechaFin = matchFechaArchivo[1];
        } else if (archivoPagina && archivoPagina.file.mtime) {
            fechaFin = dv.date(archivoPagina.file.mtime).toFormat("yyyy-MM-dd");
        } else {
            fechaFin = dv.date("today").toFormat("yyyy-MM-dd");
        }

        const matchCreacion = t.text.match(/(?:➕|\+)\s*(\d{4}-\d{2}-\d{2})/);
        const fechaCreacion = matchCreacion ? matchCreacion[1] : "Sin fecha";

        const matchSolucion = t.text.match(/\[solucion::\s*([^\]]+)\]/i);
        const solucion = (matchSolucion && matchSolucion[1]) ? matchSolucion[1].trim() : "—";

        const nombreArchivo = t.link.path.split('/').pop().replace('.md', '');
        const origenLimpio = dv.fileLink(t.link.path, false, nombreArchivo);

        return {
            fechaFin: String(fechaFin),
            datos: [
                tipoPropiedad,
                origenLimpio,
                fechaCreacion,
                '<span style="color: #98c379; font-weight: bold;">🟢 Finalizado</span>',
                obtenerFormatoTag(t.tags),
                limpiarTextoTarea(t.text),
                solucion,
                fechaFin
            ]
        };
    });

    filas.sort((a, b) => (b.fechaFin || "").localeCompare(a.fechaFin || ""));

    dv.table(
        ["Tipo", "Origen", "Creación", "Estado", "Tag", "Descripción", "Observación", "Finalización"], 
        filas.map(f => f.datos)
    );
}

// ============================================================================
// 3. MÓDULO DE INTERFAZ Y CONTROLES (SUBMENÚ)
// ============================================================================
function renderPanelFiltrosUI(contenedor, listaTipos, callbackRedibujar) {
    const controlDiv = contenedor.createEl("div", { 
        attr: { style: "margin-bottom: 20px; padding: 14px; background: var(--background-secondary); border-radius: 8px; display: flex; flex-direction: column; gap: 12px;" } 
    });

    controlDiv.createEl("div", { 
        text: "⚙️ Filtros Submenú", 
        attr: { style: "font-weight: bold; font-size: 1.05em; color: var(--text-normal); border-bottom: 1px solid var(--background-modifier-border); padding-bottom: 6px;" } 
    });

    // Fila 1: Fechas
    const filaFechas = controlDiv.createEl("div", { attr: { style: "display: flex; align-items: center; gap: 12px; flex-wrap: wrap;" } });
    filaFechas.createEl("label", { text: "📅 Fecha:", attr: { style: "font-weight: bold; font-size: 0.9em;" } });
    
    const selectFecha = filaFechas.createEl("select", {
        attr: { style: "padding: 5px 10px; border-radius: 5px; background: var(--background-primary); color: var(--text-normal); border: 1px solid var(--background-modifier-border);" }
    });

    const opcionesFecha = [
        { value: "TODOS", text: "🌐 Todo el Histórico" },
        { value: "7_DIAS", text: "⚡ Últimos 7 Días" },
        { value: "30_DIAS", text: "🗓️ Últimos 30 Días" },
        { value: "ESTE_MES", text: "📅 Este Mes" },
        { value: "3_MESES", text: "🗓️ Últimos 3 Meses" },
        { value: "6_MESES", text: "📅 Últimos 6 Meses" },
        { value: "PERSONALIZADO", text: "📆 Personalizado" }
    ];

    opcionesFecha.forEach(opt => {
        const optionEl = selectFecha.createEl("option", { value: opt.value, text: opt.text });
        if (window.filtroFechaSeleccionado === opt.value) optionEl.selected = true;
    });

    selectFecha.addEventListener("change", (e) => {
        window.filtroFechaSeleccionado = e.target.value;
        callbackRedibujar();
    });

    // Inputs dinámicos cuando se elige la opción Personalizado
    if (window.filtroFechaSeleccionado === "PERSONALIZADO") {
        const customDateDiv = filaFechas.createEl("div", { attr: { style: "display: flex; align-items: center; gap: 10px; margin-left: 5px;" } });
        const estiloInputFecha = "padding: 5px 8px; border-radius: 5px; background: var(--background-primary); color: var(--text-normal); border: 1px solid var(--background-modifier-border); font-family: inherit; font-size: 0.9em;";

        customDateDiv.createEl("span", { text: "Desde:", attr: { style: "font-size: 0.85em; opacity: 0.8;" } });
        const inputInicio = customDateDiv.createEl("input", { attr: { type: "date", value: window.filtroFechaInicio, style: estiloInputFecha } });
        inputInicio.addEventListener("change", (e) => {
            window.filtroFechaInicio = e.target.value;
            callbackRedibujar();
        });

        customDateDiv.createEl("span", { text: "Hasta:", attr: { style: "font-size: 0.85em; opacity: 0.8;" } });
        const inputFin = customDateDiv.createEl("input", { attr: { type: "date", value: window.filtroFechaFin, style: estiloInputFecha } });
        inputFin.addEventListener("change", (e) => {
            window.filtroFechaFin = e.target.value;
            callbackRedibujar();
        });
    }

    // Fila 2: Tag y Tipo
    const filaTagTipo = controlDiv.createEl("div", { attr: { style: "display: flex; align-items: center; gap: 20px; flex-wrap: wrap;" } });

    // Selector Tag
    const tagGroup = filaTagTipo.createEl("div", { attr: { style: "display: flex; align-items: center; gap: 8px;" } });
    tagGroup.createEl("label", { text: "🏷️ Tag:", attr: { style: "font-weight: bold; font-size: 0.9em;" } });
    const selectTag = tagGroup.createEl("select", {
        attr: { style: "padding: 5px 10px; border-radius: 5px; background: var(--background-primary); color: var(--text-normal); border: 1px solid var(--background-modifier-border);" }
    });

    const opcionesTag = [
        { value: "TODOS", text: "🏷️ Todos los Tags" },
        { value: "#pendiente", text: "🟣 #pendiente" },
        { value: "#duda", text: "🔵 #duda" },
        { value: "#tarea", text: "🟢 #tarea" }
    ];

    opcionesTag.forEach(opt => {
        const optionEl = selectTag.createEl("option", { value: opt.value, text: opt.text });
        if (window.filtroTagSeleccionado === opt.value) optionEl.selected = true;
    });

    selectTag.addEventListener("change", (e) => {
        window.filtroTagSeleccionado = e.target.value;
        callbackRedibujar();
    });

    // Selector Tipo
    const tipoGroup = filaTagTipo.createEl("div", { attr: { style: "display: flex; align-items: center; gap: 8px;" } });
    tipoGroup.createEl("label", { text: "📂 Tipo:", attr: { style: "font-weight: bold; font-size: 0.9em;" } });
    const selectTipo = tipoGroup.createEl("select", {
        attr: { style: "padding: 5px 10px; border-radius: 5px; background: var(--background-primary); color: var(--text-normal); border: 1px solid var(--background-modifier-border);" }
    });

    const optionTipoTodos = selectTipo.createEl("option", { value: "TODOS", text: "📂 Todos los Tipos" });
    if (window.filtroTipoSeleccionado === "TODOS") optionTipoTodos.selected = true;

    listaTipos.forEach(tipoVal => {
        const optionEl = selectTipo.createEl("option", { value: tipoVal, text: `📌 ${tipoVal}` });
        if (window.filtroTipoSeleccionado === tipoVal) optionEl.selected = true;
    });

    selectTipo.addEventListener("change", (e) => {
        window.filtroTipoSeleccionado = e.target.value;
        callbackRedibujar();
    });
}

// ============================================================================
// 4. FUNCIÓN PRINCIPAL / EXPORTACIÓN
// ============================================================================
function gestorTareas(contenedor, config = {}) {
    const opciones = {
        submenu: false,           // Dibuja el panel visual de filtros
        proceso: true,            // Muestra tabla en proceso
        finalizadas: true,        // Muestra tabla finalizadas
        filtrosDirectos: {},      // Permite pasar filtros prefijados ex: { fecha: "PERSONALIZADO", fechaInicio: "2024-01-01" }
        ...config
    };

    contenedor.empty();

    const { tareas, listaTipos } = obtenerDatosVault();

    if (opciones.submenu) {
        renderPanelFiltrosUI(contenedor, listaTipos, () => gestorTareas(contenedor, opciones));
    }

    const tareasProcesadas = aplicarFiltrosAtareas(tareas, opciones.submenu, opciones.filtrosDirectos);

    if (opciones.proceso) {
        renderTablaEnProceso(tareasProcesadas);
    }

    if (opciones.finalizadas) {
        renderTablaFinalizadas(tareasProcesadas);
    }
}

module.exports = { gestorTareas };