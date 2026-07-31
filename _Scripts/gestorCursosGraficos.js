async function renderizarGraficaProgreso(containerElement, dvRef) {
    const dataview = dvRef || dv;
    if (!dataview) return;

    containerElement.empty();

    const mainContainer = containerElement.createEl("div", {
        attr: { style: "background: var(--background-secondary); border: 1px solid var(--background-modifier-border); padding: 18px; border-radius: 8px; margin-bottom: 20px;" }
    });

    // Cargar Chart.js dinámicamente si no existe en la ventana global
    if (typeof Chart === "undefined") {
        await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Cabecera y Botones de Filtro
    const headerDiv = mainContainer.createEl("div", {
        attr: { style: "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;" }
    });
    
    headerDiv.createEl("h3", { text: "📈 Evolución Acumulativa de Aprendizaje", attr: { style: "margin: 0; font-size: 1.1em;" } });

    const btnContainer = headerDiv.createEl("div", {
        attr: { style: "display: flex; gap: 6px; flex-wrap: wrap;" }
    });

    // Cargar páginas de "01Cursos"
    const paginas = dataview.pages('"01Cursos"').where(p => !p.file.path.includes("_Plantillas"));
    
    const formatearFecha = (val) => {
        if (!val) return null;
        if (typeof val === "object") {
            if (val.toISODate) return val.toISODate();
            if (val.ts) {
                const d = new Date(val.ts);
                return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
            }
        }
        let strVal = String(val).trim();
        return (strVal === "" || strVal === "undefined" || strVal === "null") ? null : strVal.split("T")[0];
    };

    const eventosFinalizados = [];
    paginas.forEach(p => {
        const completado = p.completado === true || String(p.estado || "").toLowerCase() === "completado";
        const fFin = formatearFecha(p.fechaFin || p["fecha-fin"]);

        if (completado && fFin) {
            eventosFinalizados.push({
                nombre: p.file.name,
                fechaStr: fFin,
                fechaObj: new Date(fFin + "T00:00:00")
            });
        }
    });

    eventosFinalizados.sort((a, b) => a.fechaObj - b.fechaObj);

    // Canvas contenedor
    const canvasWrapper = mainContainer.createEl("div", { attr: { style: "position: relative; height: 320px; width: 100%;" } });
    const canvas = canvasWrapper.createEl("canvas");
    let chartInstance = null;

    const actualizarGrafico = (rangoDias) => {
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);

        let fechaLimite = null;
        if (rangoDias === "mes") fechaLimite = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        else if (typeof rangoDias === "number") {
            fechaLimite = new Date();
            fechaLimite.setDate(hoy.getDate() - rangoDias);
        }

        let acumuladoInicial = 0;
        const eventosFiltrados = [];

        eventosFinalizados.forEach(ev => {
            if (fechaLimite && ev.fechaObj < fechaLimite) acumuladoInicial++;
            else if (!fechaLimite || (ev.fechaObj >= fechaLimite && ev.fechaObj <= hoy)) eventosFiltrados.push(ev);
        });

        const datosPorFecha = {};
        eventosFiltrados.forEach(ev => {
            if (!datosPorFecha[ev.fechaStr]) datosPorFecha[ev.fechaStr] = [];
            datosPorFecha[ev.fechaStr].push(ev.nombre);
        });

        const labels = [];
        const dataPoints = [];
        const mapaCursosDia = [];
        let contador = acumuladoInicial;

        Object.keys(datosPorFecha).forEach(fecha => {
            contador += datosPorFecha[fecha].length;
            labels.push(fecha);
            dataPoints.push(contador);
            mapaCursosDia.push(datosPorFecha[fecha]);
        });

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(canvas, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Cursos Completados",
                    data: dataPoints,
                    borderColor: "#98c379",
                    backgroundColor: "rgba(152, 195, 121, 0.15)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.2,
                    pointRadius: 6,
                    pointHoverRadius: 9,
                    pointBackgroundColor: "#61afef",
                    cursosDelDia: mapaCursosDia
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: "Fecha de Finalización", color: "var(--text-muted)", font: { size: 11 } },
                        grid: { color: "rgba(255, 255, 255, 0.05)" },
                        ticks: { color: "var(--text-muted)" }
                    },
                    y: {
                        title: { display: true, text: "Cursos / Subcursos Acumulados", color: "var(--text-muted)", font: { size: 11 } },
                        beginAtZero: true,
                        stepSize: 1,
                        grid: { color: "rgba(255, 255, 255, 0.05)" },
                        ticks: { color: "var(--text-muted)", precision: 0 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => {
                                const item = tooltipItems[0];
                                const fecha = item.label;
                                const cursos = item.dataset.cursosDelDia[item.dataIndex] || [];
                                return [fecha, ...cursos.map(c => `• ${c}`)];
                            },
                            label: (context) => ` Total acumulado: ${context.parsed.y}`
                        }
                    }
                }
            }
        });
    };

    // Botones de filtro
    const opcionesFiltro = [
        { label: "Este Mes", val: "mes" },
        { label: "3 Meses", val: 90 },
        { label: "6 Meses", val: 180 },
        { label: "1 Año", val: 365 },
        { label: "Histórico Total", val: "all" }
    ];

    opcionesFiltro.forEach((f, idx) => {
        const btn = btnContainer.createEl("button", { text: f.label });
        btn.style.cssText = "padding: 4px 10px; font-size: 0.75em; border-radius: 4px; border: 1px solid var(--background-modifier-border); cursor: pointer; background: var(--background-primary); color: var(--text-normal);";

        btn.onclick = () => {
            Array.from(btnContainer.children).forEach(b => {
                b.style.background = "var(--background-primary)";
                b.style.color = "var(--text-normal)";
            });
            btn.style.background = "#61afef";
            btn.style.color = "#ffffff";
            actualizarGrafico(f.val);
        };

        if (idx === 4) {
            btn.style.background = "#61afef";
            btn.style.color = "#ffffff";
        }
    });

    actualizarGrafico("all");
}

module.exports = { renderizarGraficaProgreso };