# 📝 _Plantillas

**Las plantillas que automatizan la creación de notas en `Akropolis-Vault`.**

Esta carpeta reúne las plantillas de **Templater** que dan estructura y consistencia al vault. Gracias a ellas, cada nota (un curso, un subcurso, una nota de estudio o un día del diario) nace ya organizada, con sus propiedades, secciones, botones y consultas dinámicas listas para usar.

> [!info] Requisitos
> - Plugin **Templater** instalado y con la carpeta de plantillas apuntando a `_Plantillas`.
> - Plugin **Dataview** (con JS) para las tablas y consultas que incluyen las plantillas.
> - Plugin **Meta Bind** para los botones interactivos (añadir lección / nueva nota).

---

## 📂 Contenido de la Carpeta

| Plantilla | Propósito |
| :--- | :--- |
| **`01CursosPadre.md`** | **Curso Principal (Padre).** Representa un programa o especialización completo (p. ej. una ruta doctoral). Define propiedades clave: plataforma, estado, dificultad, relevancia para la tesis, fechas, URL y progreso. Es el nodo que agrupa a sus subcursos. |
| **`01CursosHijo.md`** | **Subcurso (Hijo).** Se vincula a un curso padre y, mediante una **pregunta interactiva** ("¿Cuántos módulos tiene?"), genera dinámicamente su estructura de **módulos, objetivos, metas, lecciones, notas, dudas y tareas**. Incluye botones **Meta Bind** para añadir lecciones o notas con un clic y una tabla Dataview que resume el estado de las tareas. |
| **`01PlantillaNotaEstudio.md`** | **Nota de Estudio.** Bloque de bitácora que se inserta dentro de un subcurso: notas, conclusiones, **pendientes** (`#pendiente`) y **dudas** (`#duda`) fechadas automáticamente. Estos elementos luego se visualizan en el diario y en los dashboards. |
| **`00PlantillaDiario.md`** | **Diario.** Genera la nota del día con navegación entre días (anterior/siguiente), tablas de tareas en proceso, propiedades de bienestar (energía, sueño, ánimo) y ejercicio, y espacio para apuntes rápidos. |

> **El vínculo Padre → Hijo → Nota → Diario** es el corazón del sistema: todo lo que estudias queda enlazado y consultable desde cualquier punto de vista (por curso, por día o por métrica).

---

## ▶️ Cómo Usar una Plantilla (con Templater)

> [!important] Ojo con el comando correcto
> Estas plantillas usan **Templater**, **no** el plugin nativo de *Plantillas* (Templates) de Obsidian. Por eso **no** debes usar el comando "Insertar plantilla" por defecto: hay que usar el comando propio de Templater.

### Pasos

1. Crea o abre la nota donde quieres aplicar la plantilla.
2. Abre la paleta de comandos con `Ctrl + P` (Windows/Linux) o `Cmd + P` (Mac).
3. Escribe y selecciona:

   ```
   Templater: Open Insert Template modal
   ```

4. Elige la plantilla deseada de la lista (por ejemplo `01CursosHijo`).
5. Responde las preguntas interactivas si la plantilla las solicita (p. ej. el número de módulos del subcurso).

> [!tip] Atajo recomendado
> Puedes asignar un atajo de teclado al comando **`Templater: Open Insert Template modal`** en *Ajustes ⚙️ ➔ Atajos de teclado (Hotkeys)*. Por defecto suele ser `Alt + N`, lo que agiliza enormemente la creación de notas.

---

## 🧩 Detalles Técnicos por Plantilla

- **Preguntas interactivas (Templater):** `01CursosHijo.md` usa `tp.system.prompt(...)` para preguntar cuántos módulos generar y crea esa cantidad de bloques automáticamente.
- **Fechas automáticas:** las notas de estudio insertan la fecha con `tp.date.now(...)`; el diario usa `{{date}}` para el título del día.
- **Botones Meta Bind:** los bloques ```` ```meta-bind-button ```` permiten añadir lecciones o insertar una nueva nota de estudio (que a su vez invoca `01PlantillaNotaEstudio.md`) sin romper el formato.
- **Consultas Dataview:** varias plantillas incluyen bloques `dataviewjs` que leen las tareas de la propia nota o cargan scripts de [`_Scripts/`](../_Scripts/README.md).

---

## 🛠️ Buenas Prácticas

> [!warning] Recomendaciones
> - No edites el **frontmatter** (propiedades YAML) de forma que rompa los nombres de campo: los dashboards dependen de ellos (`tipo`, `estado`, `cursoPadre`, `energia`, `s1_*`, etc.).
> - Al crear un subcurso, completa el campo `cursoPadre` con el enlace `[[Nombre del Curso Padre]]` correcto para que se vincule en el `Dashboard-02Cursos`.
> - Mantén las plantillas en esta carpeta para que Templater las siga detectando.
