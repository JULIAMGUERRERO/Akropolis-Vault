# DOCUMENTACIÓN gestorTareas
## CÓMO LLAMAR A LA FUNCIÓN DESDE CUALQUIER NOTA .MD
   

   1. Para notas individuales o plantillas históricas (ej: Plantilla Diario):
      ```dataviewjs
      const scriptContent = await app.vault.adapter.read("_Scripts/tablaTareas/gestorTareas.js");
      const module = { exports: {} };
      new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);
      const { gestorTareas } = module.exports;

      gestorTareas(this.container, { 
          proceso: true, 
          finalizadas: false, 
          submenu: false 
      });
      ```

   2. Para notas de Reuniones / Dashboard interactivo (con Submenú de Filtros):
      ```dataviewjs
      const scriptContent = await app.vault.adapter.read("_Scripts/tablaTareas/gestorTareas.js");
      const module = { exports: {} };
      new Function("module", "exports", "dv", scriptContent)(module, module.exports, dv);
      const { gestorTareas } = module.exports;

      gestorTareas(this.container, { 
          proceso: true, 
          finalizadas: true, 
          submenu: true 
      });
      ```

   ---  
   ## PARÁMETROS DEL OBJETO DE CONFIGURACIÓN
   - proceso (boolean): true para mostrar la tabla de tareas "En Proceso".
   - finalizadas (boolean): true para mostrar la tabla de tareas "Finalizadas".
   - submenu (boolean): true para renderizar el panel interactivo de filtros superior.
   - filtrosDirectos (object): opcional, ej: { fecha: "7_DIAS", tag: "#tarea" }.

 ---  
  ## CÓMO AGREGAR NUEVAS FUNCIONES EN EL FUTURO ---

   1. Define la nueva función en este archivo:
      function miNuevaFuncion(contenedor, parametros) {
          // Tu código JS o llamadas a dv.table/dv.header aquí
      }

   2. Agrégala al final del archivo en module.exports:
      module.exports = { 
          gestorTareas,
          miNuevaFuncion 
      };

   3. Importala y úsala en tu nota .md:
      const { miNuevaFuncion } = module.exports;
      miNuevaFuncion(this.container, { ... });

--- 