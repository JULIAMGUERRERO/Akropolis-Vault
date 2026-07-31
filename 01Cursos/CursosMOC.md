```dataviewjs
const scriptContent = await app.vault.adapter.read("_Scripts/gestorCursos.js");

const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);

const { renderizarDashboardCursos } = module.exports;
await renderizarDashboardCursos(this.container, dv);
```
