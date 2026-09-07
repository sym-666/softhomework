# Backend Development Guidelines

> Best practices for backend development in this project.

---

## Overview

This directory contains guidelines for backend development. Fill in each file with your project's specific conventions.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | To fill |
| [Database Guidelines](./database-guidelines.md) | ORM patterns, queries, migrations | Active |
| [Error Handling](./error-handling.md) | Error types, handling strategies | To fill |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | To fill |
| [Logging Guidelines](./logging-guidelines.md) | Structured logging, log levels | To fill |
| [Plot Expression Contract](./plot-expression-contract.md) | Auxiliary plot-column API contract | Active |
| [Plot CSV File Resolution](./plot-csv-file-resolution.md) | GetTimes token ↔ CSV file match for plot/animation | Active |
| [Case List Payload Contract](./case-list-payload-contract.md) | Lightweight GetCases / GetCasesForAdmin DTO | Active |
| [Case Status SSE Contract](./case-status-sse-contract.md) | SSE StatusEvents + RTK invalidate for list refresh | Active |
| [JSON → Namelist Converter Contract](./json-to-nml-converter-contract.md) | Managed JsonToNmlConverter + pipeline convert step | Active |
| [Case Execution Cancellation Contract](./case-execution-cancellation-contract.md) | Cooperative cancellation & termination lifecycle | Active |
| [Case Execution Log Streaming Contract](./case-execution-log-streaming-contract.md) | Multi-file tailing & tabbed realtime log streaming | Active |

---

## How to Fill These Guidelines

For each guideline file:

1. Document your project's **actual conventions** (not ideals)
2. Include **code examples** from your codebase
3. List **forbidden patterns** and why
4. Add **common mistakes** your team has made

The goal is to help AI assistants and new team members understand how YOUR project works.

---

**Language**: All documentation should be written in **English**.
