// Script independiente para el Dashboard de Deporte, Mapa Muscular, Disciplinas y Realidad Temporal
function renderizarDeporte(containerGlobal, opciones = {}) {
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

    const PALETA_COLORES = [
        '#61afef', '#98c379', '#e5c07b', '#e06c75', 
        '#c678dd', '#56b6c2', '#d19a66', '#bb60ea'
    ];

    // 2. Función Principal de Renderizado
    function renderizarGraficos() {
        let wrappers = containerGlobal.querySelector("#deporte-wrappers");
        if (!wrappers) {
            wrappers = containerGlobal.createEl("div", { attr: { id: "deporte-wrappers" } });
        } else {
            wrappers.empty();
        }

        const { inicio, fin } = obtenerRangoFechas();
        const conteoZonas = {};
        const conteoDeportes = {};
        let totalMinutos = 0;
        let diasEntrenados = 0;
        let doblesJornadas = 0;

        // Mapeo para cálculo de Rachas y Gráficos Temporales
        const registroDias = {}; // Almacena: 0 (No), 1 (Simple), 2 (Doble)

        const paginasDiario = dv.pages(RUTAS_DIARIO);

        paginasDiario.forEach(p => {
            const fechaNota = dv.date(p.file.name) || p.file.day;
            if (fechaNota) {
                const fStr = fechaNota.toFormat("yyyy-MM-dd");
                
                let nivelSesion = 0;
                if (p.ejercicio === true) {
                    nivelSesion = 1;
                    if (p.s2_activa === true) nivelSesion = 2;
                }
                registroDias[fStr] = nivelSesion;

                // Filtrar dentro del rango seleccionado
                if (fechaNota >= inicio && fechaNota <= fin) {
                    if (p.ejercicio === true) {
                        diasEntrenados++;

                        // --- Sesión 1 ---
                        if (p.s1_minutos) totalMinutos += Number(p.s1_minutos);
                        
                        if (p.s1_deporte) {
                            const dep = Array.isArray(p.s1_deporte) ? p.s1_deporte : [p.s1_deporte];
                            dep.forEach(d => {
                                const dL = String(d).trim();
                                if (dL) conteoDeportes[dL] = (conteoDeportes[dL] || 0) + 1;
                            });
                        }

                        if (p.s1_zona) {
                            const zonas = Array.isArray(p.s1_zona) ? p.s1_zona : [p.s1_zona];
                            zonas.forEach(z => {
                                const zLimpia = String(z).trim();
                                if (zLimpia) conteoZonas[zLimpia] = (conteoZonas[zLimpia] || 0) + 1;
                            });
                        }

                        // --- Sesión 2 (Doble Jornada) ---
                        if (p.s2_activa === true) {
                            doblesJornadas++;
                            if (p.s2_minutos) totalMinutos += Number(p.s2_minutos);
                            
                            if (p.s2_deporte) {
                                const dep2 = Array.isArray(p.s2_deporte) ? p.s2_deporte : [p.s2_deporte];
                                dep2.forEach(d => {
                                    const dL = String(d).trim();
                                    if (dL) conteoDeportes[dL] = (conteoDeportes[dL] || 0) + 1;
                                });
                            }

                            if (p.s2_zona) {
                                const zonas2 = Array.isArray(p.s2_zona) ? p.s2_zona : [p.s2_zona];
                                zonas2.forEach(z => {
                                    const zLimpia = String(z).trim();
                                    if (zLimpia) conteoZonas[zLimpia] = (conteoZonas[zLimpia] || 0) + 1;
                                });
                            }
                        }
                    }
                }
            }
        });

        // --- CÁLCULO DE DÍAS TOTALES E INACTIVOS ---
        const diasTotalesRango = Math.floor(fin.diff(inicio, 'days').days) + 1;
        const diasInactivos = Math.max(0, diasTotalesRango - diasEntrenados);
        const porcentajeConsistencia = ((diasEntrenados / diasTotalesRango) * 100).toFixed(1);

        // --- CÁLCULO DE RACHA ACTUAL ---
        let rachaActual = 0;
        let cursorRacha = dv.date("today");

        if (!registroDias[cursorRacha.toFormat("yyyy-MM-dd")]) {
            cursorRacha = cursorRacha.minus({ days: 1 });
        }

        while (registroDias[cursorRacha.toFormat("yyyy-MM-dd")] > 0) {
            rachaActual++;
            cursorRacha = cursorRacha.minus({ days: 1 });
        }

        const textoOpcion = opcionesTiempo.find(o => o.value === window.filtroGraficoTiempo)?.text || "";

        // --- TARJETAS KPI (Con Tooltips flotantes estilo Chart.js) ---
        const kpiDiv = wrappers.createEl("div", { 
            attr: { style: "display: flex; gap: 12px; margin-bottom: 25px; flex-wrap: wrap; position: relative;" } 
        });

        // Crear el contenedor del Tooltip flotante al estilo Chart.js
        let customTooltip = document.getElementById("kpi-custom-tooltip");
        if (!customTooltip) {
            customTooltip = document.createElement("div");
            customTooltip.id = "kpi-custom-tooltip";
            customTooltip.style.cssText = `
                position: absolute;
                display: none;
                background: rgba(0, 0, 0, 0.85);
                color: #fff;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.82em;
                font-weight: 500;
                pointer-events: none;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: opacity 0.15s ease, transform 0.15s ease;
                white-space: pre-line;
                text-align: center;
            `;
            document.body.appendChild(customTooltip);
        }

        function vincularTooltipKPI(elemento, texto) {
            elemento.addEventListener("mouseenter", (e) => {
                customTooltip.innerHTML = texto;
                customTooltip.style.display = "block";
                customTooltip.style.opacity = "1";
            });

            elemento.addEventListener("mousemove", (e) => {
                const x = e.clientX;
                const y = e.clientY;
                customTooltip.style.left = `${x + 12}px`;
                customTooltip.style.top = `${y - 35}px`;
            });

            elemento.addEventListener("mouseleave", () => {
                customTooltip.style.opacity = "0";
                customTooltip.style.display = "none";
            });
        }

        const txtActivos = "🏋️ Días Activos\nDías con al menos 1 sesión registrada.";
        const txtInactivos = "💤 Días Inactivos\nDías de descanso u 'off' sin entrenamiento.";
        const txtConsistencia = "📊 Consistencia\nPorcentaje de efectividad sobre el rango total.";
        const txtRacha = "🔥 Racha & ⚡ Dobles\nDías consecutivos activos y días con 2 sesiones.";

        // 1. Tarjeta Activos
        const cardActivos = kpiDiv.createEl("div", { 
            attr: { style: "flex: 1; min-width: 130px; background: var(--background-secondary); padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;" } 
        });
        vincularTooltipKPI(cardActivos, txtActivos);
        cardActivos.createEl("div", { text: "🏋️ Activos", attr: { style: "font-size: 0.85em; color: var(--text-muted); margin-bottom: 4px;" } });
        cardActivos.createEl("div", { text: `${diasEntrenados} ${diasEntrenados === 1 ? 'día' : 'días'}`, attr: { style: "font-size: 1.1em; font-weight: bold;" } });

        // 2. Tarjeta Inactivos
        const cardInactivos = kpiDiv.createEl("div", { 
            attr: { style: "flex: 1; min-width: 130px; background: rgba(224, 108, 117, 0.15); border: 1px solid rgba(224, 108, 117, 0.4); padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;" } 
        });
        vincularTooltipKPI(cardInactivos, txtInactivos);
        cardInactivos.createEl("div", { text: "💤 Inactivos", attr: { style: "font-size: 0.85em; color: #e06c75; margin-bottom: 4px;" } });
        cardInactivos.createEl("div", { text: `${diasInactivos} ${diasInactivos === 1 ? 'día' : 'días'}`, attr: { style: "font-size: 1.1em; font-weight: bold; color: #e06c75;" } });

        // 3. Tarjeta Consistencia
        const cardConsistencia = kpiDiv.createEl("div", { 
            attr: { style: "flex: 1; min-width: 130px; background: var(--background-secondary); padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;" } 
        });
        vincularTooltipKPI(cardConsistencia, txtConsistencia);
        cardConsistencia.createEl("div", { text: "📊 Consistencia", attr: { style: "font-size: 0.85em; color: var(--text-muted); margin-bottom: 4px;" } });
        cardConsistencia.createEl("div", { text: `${porcentajeConsistencia}%`, attr: { style: "font-size: 1.1em; font-weight: bold;" } });

        // 4. Tarjeta Racha y Dobles
        const cardRacha = kpiDiv.createEl("div", { 
            attr: { style: "flex: 1; min-width: 140px; background: var(--background-secondary); padding: 12px; border-radius: 8px; text-align: center; cursor: pointer;" } 
        });
        vincularTooltipKPI(cardRacha, txtRacha);
        cardRacha.createEl("div", { text: `🔥 Racha: ${rachaActual} ${rachaActual === 1 ? 'día' : 'días'}`, attr: { style: "font-size: 0.95em; font-weight: bold; margin-bottom: 2px;" } });
        cardRacha.createEl("div", { text: `⚡ Dobles: ${doblesJornadas} ${doblesJornadas === 1 ? 'día' : 'días'}`, attr: { style: "font-size: 0.85em; color: var(--text-muted);" } });
        // --- GRÁFICO 1: BARRAS DE CONSTANCIA DIARIA ---
        const timelineContainer = wrappers.createEl("div", { 
            attr: { style: "width: 100%; margin-bottom: 30px; background: var(--background-secondary); padding: 15px; border-radius: 8px;" } 
        });

        const labelsTimeline = [];
        const dataTimeline = [];
        const backgroundColorsTimeline = [];

        let cursorTimeline = inicio;
        while (cursorTimeline <= fin) {
            const fStr = cursorTimeline.toFormat("yyyy-MM-dd");
            const estado = registroDias[fStr] || 0;
            
            labelsTimeline.push(cursorTimeline.toFormat("dd MMM"));
            dataTimeline.push(estado);

            if (estado === 2) {
                backgroundColorsTimeline.push("#e06c75");
            } else if (estado === 1) {
                backgroundColorsTimeline.push("#98c379");
            } else {
                backgroundColorsTimeline.push("rgba(255, 255, 255, 0.05)");
            }

            cursorTimeline = cursorTimeline.plus({ days: 1 });
        }

        const chartTimelineData = {
            type: 'bar',
            data: {
                labels: labelsTimeline,
                datasets: [{
                    label: 'Nivel de Jornada',
                    data: dataTimeline,
                    backgroundColor: backgroundColorsTimeline,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 0,
                        max: 2,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => value === 2 ? '🔥 Doble' : value === 1 ? '✅ Simple' : '💤 Off'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' }
                    },
                    x: { grid: { display: false } }
                },
                plugins: {
                    title: { display: true, text: `📅 Constancia Temporal Día a Día (${textoOpcion})` },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const v = ctx.raw;
                                return v === 2 ? ' 🔥 Doble Jornada' : v === 1 ? ' ✅ Jornada Simple' : ' 💤 Sin Entrenamiento';
                            }
                        }
                    }
                }
            }
        };

        window.renderChart(chartTimelineData, timelineContainer);

        // Contenedor Flex para los dos gráficos circulares/radar
        const gridGraficos = wrappers.createEl("div", {
            attr: { style: "display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; align-items: center;" }
        });

        // --- GRÁFICO 2: MAPA RADAR MUSCULAR ---
        const chart1Container = gridGraficos.createEl("div", { 
            attr: { style: "flex: 1; min-width: 300px; max-width: 450px;" } 
        });

        const etiquetasZonas = Object.keys(conteoZonas);
        const valoresZonas = Object.values(conteoZonas);
        const totalImpactos = valoresZonas.reduce((a, b) => a + b, 0);
        const porcentajesZonas = valoresZonas.map(v => totalImpactos > 0 ? ((v / totalImpactos) * 100).toFixed(1) : 0);

        if (etiquetasZonas.length > 0) {
            const chartRadarData = {
                type: 'radar',
                data: {
                    labels: etiquetasZonas,
                    datasets: [{
                        label: '% Enfoque Muscular',
                        data: porcentajesZonas,
                        backgroundColor: 'rgba(97, 175, 239, 0.3)',
                        borderColor: '#61afef',
                        pointBackgroundColor: '#e5c07b',
                        pointBorderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: { display: true, text: `🧠 Enfoque Muscular (${textoOpcion})` },
                        tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}%` } }
                    },
                    scales: {
                        r: {
                            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { display: false }
                        }
                    }
                }
            };
            window.renderChart(chartRadarData, chart1Container);
        } else {
            chart1Container.createEl("p", { 
                text: "No hay registros de zonas musculares.",
                attr: { style: "text-align: center; color: var(--text-muted); font-style: italic;" }
            });
        }

        // --- GRÁFICO 3: DONA DE DEPORTES CON DÍAS Y PORCENTAJE DEL RANGO ---
        const chart2Container = gridGraficos.createEl("div", { 
            attr: { style: "flex: 1; min-width: 280px; max-width: 400px;" } 
        });

        // Construir datos absolutos agregando la porción "Sin Deporte / Off"
        const labelsDeportes = Object.keys(conteoDeportes);
        const dataDeportes = Object.values(conteoDeportes);
        const coloresDeportes = PALETA_COLORES.slice(0, labelsDeportes.length);

        // Si existen días inactivos dentro del rango, se agregan a la dona
        if (diasInactivos > 0) {
            labelsDeportes.push("Sin Deporte / Off");
            dataDeportes.push(diasInactivos);
            coloresDeportes.push("rgba(224, 108, 117, 0.35)"); // Color rojizo tenue para el tiempo inactivo
        }

        if (dataDeportes.length > 0) {
            const chartDoughnutData = {
                type: 'doughnut',
                data: {
                    labels: labelsDeportes,
                    datasets: [{
                        data: dataDeportes,
                        backgroundColor: coloresDeportes,
                        borderColor: 'transparent',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    cutout: '60%',
                    plugins: {
                        title: { display: true, text: `⚽ Disciplinas vs Tiempo (${textoOpcion})` },
                        legend: { position: 'right', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
                        tooltip: {
                            callbacks: {
                                label: function(ctx) {
                                    const dias = ctx.raw || 0;
                                    const pct = diasTotalesRango > 0 ? ((dias / diasTotalesRango) * 100).toFixed(1) : 0;
                                    return ` ${ctx.label}: ${dias} ${dias === 1 ? 'día' : 'días'} (${pct}% del rango)`;
                                }
                            }
                        }
                    }
                }
            };
            window.renderChart(chartDoughnutData, chart2Container);
        } else {
            chart2Container.createEl("p", { 
                text: "No hay datos registrados en el período.",
                attr: { style: "text-align: center; color: var(--text-muted); font-style: italic;" }
            });
        }
    }

    // 3. Interfaz del Submenú UI (Sin el texto Eje X)
    const controlDiv = containerGlobal.createEl("div", { 
        attr: { style: "margin-bottom: 20px; padding: 12px; background: var(--background-secondary); border-radius: 8px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;" } 
    });

    controlDiv.createEl("label", { 
        text: "📊 Rango Temporal:", 
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

module.exports = { renderizarDeporte };