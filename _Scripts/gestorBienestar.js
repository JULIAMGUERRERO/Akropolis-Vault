// Script independiente de Bienestar: Energía/Sueño + Dona de Ánimo con Tooltip de Conteo y Porcentaje
function renderizarBienestar(containerGlobal, opciones = {}) {
    const RUTAS_DIARIO = '"00Diario"';
    
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

    // Paleta de colores atractiva
    const PALETA_COLORES = [
        '#61afef', '#98c379', '#e5c07b', '#e06c75', 
        '#c678dd', '#56b6c2', '#d19a66', '#bb60ea'
    ];

    // 2. Función Principal de Renderizado
    function renderizarGraficos() {
        let wrappers = containerGlobal.querySelector("#bienestar-wrappers");
        if (!wrappers) {
            wrappers = containerGlobal.createEl("div", { attr: { id: "bienestar-wrappers" } });
        } else {
            wrappers.empty();
        }

        const { inicio, fin } = obtenerRangoFechas();

        // Estructuras de datos
        const etiquetasFechas = [];
        const datosEnergia = {};
        const datosSueno = {};
        const conteoAnimo = {};

        let cursor = inicio;
        while (cursor <= fin) {
            const fStr = cursor.toFormat("yyyy-MM-dd");
            etiquetasFechas.push(fStr);
            datosEnergia[fStr] = null;
            datosSueno[fStr] = null;
            cursor = cursor.plus({ days: 1 });
        }

        // Leer datos YAML del Diario
        const paginasDiario = dv.pages(RUTAS_DIARIO);

        paginasDiario.forEach(p => {
            const nombreArchivo = p.file.name;
            if (datosEnergia.hasOwnProperty(nombreArchivo)) {
                // A) Energía y Sueño
                if (p.energia !== undefined && p.energia !== null) {
                    datosEnergia[nombreArchivo] = Number(p.energia);
                }
                if (p.horas_sueno !== undefined && p.horas_sueno !== null) {
                    datosSueno[nombreArchivo] = Number(p.horas_sueno);
                }

                // B) Estado de Ánimo
                if (p.animo) {
                    const listaAnimos = Array.isArray(p.animo) ? p.animo : [p.animo];
                    listaAnimos.forEach(a => {
                        const animoLimpio = String(a).trim();
                        if (animoLimpio) {
                            conteoAnimo[animoLimpio] = (conteoAnimo[animoLimpio] || 0) + 1;
                        }
                    });
                }
            }
        });

        const textoOpcion = opcionesTiempo.find(o => o.value === window.filtroGraficoTiempo)?.text || "";

        // --- RENDER 1: GRÁFICO DE LÍNEAS (ENERGÍA VS SUEÑO) ---
        const chart1Container = wrappers.createEl("div", { attr: { style: "margin-bottom: 35px;" } });
        const arrEnergia = etiquetasFechas.map(f => datosEnergia[f]);
        const arrSueno = etiquetasFechas.map(f => datosSueno[f]);

        const chartLineasData = {
            type: 'line',
            data: {
                labels: etiquetasFechas,
                datasets: [
                    {
                        label: '⚡ Nivel de Energía (1-10)',
                        data: arrEnergia,
                        borderColor: '#e5c07b',
                        backgroundColor: 'rgba(229, 192, 123, 0.2)',
                        yAxisID: 'yEnergia',
                        tension: 0.3,
                        spanGaps: true,
                        pointRadius: 4
                    },
                    {
                        label: '😴 Horas de Sueño',
                        data: arrSueno,
                        borderColor: '#c678dd',
                        backgroundColor: 'rgba(198, 120, 221, 0.2)',
                        yAxisID: 'ySueno',
                        tension: 0.3,
                        spanGaps: true,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: `⚡ Registro de Energía vs. 😴 Horas de Sueño (${textoOpcion})` }
                },
                scales: {
                    yEnergia: {
                        type: 'linear', display: true, position: 'left',
                        title: { display: true, text: 'Energía' },
                        min: 0, max: 10, ticks: { precision: 0 }
                    },
                    ySueno: {
                        type: 'linear', display: true, position: 'right',
                        title: { display: true, text: 'Horas Sueño' },
                        min: 0, max: 12, grid: { drawOnChartArea: false },
                        ticks: { precision: 1 }
                    }
                }
            }
        };
        window.renderChart(chartLineasData, chart1Container);

// --- RENDER 2: GRÁFICO DE DONA (MÁS PEQUEÑA) ---
        const chart2Container = wrappers.createEl("div", { 
            attr: { style: "max-width: 380px; margin: 0 auto;" } // Reducido de 580px a 380px para hacerla compacta
        });

        const labelsAnimo = Object.keys(conteoAnimo);
        const dataAnimo = Object.values(conteoAnimo);
        const totalRegistros = dataAnimo.reduce((a, b) => a + b, 0);

        if (labelsAnimo.length > 0) {
            const chartDoughnutData = {
                type: 'doughnut',
                data: {
                    labels: labelsAnimo,
                    datasets: [{
                        data: dataAnimo,
                        backgroundColor: PALETA_COLORES.slice(0, labelsAnimo.length),
                        borderColor: 'transparent',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '60%', // Ajuste para mantener una dona bien equilibrada en tamaño pequeño
                    plugins: {
                        title: { 
                            display: true, 
                            text: `🧠 Distribución de Estado de Ánimo (${textoOpcion})` 
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12,
                                padding: 10,
                                font: { size: 11 } // Texto ligeramente más fino para encajar mejor
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const valor = context.raw || 0;
                                    const porcentaje = totalRegistros > 0 
                                        ? ((valor / totalRegistros) * 100).toFixed(1) 
                                        : 0;
                                    const etiqueta = context.label || '';
                                    return ` ${etiqueta}: ${valor} ${valor === 1 ? 'vez' : 'veces'} (${porcentaje}%)`;
                                }
                            }
                        }
                    }
                }
            };
            window.renderChart(chartDoughnutData, chart2Container);
        } else {
            chart2Container.createEl("p", { 
                text: "No hay registros de estado de ánimo para este periodo.",
                attr: { style: "text-align: center; color: var(--text-muted); font-style: italic;" }
            });
        }
    }

    // 3. Interfaz del Submenú UI
    const controlDiv = containerGlobal.createEl("div", { 
        attr: { style: "margin-bottom: 20px; padding: 12px; background: var(--background-secondary); border-radius: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;" } 
    });

    controlDiv.createEl("label", { 
        text: "📊 Rango Temporal (Eje X):", 
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
        renderizarGraficos();
    });

    // Render inicial
    renderizarGraficos();
}

module.exports = { renderizarBienestar };