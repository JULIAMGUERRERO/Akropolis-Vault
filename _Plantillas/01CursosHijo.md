---
tipo: Subcurso
cursoPadre:
  - "[[Escribe el nombre de su curso Padre]]"
descripcion: ""
fechaInicio:
dificultad:
  - Alta
  - Media Alta
  - Media
  - Media Baja
  - Baja
estado: Cola
fechaFin:
completado: false
tags:
  - curso/subcurso
---

Seleccione el estado del curso: `INPUT[inlineSelect(option('Cola') ,option('En Proceso'), option('Completado'), option('Pausa')):estado]`

<%*
let numModulos = await tp.system.prompt("¿Cuántos módulos tiene este subcurso?", "1");
let total = parseInt(numModulos) || 1;
-%>
# 📖 `= this.file.name`

> **Padre:** `= this.cursoPadre` | **Estado:** `= this.estado`

---

## 🎯 Objetivos del Subcurso

- **Objetivo General:** *(Sintetiza en 1 o 2 frases qué busca enseñar este curso específico).*
- **Objetivos Específicos:**
  - [ ] 
---
## 📚 Módulos
<%* for (let i = 1; i <= total; i++) { %>
### 🔹 Módulo <%* tR += i %>: [Nombre del Módulo <%* tR += i %>]

- [ ] **Módulo Completado**
- **Lista de Lecciones:**   
```meta-bind-button
label: "Añadir Lección"
icon: "plus"
style: primary
class: "float-right"
actions:
  - type: insertIntoNote
    line: selfStart
    value: "  - [ ] **Lección:** \n    - *Descripción:* "
```
#### Bitácora de Aprendizaje
- 📝 **Notas de Estudio:**

```meta-bind-button
label: "📝 Nueva Nota"
icon: "edit"
style: primary
class: "float-right"
actions:
  - type: insertIntoNote
    line: selfStart
    templater: true
    value: "_Plantillas/01PlantillaNotaEstudio.md"
```
<%* } %>
    

## 🔑 **Conceptos clave extraídos:** 
- *Agrega tus ideas claves aquí por favor no olvides si requires alguna citación agregarla...*

---
```dataviewjs
const actual = dv.current().file.name;
const tareas = dv.page(actual).file.tasks;

if (tareas && tareas.length > 0) {
    const filas = tareas.map(t => {
        let textoLimpio = t.text
            .replace(/#pendiente|#duda/g, "")
            .replace(/➕\s*\d{4}-\d{2}-\d{2}/g, "")
            .replace(/✅\s*\d{4}-\d{2}-\d{2}/g, "")
            .trim();

        const estado = t.completed ? "🟢 Finalizado" : "🟡 Pendiente";

        const matchCreacion = t.text.match(/➕\s*(\d{4}-\d{2}-\d{2})/);
        const fechaCreacion = matchCreacion ? matchCreacion[1] : "Sin fecha";

        const matchFin = t.text.match(/✅\s*(\d{4}-\d{2}-\d{2})/);
        const fechaFin = t.completed ? (matchFin ? matchFin[1] : "Completado") : "—";

        return [
            t.link,
            textoLimpio,
            estado,
            fechaCreacion,
            fechaFin
        ];
    });

    dv.table(["Línea / Bloque", "Pendiente o Duda", "Estado", "Creación", "Finalización"], filas);
} else {
    dv.paragraph("*No hay tareas ni dudas registradas en este curso.*");
}
```
