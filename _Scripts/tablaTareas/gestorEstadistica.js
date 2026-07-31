// Script independiente para renderizar el Dashboard de Tareas (Barras + Líneas)
function renderizarEstadisticas(containerGlobal, opciones = {}) {
    const RUTAS = '"00Diario" or "01Cursos"';
    const TAGS_OBJETIVO = ["#pendiente", "#duda", "#tarea"];

    if (typeof window.filtroGraficoTiempo === "undefined") {
        window.filtroGraficoTiempo = "30_DIAS";
    }

    containerGlobal.empty();

    // 1. Módulo de Rangos de Fechas
    function obtenerRangoFechas() {
        const hoy = dv.date("today");
        let inicio = hoy.minus({ days: 30 });

        const modo = window.filtroGraficoTiempo;
        if (modo === "7_DIAS") inicio = hoy.minus({ days: 7 });
        else if (modo === "14_DIAS") inicio = hoy.minus({ days: 14 });
        else if (modo === "30_DIAS") inicio = hoy.minus({ days: 30 });
        else if (modo === "ESTE_MES") inicio = hoy.startOf("month");
        else if (modo === "TRIMESTRAL") inicio = hoy.minus({ months: 3 });
        else if (modo === "SEMESTRAL") inicio = hoy.minus({ months: 6 });

        return { inicio, fin: hoy };
    }

    // 2. Función Principal de Renderizado Sincronizado
    function renderizarGraficosSincronizados() {
        let wrappers = containerGlobal.querySelector("#dash-wrappers");
        if (!wrappers) {
            wrappers = containerGlobal.createEl("div", { attr: { id: "dash-wrappers" } });
        } else {
            wrappers.empty();
        }

        const { inicio, fin } = obtenerRangoFechas();

        // Estructuras de datos para ambos gráficos
        const etiquetasFechas = [];
        const creadasPorFecha = {};
        const resueltasPorFecha = {};
        const creadasPorDiaSemana = [0, 0, 0, 0, 0, 0, 0];
        const resueltasPorDiaSemana = [0, 0, 0, 0, 0, 0, 0];

        let cursor = inicio;
        while (cursor <= fin) {
            const fStr = cursor.toFormat("yyyy-MM-dd");
            etiquetasFechas.push(fStr);
            creadasPorFecha[fStr] = 0;
            resueltasPorFecha[fStr] = 0;
            cursor = cursor.plus({ days: 1 });
        }

        // Obtener y filtrar tareas
        const tareas = dv.pages(RUTAS).file.tasks.where(t => 
            TAGS_OBJETIVO.some(tag => t.tags.includes(tag))
        );

        tareas.forEach(t => {
            // A) Creación
            const matchCreacion = t.text.match(/(?:➕|\+)\s*(\d{4}-\d{2}-\d{2})/);
            if (matchCreacion) {
                const fC = matchCreacion[1];
                const dC = dv.date(fC);
                if (dC && creadasPorFecha[fC] !== undefined) {
                    creadasPorFecha[fC] += 1;
                    const idxSemana = dC.weekday - 1;
                    creadasPorDiaSemana[idxSemana] += 1;
                }
            }

            // B) Resolución
            if (t.completed) {
                const matchFin = t.text.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
                const matchFechaArchivo = t.link.path.match(/(\d{4}-\d{2}-\d{2})/);
                
                let fF = null;
                if (matchFin) {
                    fF = matchFin[1];
                } else if (t.completion) {
                    fF = dv.date(t.completion).toFormat("yyyy-MM-dd");
                } else if (matchFechaArchivo) {
                    fF = matchFechaArchivo[1];
                }

                if (fF && resueltasPorFecha[fF] !== undefined) {
                    const dF = dv.date(fF);
                    if (dF) {
                        resueltasPorFecha[fF] += 1;
                        const idxSemana = dF.weekday - 1;
                        resueltasPorDiaSemana[idxSemana] += 1;
                    }
                }
            }
        });

        const textoOpcion = opcionesTiempo.find(o => o.value === window.filtroGraficoTiempo)?.text || "";

        // --- 1. PRIMER GRÁFICO: BALANCE SEMANAL DE BARRAS ---
        const chart1Container = wrappers.createEl("div", { attr: { style: "margin-bottom: 35px;" } });
        const labelsDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

        const chartBarrasData = {
            type: 'bar',
            data: {
                labels: labelsDias,
                datasets: [
                    {
                        label: '➕ Tareas Creadas',
                        data: creadasPorDiaSemana,
                        backgroundColor: 'rgba(97, 175, 239, 0.8)',
                        borderColor: '#61afef',
                        borderWidth: 1
                    },
                    {
                        label: '✅ Tareas Resueltas',
                        data: resueltasPorDiaSemana,
                        backgroundColor: 'rgba(152, 195, 121, 0.8)',
                        borderColor: '#98c379',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: `📊 Balance Semanal Acumulado (${textoOpcion})` }
                },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        };
        window.renderChart(chartBarrasData, chart1Container);

        // --- 2. SEGUNDO GRÁFICO: LÍNEA DE TIEMPO CONTINUA ---
        const chart2Container = wrappers.createEl("div");
        const dataCreadas = etiquetasFechas.map(f => creadasPorFecha[f]);
        const dataResueltas = etiquetasFechas.map(f => resueltasPorFecha[f]);

        const chartLineasData = {
            type: 'line',
            data: {
                labels: etiquetasFechas,
                datasets: [
                    {
                        label: '➕ Tareas Creadas',
                        data: dataCreadas,
                        borderColor: '#61afef',
                        backgroundColor: 'rgba(97, 175, 239, 0.2)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 4
                    },
                    {
                        label: '✅ Tareas Resueltas',
                        data: dataResueltas,
                        borderColor: '#98c379',
                        backgroundColor: 'rgba(152, 195, 121, 0.2)',
                        fill: false,
                        tension: 0.2,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: `📈 Flujo Absoluto Diario (${textoOpcion})` }
                },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        };
        window.renderChart(chartLineasData, chart2Container);
    }

    // 3. Interfaz del Submenú Único (UI)
    const controlDiv = containerGlobal.createEl("div", { 
        attr: { style: "margin-bottom: 20px; padding: 12px; background: var(--background-secondary); border-radius: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;" } 
    });

    controlDiv.createEl("label", { 
        text: "📊 Rango Temporal Global:", 
        attr: { style: "font-weight: bold; font-size: 0.9em; color: var(--text-normal);" } 
    });

    const selectTiempo = controlDiv.createEl("select", {
        attr: { style: "padding: 5px 10px; border-radius: 5px; background: var(--background-primary); color: var(--text-normal); border: 1px solid var(--background-modifier-border);" }
    });

    const opcionesTiempo = [
        { value: "7_DIAS", text: "⚡ Últimos 7 Días" },
        { value: "14_DIAS", text: "🗓️ Últimos 14 Días" },
        { value: "30_DIAS", text: "📅 Últimos 30 Días" },
        { value: "ESTE_MES", text: "📅 Este Mes" },
        { value: "TRIMESTRAL", text: "🗓️ Últimos 3 Meses" },
        { value: "SEMESTRAL", text: "📅 Últimos 6 Meses" }
    ];

    opcionesTiempo.forEach(opt => {
        const optionEl = selectTiempo.createEl("option", { value: opt.value, text: opt.text });
        if (window.filtroGraficoTiempo === opt.value) optionEl.selected = true;
    });

    selectTiempo.addEventListener("change", (e) => {
        window.filtroGraficoTiempo = e.target.value;
        renderizarGraficosSincronizados();
    });

    // Primera ejecución
    renderizarGraficosSincronizados();
}

module.exports = { renderizarEstadisticas };