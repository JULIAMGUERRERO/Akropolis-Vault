async function renderizarBiometria(containerElement, dvRef) {
    const dataview = dvRef || dv;

    if (!dataview) {
        console.error("Dataview no está disponible.");
        return;
    }

    // Cargar Chart.js si no está cargado
    if (typeof Chart === "undefined") {
        await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/chart.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("No se pudo cargar Chart.js"));
            document.head.appendChild(script);
        });
    }

    // Obtener páginas del diario
    const paginas = dataview.pages('"00Diario"')
        .where(p => p.tipo === "diario" && p.file && p.file.name.match(/^\d{4}-\d{2}-\d{2}$/))
        .sort(p => p.file.name, 'asc');

    const mapaNotas = {};
    paginas.forEach(p => { mapaNotas[p.file.name] = p; });

    // Limpiar el contenedor antes de renderizar
    containerElement.empty();

    // Contenedor principal
    const containerGlobal = containerElement.createEl("div", {
        attr: { style: "display: flex; flex-direction: column; gap: 15px;" }
    });

    // --- ENCABEZADO Y SELECTOR DE RANGO ---
    const topBar = containerGlobal.createEl("div", {
        attr: { style: "display: flex; justify-content: space-between; align-items: center; background: var(--background-secondary); padding: 12px 16px; border-radius: 8px;" }
    });

    const titleGroup = topBar.createEl("div");
    titleGroup.createEl("h3", { text: "🧬 Biometría & Rendimiento Integral", attr: { style: "margin: 0; font-size: 1.1em; font-weight: bold;" } });
    titleGroup.createEl("p", { text: "Correlación entre carga física, evolución de peso y descanso.", attr: { style: "margin: 2px 0 0 0; color: var(--text-muted); font-size: 0.8em;" } });

    const selectorGroup = topBar.createEl("div", { attr: { style: "display: flex; align-items: center; gap: 8px;" } });
    selectorGroup.createEl("span", { text: "📊 Rango:", attr: { style: "font-size: 0.85em; font-weight: bold; color: var(--text-muted);" } });

    const selectRango = selectorGroup.createEl("select", {
        attr: { style: "background: var(--background-primary); color: var(--text-normal); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 4px 8px; font-size: 0.85em; cursor: pointer;" }
    });

    const opciones = [
        { val: "7", label: "⚡ Últimos 7 Días" },
        { val: "14", label: "🗓️ Últimos 14 Días" },
        { val: "30", label: "📅 Últimos 30 Días" },
        { val: "mes", label: "📅 Este Mes" },
        { val: "90", label: "🗓️ Últimos 3 Meses" },
        { val: "180", label: "📅 Últimos 6 Meses" }
    ];

    opciones.forEach(opt => {
        const option = selectRango.createEl("option", { text: opt.label, value: opt.val });
        if (opt.val === "7") option.selected = true; // Por defecto 7 días
    });

    const chartsContainer = containerGlobal.createEl("div", {
        attr: { style: "display: flex; flex-direction: column; gap: 20px;" }
    });

    // Variables globales para destruir instancias de Chart.js
    let chartInstance1 = null;
    let chartInstance2 = null;

    // Función auxiliar para generar un rango de fechas completas (ISO YYYY-MM-DD)
    function generarFechasRango(rango) {
        const hoy = new Date();
        const fechas = [];
        let numDias = 7;

        if (rango === "mes") {
            const anio = hoy.getFullYear();
            const mes = hoy.getMonth();
            const diasEnMes = new Date(anio, mes + 1, 0).getDate();
            for (let i = 1; i <= diasEnMes; i++) {
                const fStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                fechas.push(fStr);
            }
            return fechas;
        } else {
            numDias = parseInt(rango, 10);
        }

        for (let i = numDias - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(hoy.getDate() - i);
            const fStr = d.toISOString().split("T")[0];
            fechas.push(fStr);
        }
        return fechas;
    }

    function actualizarGraficos(rangoSeleccionado) {
        // 1. Destruir gráficos anteriores para liberar la GPU / canvas
        if (chartInstance1) chartInstance1.destroy();
        if (chartInstance2) chartInstance2.destroy();

        chartsContainer.empty();

        // 2. Generar eje X basado en el rango real seleccionado
        const fechasFiltradas = generarFechasRango(rangoSeleccionado);

        const labelsFechas = fechasFiltradas.map(f => {
            const parts = f.split("-");
            return `${parts[2]}/${parts[1]}`;
        });

        // ==========================================
        // 1. GRÁFICO 1: CARGA DE ENTRENAMIENTO VS PESO
        // ==========================================
        const chartWrapper1 = chartsContainer.createEl("div", { 
            attr: { style: "background: var(--background-secondary); padding: 16px; border-radius: 8px;" } 
        });
        chartWrapper1.createEl("h4", { text: "🏋️ Carga de Entrenamiento vs. Peso Corporal", attr: { style: "margin: 0 0 12px 0; font-size: 0.95em; color: var(--text-muted);" } });
        const canvas1 = chartWrapper1.createEl("canvas", { attr: { height: "90" } });

        const datosCarga = fechasFiltradas.map(f => {
            const p = mapaNotas[f];
            if (!p) return 0;
            const calcCarga = (min, int) => {
                const m = parseFloat(min) || 0;
                const factor = int === "Alta" ? 2 : (int === "Media" ? 1.5 : 1);
                return m * factor;
            };
            return calcCarga(p.s1_minutos, p.s1_intensidad) + (p.s2_activa ? calcCarga(p.s2_minutos, p.s2_intensidad) : 0);
        });

        const datosPeso = fechasFiltradas.map(f => {
            const p = mapaNotas[f];
            return p && p.peso ? parseFloat(p.peso) : null;
        });

        chartInstance1 = new Chart(canvas1.getContext("2d"), {
            type: "bar",
            data: {
                labels: labelsFechas,
                datasets: [
                    {
                        label: "Carga (Min × Intensidad)",
                        data: datosCarga,
                        backgroundColor: "rgba(97, 175, 239, 0.6)",
                        borderColor: "#61afef",
                        borderWidth: 1,
                        yAxisID: "yCarga",
                        borderRadius: 4
                    },
                    {
                        label: "Peso (kg)",
                        data: datosPeso,
                        type: "line",
                        borderColor: "#e5c07b",
                        backgroundColor: "#e5c07b",
                        borderWidth: 2.5,
                        tension: 0.3,
                        pointRadius: 4,
                        spanGaps: true,
                        yAxisID: "yPeso"
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    yCarga: { type: "linear", position: "left", title: { display: true, text: "Carga (Pts)", color: "#61afef" }, grid: { color: "rgba(255, 255, 255, 0.05)" } },
                    yPeso: { type: "linear", position: "right", title: { display: true, text: "Peso (kg)", color: "#e5c07b" }, grid: { drawOnChartArea: false } }
                }
            }
        });

        // ==========================================
        // 2. GRÁFICO 2: MATRIZ DE VITALIDAD & RECUPERACIÓN
        // ==========================================
        const chartWrapper2 = chartsContainer.createEl("div", { 
            attr: { style: "background: var(--background-secondary); padding: 16px; border-radius: 8px;" } 
        });
        chartWrapper2.createEl("h4", { text: "🔋 Vitalidad & Recuperación (Sueño vs. Energía)", attr: { style: "margin: 0 0 12px 0; font-size: 0.95em; color: var(--text-muted);" } });
        const canvas2 = chartWrapper2.createEl("canvas", { attr: { height: "90" } });

        const datosSueno = fechasFiltradas.map(f => {
            const p = mapaNotas[f];
            return p && p.horas_sueno ? parseFloat(String(p.horas_sueno).replace(",", ".")) : null;
        });

        const datosEnergia = fechasFiltradas.map(f => {
            const p = mapaNotas[f];
            return p && p.energia ? parseFloat(p.energia) : null;
        });

        chartInstance2 = new Chart(canvas2.getContext("2d"), {
            type: "line",
            data: {
                labels: labelsFechas,
                datasets: [
                    {
                        label: "Horas de Sueño",
                        data: datosSueno,
                        borderColor: "#98c379",
                        backgroundColor: "rgba(152, 195, 121, 0.15)",
                        fill: true,
                        tension: 0.3,
                        spanGaps: true,
                        yAxisID: "ySueno"
                    },
                    {
                        label: "Energía (1-10)",
                        data: datosEnergia,
                        borderColor: "#e06c75",
                        borderDash: [5, 5],
                        tension: 0.3,
                        pointStyle: "rectRot",
                        pointRadius: 5,
                        spanGaps: true,
                        yAxisID: "yEnergia"
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    ySueno: { type: "linear", position: "left", title: { display: true, text: "Sueño (Horas)", color: "#98c379" }, grid: { color: "rgba(255, 255, 255, 0.05)" } },
                    yEnergia: { type: "linear", position: "right", min: 0, max: 10, title: { display: true, text: "Energía (1-10)", color: "#e06c75" }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    // Render inicial
    actualizarGraficos(selectRango.value);

    // Event listener para actualizar al cambiar de opción
    selectRango.addEventListener("change", (e) => {
        actualizarGraficos(e.target.value);
    });
}

module.exports = { renderizarBiometria };