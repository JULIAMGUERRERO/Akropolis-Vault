---
tipo: diario
Pertenece: "[[Diario]]"
tags:
  - diario
energia: 5
horas_sueno: 7.5
peso: 76
animo:
  - 😊 Tranquilo
  - 🧠 Enfocado
  - 🔋 Agotado
  - 🎨 Creativo
ejercicio: false
s1_deporte:
  - Gym
  - Fútbol
  - Nadar
  - Correr
s1_tipo:
  - Fuerza
  - Técnica
  - Partido
  - Entreno
  - Resistencia
s1_zona:
  - Pectoral
  - Tríceps
  - Biceps
  - Deltoides
  - Espalda Alta
  - Espalda Baja
  - Cuádriceps
  - Isquios
  - Glúteo
  - Pantorrilla
  - Abdomen
s1_minutos: 60
s1_intensidad:
  - Alta
  - Media
  - Baja
s2_activa: false
s2_deporte:
  - Gym
  - Fútbol
  - Nadar
  - Correr
s2_tipo:
  - Fuerza
  - Técnica
  - Partido
  - Entreno
  - Resistencia
s2_zona:
  - Pectoral
  - Tríceps
  - Biceps
  - Deltoides
  - Espalda Alta
  - Espalda Baja
  - Cuádriceps
  - Isquios
  - Glúteo
  - Pantorrilla
  - Abdomen
s2_minutos: 30
s2_intensidad:
  - Alta
  - Media
  - Baja
---

# 📅 Diario: {{date: dddd[,] D [de] MMMM [del] YYYY}} 

---
```dataviewjs
const actual = dv.current().file.name;
const diarios = dv.pages('"00Diario"')
    .map(p => p.file.name)
    .filter(name => /^\d{4}-\d{2}-\d{2}$/.test(name))
    .sort();

const index = diarios.indexOf(actual);

let anteriorLink = "⬅️ Sin diario anterior";
let siguienteLink = "Sin diario posterior ➡️";

if (index > 0) {
    anteriorLink = `[[${diarios[index - 1]}|⬅️ Día Anterior (${diarios[index - 1]})]]`;
}

if (index !== -1 && index < diarios.length - 1) {
    siguienteLink = `[[${diarios[index + 1]}|Día Siguiente (${diarios[index + 1]}) ➡️]]`;
}

dv.paragraph(`« ${anteriorLink} | ${siguienteLink} »`);

```
---
```dataviewjs
const scriptContent = await app.vault.adapter.read("_Scripts/tablaTareas/gestorTareas.js");

// Evalúa el contenido y extrae gestorTareas
const module = { exports: {} };
new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);
const { gestorTareas } = module.exports;

gestorTareas(this.container, { 
    proceso: true, 
    finalizadas: false, 
    submenu: false 
});
```
---
## 🎯 Tareas del Día
- [ ] #tarea *Agregar tarea o pendiente personal aquí...* ➕ {{date: YYYY-MM-DD}} [solucion:: ]

---
## 📝 Apuntes Rápidos

> [!NOTE] Ideas y Reflexiones
> - 

---
## ⏱️ Bitácora del Día
- **HH:MM** — *Agrega tus actividades diarias*.

---
## 📚 Sesiones de Estudio de Cursos Hoy
> [!attention]- 💡 Nota para completar tareas
> Para marcar pendientes o dudas como realizadas `[x]`, **haz clic en el enlace del "Curso Hijo"** e ingresa al archivo original. Las tareas NO deben completarse desde este resumen.

```dataviewjs
const hoy = dv.current().file.name;
const paginas = dv.pages('"01Cursos"');

let listaNotas = [];

for (let p of paginas) {
    const file = app.vault.getAbstractFileByPath(p.file.path);
    if (!file) continue;
    
    const contenido = await app.vault.read(file);
    
    if (contenido.includes(hoy) && contenido.includes('nota-estudio')) {
        const bloques = contenido.split('\n\n');
        
        // Formatear de forma segura el Curso Padre evitando errores de sintaxis
        let cursoPadreTexto = "Sin Curso Padre";
        if (p.cursoPadre) {
            cursoPadreTexto = String(p.cursoPadre);
        }

        for (let b of bloques) {
            if (b.includes('> [!note]') && b.includes(hoy)) {
                // Extraer la hora HH:mm para el ordenamiento
                const horaMatch = b.match(/\d{2}:\d{2}/);
                const hora = horaMatch ? horaMatch[0] : "00:00";
                
                // Forzar que el callout aparezca abierto
                const calloutAbierto = b.replace('> [!note]-', '> [!note]+');
                
                listaNotas.push({
                    hora: hora,
                    cursoPadre: cursoPadreTexto,
                    cursoHijo: p.file.link,
                    contenido: calloutAbierto
                });
            }
        }
    }
}

// Ordenar cronológicamente: de la nota más reciente a la más antigua
listaNotas.sort((a, b) => b.hora.localeCompare(a.hora));

if (listaNotas.length > 0) {
    for (let item of listaNotas) {
        // Imprimir Encabezado + Callout + Separador limpio
        const textoBloque = `Curso Padre: ${item.cursoPadre}\n**Curso Hijo:** ${item.cursoHijo}\n\n${item.contenido}\n\n---`;
        dv.paragraph(textoBloque);
    }
} else {
    dv.paragraph("*No se registraron sesiones de estudio para este día.*");
}
```

---
## 🌙 Cierre de Jornada
- **¿Qué fue lo mejor del día?:** *Agrega el texto.* #Positivo
- **¿Qué aprendí hoy?:** *Agrega el texto.* #Refelexion
- **¿Qué puedo mejorar mañana?:**  *Agrega el texto.* #Autocritica

---
---
---






# 📅 Diario PERSONAL: {{date: dddd[,] D [de] MMMM [del] YYYY}} 

### 🧘 Diarios de Introspección
> [!ABSTRACT]- 💭 Preguntas para Conocerme Mejor *(Haz clic para desplegar)*
> - **¿Qué emoción predominó hoy y qué la desencadenó?**
>   - 
> - **¿En qué momento me sentí más enfocado/a o alineado/a conmigo mismo/a?**
>   - 
> - **¿Un límite que respeté o algo de lo que me siento orgulloso/a hoy?**
>   - 

### 📝 Apuntes Personales
> [!ABSTRACT]- *(Haz clic para desplegar)*
> - 
 