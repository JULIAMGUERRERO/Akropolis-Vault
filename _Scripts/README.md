# ⚙️ _Scripts

**El motor de análisis de `Akropolis-Vault`.**

Esta carpeta contiene los scripts en **JavaScript** que procesan la información de tus notas (diario y cursos) y la transforman en las gráficas, tablas y métricas que ves en los **dashboards**. Cada script es un módulo independiente que expone una función principal, invocada desde los paneles mediante **DataviewJS**.

> [!info] Requisitos
> - Plugin **Dataview** con `Enable JavaScript Queries` activado.
> - Algunos scripts cargan **Chart.js** dinámicamente desde CDN (requieren conexión a internet la primera vez).

---

## 📂 Contenido de la Carpeta

| Script | Función que expone | Propósito |
| :--- | :--- | :--- |
| **`gestorCursos.js`** | `renderizarDashboardCursos()` | Construye el mapa de contenido (MOC) de cursos: separa cursos **padre** de **subcursos**, calcula progreso, estados y relaciones. Alimenta `Dashboard-02Cursos`. |
| **`gestorCursosGraficos.js`** | `renderizarGraficaProgreso()` | Dibuja la gráfica de **evolución acumulativa de aprendizaje** con filtros temporales (Este Mes, 3/6 meses, 1 año, histórico). Usa Chart.js. |
| **`gestorBienestar.js`** | `renderizarBienestar()` | Correlaciona **energía y horas de sueño** y genera la dona de distribución de **estado de ánimo**. Alimenta la sección de bienestar de `Dashboard-01Work`. |
| **`gestorDeporte.js`** | `renderizarDeporte()` | Analiza hábitos deportivos: constancia diaria, rachas, **mapa muscular** (radar), disciplinas practicadas y balance de descansos. Alimenta `Dashboard-03Personal`. |
| **`gestorDeportePeso_Energia_Intensdiad.js`** | `renderizarBiometria()` | Cruza **carga de entrenamiento, peso corporal, energía y descanso** para el análisis de rendimiento integral. Usa Chart.js. |

### 📁 Subcarpeta `tablaTareas/`

| Script | Función que expone | Propósito |
| :--- | :--- | :--- |
| **`gestorTareas.js`** | `gestorTareas()` | Renderiza las tablas de **tareas, pendientes y dudas** (en proceso / finalizadas) con un panel interactivo de filtros. Se usa tanto en el diario como en los dashboards. |
| **`gestorEstadistica.js`** | `renderizarEstadisticas()` | Genera las gráficas de **balance semanal** y **flujo diario** de tareas creadas vs. resueltas. Alimenta `Dashboard-01Work`. |
| **`Readme .js.md`** | — | Documentación detallada y ejemplos de uso de `gestorTareas.js`. |

---

## 🔌 Cómo se Invoca un Script

Todos los scripts se cargan con el mismo patrón dentro de un bloque `dataviewjs` en cualquier nota o dashboard:

````markdown
```dataviewjs
// 1. Leer el contenido del script
const scriptContent = await app.vault.adapter.read("_Scripts/gestorDeporte.js");

// 2. Evaluarlo como módulo, pasando 'dv' explícitamente
const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);

// 3. Extraer la función y renderizar en el contenedor de la nota
const { renderizarDeporte } = module.exports;
renderizarDeporte(this.container);
```
````

> [!tip] Etiquetas y campos que leen los scripts
> - **Tareas:** `#tarea`, `#pendiente`, `#duda` (con fechas `➕ creación` y `✅ finalización`).
> - **Bienestar:** propiedades `energia`, `horas_sueno`, `animo` del diario.
> - **Deporte:** propiedades de sesión (`s1_*`, `s2_*`, `peso`) del diario.
> - **Cursos:** propiedades `tipo`, `estado`, `cursoPadre`, `completado` de las notas en `01Cursos/`.

---

## 🛠️ Cómo Agregar o Extender un Script

1. Define tu nueva función dentro del archivo `.js`:
   ```js
   function miNuevaFuncion(contenedor, parametros) {
       // Tu lógica: dv.table(...), dv.header(...), Chart.js, etc.
   }
   ```
2. Expórtala al final del archivo:
   ```js
   module.exports = { renderizarDeporte, miNuevaFuncion };
   ```
3. Impórtala y úsala desde tu nota con el patrón de invocación de arriba.

> [!warning] Buenas prácticas
> - Mantén cada script **independiente** y con una única responsabilidad clara.
> - Llama a `container.empty()` antes de renderizar para evitar duplicados al refrescar.
> - Documenta las funciones nuevas para conservar el vault ordenado y fácil de mantener.
