async function renderizarDashboardCursos(containerElement, dvRef) {
    const dataview = dvRef || dv;

    if (!dataview) {
        console.error("Dataview no está disponible.");
        return;
    }

    containerElement.empty();

    const mainContainer = containerElement.createEl("div", {
        attr: { style: "display: flex; flex-direction: column; gap: 20px;" }
    });

    // 1. Cargar ÚNICAMENTE las páginas dentro de la carpeta "01Cursos"
    const paginas = dataview.pages('"01Cursos"').where(p => !p.file.path.includes("_Plantillas"));

    // Helper para detectar el 'tipo'
    const obtenerTipo = (p) => {
        if (!p || !p.tipo) return "";
        if (Array.isArray(p.tipo)) return String(p.tipo[0]).toLowerCase().trim();
        return String(p.tipo).toLowerCase().trim();
    };

    const padres = paginas.where(p => obtenerTipo(p) === "cursopadre");
    const subcursos = paginas.where(p => obtenerTipo(p) === "subcurso");

    // Helper para extraer texto/enlace del campo 'cursoPadre'
    const extraerNombresPadre = (campo) => {
        if (!campo) return [];
        let items = Array.isArray(campo) ? campo : [campo];
        
        return items.map(item => {
            if (!item) return "";
            if (typeof item === "object" && item.path) return item.path.split("/").pop().replace(".md", "");
            if (typeof item === "object" && item.fileName) return item.fileName;
            
            let str = String(item);
            const matchLink = str.match(/\[\[(?:[^\]]*\/)?([^\]|]+)(?:\|[^\]]+)?\]\]/);
            if (matchLink) return matchLink[1].trim();
            
            return str.replace(/\[\[/g, "").replace(/\]\]/g, "").replace(/"/g, "").trim();
        }).filter(Boolean);
    };

    // Helper para formatear fechas sin desfase de zona horaria
    const formatearFecha = (val) => {
        if (!val || val === "—") return null;
        
        if (typeof val === "object") {
            if (val.toISODate) return val.toISODate();
            if (val.ts) {
                const d = new Date(val.ts);
                if (isNaN(d.getTime())) return null;
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        }
        
        let strVal = String(val).trim();
        if (strVal === "" || strVal === "undefined" || strVal === "null") return null;
        return strVal.split("T")[0];
    };

    // Helper para normalizar el estado
    const getEstado = (item) => {
        if (!item || item.estado === undefined || item.estado === null) return "Cola";
        let est = Array.isArray(item.estado) ? item.estado[0] : item.estado;
        if (typeof est === "object" && est.value) est = est.value;
        return String(est).trim();
    };

    // Helper para calcular % de un Subcurso
    const calcularProgresoSubcurso = (sub) => {
        if (sub.completado === true) return 100;
        const tareas = sub.file && sub.file.tasks ? sub.file.tasks : [];
        if (tareas.length > 0) {
            const completadas = tareas.where(t => t.completed).length;
            return Math.round((completadas / tareas.length) * 100);
        }
        const est = getEstado(sub).toLowerCase();
        if (est === "completado") return 100;
        if (est === "en proceso") return 50;
        return 0;
    };

    // Pre-calcular hijos, fechas y porcentajes de cada Padre
    const padresDatos = padres.map(padre => {
        const hijos = subcursos.where(s => {
            const nombresPadreEnHijo = extraerNombresPadre(s.cursoPadre);
            return nombresPadreEnHijo.some(nombre => nombre.toLowerCase() === padre.file.name.toLowerCase());
        });

        let pct = 0;
        if (hijos.length > 0) {
            const sumaPct = hijos.array().reduce((acc, h) => acc + calcularProgresoSubcurso(h), 0);
            pct = Math.round(sumaPct / hijos.length);
        } else {
            const est = getEstado(padre).toLowerCase();
            if (padre.completado === true || est === "completado") pct = 100;
        }

        let fInicio = formatearFecha(padre.fechaInicio || padre["fecha-inicio"]);
        let fFin = formatearFecha(padre.fechaFin || padre["fecha-fin"]);

        if (!fInicio && hijos.length > 0) {
            const iniciosHijos = hijos.array()
                .map(h => formatearFecha(h.fechaInicio || h["fecha-inicio"]))
                .filter(Boolean)
                .sort();
            if (iniciosHijos.length > 0) fInicio = iniciosHijos[0];
        }

        if (!fFin && hijos.length > 0) {
            const finesHijos = hijos.array()
                .map(h => formatearFecha(h.fechaFin || h["fecha-fin"]))
                .filter(Boolean)
                .sort();
            if (finesHijos.length > 0 && pct === 100) fFin = finesHijos[finesHijos.length - 1];
        }

        return { 
            padre, 
            hijos, 
            pct, 
            fInicio: fInicio || "—", 
            fFin: fFin || (pct === 100 ? "Finalizado" : "En curso"),
            fFinRaw: fFin 
        };
    });

    // --- 1. METRICAS GENERALES (KPIS) ---
    const totalPadres = padres.length;
    const totalSubcursos = subcursos.length;
    
    const subCompletados = subcursos.where(s => s.completado === true || getEstado(s).toLowerCase() === "completado" || calcularProgresoSubcurso(s) === 100).length;
    const padresCompletados = padresDatos.filter(p => p.pct === 100).length;
    const totalFinalizados = subCompletados + padresCompletados;
    const subEnProceso = subcursos.where(s => getEstado(s).toLowerCase() === "en proceso").length;

    const kpiGrid = mainContainer.createEl("div", {
        attr: { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;" }
    });

    const crearKPI = (label, valor, color) => {
        const card = kpiGrid.createEl("div", {
            attr: { style: `background: var(--background-secondary); border-left: 4px solid ${color}; padding: 12px; border-radius: 6px;` }
        });
        card.createEl("div", { text: label, attr: { style: "font-size: 0.75em; color: var(--text-muted); font-weight: bold;" } });
        card.createEl("div", { text: String(valor), attr: { style: "font-size: 1.4em; font-weight: bold; margin-top: 4px;" } });
    };

    crearKPI("🏆 Cursos Principales", totalPadres, "#61afef");
    crearKPI("📖 Subcursos Totales", totalSubcursos, "#e5c07b");
    crearKPI("⚡ En Proceso", subEnProceso, "#d19a66");
    crearKPI("🟢 Finalizados", totalFinalizados, "#98c379");

    // --- 2. VISTA DE PROGRAMAS PRINCIPALES (SEPARADOS EN 2 SECCIONES) ---
    mainContainer.createEl("h3", { text: "📚 Programas Principales", attr: { style: "margin: 10px 0 0 0; font-size: 1.2em;" } });

    const crearTarjetaPadre = (container, { padre, hijos, pct, fInicio, fFin }) => {
        const card = container.createEl("div", {
            attr: { style: "background: var(--background-secondary); border: 1px solid var(--background-modifier-border); padding: 16px; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between;" }
        });

        const plataformaStr = Array.isArray(padre.plataforma) ? padre.plataforma.join(", ") : (padre.plataforma || "Online");
        
        const topDiv = card.createEl("div");
        topDiv.createEl("div", { text: plataformaStr, attr: { style: "font-size: 0.7em; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: bold;" } });
        
        const titleEl = topDiv.createEl("h4", { attr: { style: "margin: 4px 0 8px 0; font-size: 1.05em;" } });
        const linkA = titleEl.createEl("a", { text: padre.file.name, cls: "internal-link" });
        linkA.dataset.href = padre.file.path;
        linkA.href = padre.file.path;

        const metaDiv = topDiv.createEl("div", { attr: { style: "font-size: 0.8em; color: var(--text-muted); margin-bottom: 8px;" } });
        const relTesis = Array.isArray(padre["relevancia-tesis"]) ? padre["relevancia-tesis"][0] : (padre["relevancia-tesis"] || "—");
        metaDiv.innerHTML = `🎓 Tesis: <b>${relTesis}</b> | 🧩 Subcursos: <b>${hijos.length}</b>`;

        const fechasDiv = topDiv.createEl("div", { attr: { style: "font-size: 0.78em; background: var(--background-primary); padding: 6px 8px; border-radius: 4px; margin-bottom: 12px; color: var(--text-muted); display: flex; justify-content: space-between;" } });
        fechasDiv.innerHTML = `<span>📅 <b>Inicio:</b> ${fInicio}</span><span>🏁 <b>Fin:</b> ${fFin}</span>`;

        const progressBg = card.createEl("div", {
            attr: { style: "background: var(--background-primary); border-radius: 4px; height: 8px; width: 100%; overflow: hidden; margin: 6px 0;" }
        });
        progressBg.createEl("div", {
            attr: { style: `background: ${pct === 100 ? '#98c379' : '#61afef'}; height: 100%; width: ${pct}%; transition: width 0.3s;` }
        });

        card.createEl("div", { text: `${pct}% completado`, attr: { style: "font-size: 0.75em; color: var(--text-muted); text-align: right;" } });
    };

    const padresPorHacer = padresDatos.filter(p => p.pct < 100);
    const padresFinalizados = padresDatos
        .filter(p => p.pct === 100)
        .sort((a, b) => {
            if (!a.fFinRaw && !b.fFinRaw) return 0;
            if (!a.fFinRaw) return 1;
            if (!b.fFinRaw) return -1;
            return b.fFinRaw.localeCompare(a.fFinRaw);
        });

    mainContainer.createEl("h4", { text: "⏳ Cursos en Curso / Pendientes", attr: { style: "margin: 5px 0 0 0; font-size: 0.95em; color: var(--text-muted);" } });
    if (padresPorHacer.length === 0) {
        mainContainer.createEl("p", { text: "🎉 ¡No tienes cursos pendientes por hacer!", attr: { style: "color: var(--text-muted); font-size: 0.85em;" } });
    } else {
        const gridPorHacer = mainContainer.createEl("div", {
            attr: { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;" }
        });
        padresPorHacer.forEach(p => crearTarjetaPadre(gridPorHacer, p));
    }

    mainContainer.createEl("h4", { text: "🟢 Cursos Finalizados", attr: { style: "margin: 15px 0 0 0; font-size: 0.95em; color: var(--text-muted);" } });
    if (padresFinalizados.length === 0) {
        mainContainer.createEl("p", { text: "Aún no has completado ningún programa principal.", attr: { style: "color: var(--text-muted); font-size: 0.85em;" } });
    } else {
        const gridFinalizados = mainContainer.createEl("div", {
            attr: { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;" }
        });
        padresFinalizados.forEach(p => crearTarjetaPadre(gridFinalizados, p));
    }

    // --- 3. TABLA DE SUBCURSOS (ORDENADA POR PROGRESO DE MENOR A MAYOR) ---
    mainContainer.createEl("h3", { text: "📖 Catálogo de Subcursos", attr: { style: "margin: 20px 0 0 0; font-size: 1.1em;" } });

    if (subcursos.length === 0) {
        mainContainer.createEl("p", { text: "No se encontraron notas con `tipo: Subcurso` en la carpeta `01Cursos`.", attr: { style: "color: var(--text-muted);" } });
    } else {
        // Ordenar subcursos por su porcentaje de progreso de menor a mayor (0% arriba, 100% abajo)
        const subcursosOrdenados = subcursos.array().sort((a, b) => {
            const pctA = calcularProgresoSubcurso(a);
            const pctB = calcularProgresoSubcurso(b);
            return pctA - pctB; 
        });

        const tablaContainer = mainContainer.createEl("div");
        const filasSub = subcursosOrdenados.map(s => {
            const pct = calcularProgresoSubcurso(s);
            const padresDetectados = extraerNombresPadre(s.cursoPadre);
            const pNombre = padresDetectados.length > 0 ? padresDetectados.join(", ") : "—";
            const fechaStr = formatearFecha(s.fechaInicio || s["fecha-inicio"]) || "—";

            return [
                dataview.fileLink(s.file.path, false, s.file.name),
                pNombre,
                fechaStr,
                getEstado(s),
                `${pct}%`
            ];
        });

        await dataview.table(["Subcurso", "Curso Padre", "Fecha Inicio", "Estado", "Progreso Tareas"], filasSub, tablaContainer);

        // Aplicar el estilo de fondo verde transparente a las filas con 100% de progreso
        setTimeout(() => {
            const trs = tablaContainer.querySelectorAll("tbody tr");
            trs.forEach(tr => {
                const lastTd = tr.querySelector("td:last-child");
                if (lastTd && lastTd.textContent.trim() === "100%") {
                    tr.style.backgroundColor = "rgba(152, 195, 121, 0.15)";
                }
            });
        }, 50);
    }
}

module.exports = { renderizarDashboardCursos };