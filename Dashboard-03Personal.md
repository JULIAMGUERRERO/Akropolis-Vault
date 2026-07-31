# Deporte & Fitness

*Análisis integral de hábitos, volumen de entrenamiento y balance de descansos.*

```dataviewjs
const scriptContent = await app.vault.adapter.read("_Scripts/gestorDeporte.js");
const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);

const { renderizarDeporte } = module.exports;
renderizarDeporte(this.container);
```

---
# 🧬 Rendimiento Integral

```dataviewjs
// 1. Cargar el script externo desde _Scripts
const scriptContent = await app.vault.adapter.read("_Scripts/gestorDeportePeso_Energia_Intensdiad.js");

// 2. Crear módulo y evaluar el código pasando 'dv' como parámetro explícito
const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);

// 3. Renderizar la biometría
const { renderizarBiometria } = module.exports;
if (renderizarBiometria) {
    await renderizarBiometria(this.container, dv);
} else {
    dv.paragraph("❌ No se encontró la función 'renderizarBiometria' en el módulo.");
}
```


