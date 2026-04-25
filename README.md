# Node It

Node It is a structured note system for people to make quick organized notes.

Instead of fixed templates, you define categories with fields and create notes with them!

## What it does

- Custom categories with typed fields
- Node trees with nested parent/child relationships
- Fast inline create/edit/delete workflows
- Merge-on-duplicate behavior for identity-based entries
- Subtree aggregation (sum / avg / count)
- Drag-and-drop reorder and reparent
- Keyboard navigation and shortcut support

## Core concepts

- **Category**: your schema (field definitions + identity keys)
- **Node**: a single structured entry under a category
- **Tree**: nodes can contain other nodes to model layered thinking

## Who it’s for

- People who prefer structured input over long-form docs
- Users who want flexible organization without rigid app constraints
- Builders tracking values, tasks, ideas, research, or inventory-like data

## Tech stack

- Frontend: React (Vite)
- Backend: Node.js + Express
- Database: MongoDB

## Roadmap

Current focus is UX polish and redesign (including canvas-based exploration),
followed by backend hardening, auth/multi-tenancy, import/export, and operations.

See full plan: [`ROADMAP.md`](./ROADMAP.md)
