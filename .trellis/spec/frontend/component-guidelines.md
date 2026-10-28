# Component Guidelines

> How components are built in this project.

---

## Overview

<!--
Document your project's component conventions here.

Questions to answer:
- What component patterns do you use?
- How are props defined?
- How do you handle composition?
- What accessibility standards apply?
-->

(To be filled by the team)

---

## Component Structure

<!-- Standard structure of a component file -->

(To be filled by the team)

---

## Props Conventions

<!-- How props should be defined and typed -->

(To be filled by the team)

---

## Styling Patterns

<!-- How styles are applied (CSS modules, styled-components, Tailwind, etc.) -->

(To be filled by the team)

---

## Accessibility

<!-- A11y requirements and patterns -->

(To be filled by the team)

---

## Common Mistakes

### Common Mistake: `Label asChild` + `Button` for file inputs

**Symptom**: Clicking「选择文件」does nothing; the hidden `<input type="file">` never opens.

**Cause**: With `asChild`, Radix Label renders as the Button. `htmlFor` on a `<button>` does not activate the associated file input (that only works on a real `<label>`).

**Fix**: Use `ref` + `input.click()`, or a native `<label htmlFor>` wrapping non-Button content.

**Prevention**: See [Add-Cases JSON Path](./add-cases-json.md) Wrong vs Correct.
