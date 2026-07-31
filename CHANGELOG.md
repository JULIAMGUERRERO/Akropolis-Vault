# 📌 Changelog

Todos los cambios notables de **Akropolis-Vault** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/) y este proyecto sigue el [Versionado Semántico (SemVer)](https://semver.org/lang/es/).

## Tipos de cambios

- **Added** — funcionalidades nuevas.
- **Changed** — cambios en funcionalidades existentes.
- **Fixed** — corrección de errores.
- **Removed** — funcionalidades eliminadas.
- **Deprecated** — funcionalidades que se retirarán próximamente.
- **Security** — correcciones de seguridad.

---

## *Unreleased*

*Cambios en desarrollo que aún no se han publicado en una versión.*

---

## *1.0.0* — 2026-07-31

Primera versión estable y pública de **Akropolis-Vault**: un sistema de gestión del conocimiento personal (PKM) construido sobre Obsidian.

### Added

- **Dashboards de análisis visual:**
  - `Dashboard-01Work` — panel de rendimiento y flujo de trabajo (balance semanal de tareas, flujo diario, energía, sueño y estado de ánimo).
  - `Dashboard-02Cursos` — mapa de contenido (MOC) de cursos, catálogo de subcursos y evolución acumulativa de aprendizaje.
  - `Dashboard-03Personal` — deporte y fitness (constancia, rachas, mapa muscular, disciplinas y biometría).
- **Sistema de plantillas (Templater):**
  - `01CursosPadre.md` — curso principal (padre) con propiedades de seguimiento.
  - `01CursosHijo.md` — subcurso (hijo) con generación dinámica de módulos y botones Meta Bind.
  - `01PlantillaNotaEstudio.md` — notas de estudio con pendientes y dudas fechadas.
  - `00PlantillaDiario.md` — diario con navegación entre días y métricas de bienestar.
- **Motor de scripts (`_Scripts/`):** módulos JavaScript que procesan los datos y alimentan los dashboards, más el sistema de tareas, pendientes y dudas.
- **Documentación completa:**
  - `Readme.md` principal con contexto histórico del nombre, explicación del sistema y guía de instalación de plugins.
  - Documentación por carpeta: `_Plantillas/README.md`, `_Scripts/README.md` y `_assets/README.md`.
  - Diagramas de arquitectura con Mermaid.
- **Carpeta `_assets/`** para centralizar los recursos visuales (capturas de dashboards, logos, banners).
- **Galería de vista previa** de los dashboards en el README.
- **Metadatos del proyecto:** licencia GPL-3.0, badges informativos y datos de contacto.

[Unreleased]: https://github.com/JULIAMGUERRERO/Akropolis-Vault/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/JULIAMGUERRERO/Akropolis-Vault/releases/tag/v1.0.0
