# 🗺️ MOC Cursos: Mapa de Contenido
*Panel centralizado y mapa de navegación para la gestión de programas académicos y subcursos. Monitorea el avance de tus tareas, prioriza módulos pendientes y consulta el historial de formación completada.*

```dataviewjs
const scriptContent = await app.vault.adapter.read("_Scripts/gestorCursos.js");

const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);

const { renderizarDashboardCursos } = module.exports;
await renderizarDashboardCursos(this.container, dv);
```

# 📊 Evolucion Acumulativa de Aprendizaje
*Mapa de evolución personal: mide tu ritmo de estudio, mantén el impulso y observa cómo se acumula tu conocimiento día a día.*

```dataviewjs
const content = await app.vault.adapter.read("_Scripts/gestorCursosGraficos.js");
const module = { exports: {} };
new Function("module", "exports", content)(module, module.exports);
await module.exports.renderizarGraficaProgreso(this.container, dv);
```
