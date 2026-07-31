# 📈 Panel de Rendimiento y Flujo de Trabajo

*Visión consolidada del balance semanal y la evolución diaria de tareas. Permite analizar patrones de carga de trabajo, detectar días de mayor productividad y dar seguimiento al ritmo de resolución.*

```dataviewjs
const scriptContent = await app.vault.adapter.read("_Scripts/tablaTareas/gestorEstadistica.js");
const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);

const { renderizarEstadisticas } = module.exports;
renderizarEstadisticas(this.container);
```

---
# 🔋 Métricas de Energía y Balance Mental

*Análisis correlativo entre horas de sueño y nivel de energía junto a la distribución de estados de ánimo. Utiliza esta sección para evaluar tu recuperación física y mantener un estado mental enfocado y sostenible.*

```dataviewjs
const scriptContent = await app.vault.adapter.read("_Scripts/gestorBienestar.js");
const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);

const { renderizarBienestar } = module.exports;
renderizarBienestar(this.container);
```
