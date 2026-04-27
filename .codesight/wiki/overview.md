# philanthroglobe — Overview

> **Navigation aid.** This article shows WHERE things live (routes, models, files). Read actual source files before implementing new features or making changes.

**philanthroglobe** is a typescript project built with raw-http.

## Scale

20 UI components · 8 library files · 1 environment variables

**UI:** 20 components (react) — see [ui.md](./ui.md)

## High-Impact Files

Changes to these files have the widest blast radius across the codebase:

- `src\state\store.ts` — imported by **14** files
- `src\lib\colorScales.ts` — imported by **4** files
- `src\lib\filters.ts` — imported by **4** files
- `src\lib\dataLoader.ts` — imported by **1** files
- `src\components\Layout\Header.tsx` — imported by **1** files
- `src\components\Layout\MethodologyFooter.tsx` — imported by **1** files

---
_Back to [index.md](./index.md) · Generated 2026-04-27_