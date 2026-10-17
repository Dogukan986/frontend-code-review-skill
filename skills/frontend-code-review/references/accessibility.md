# Accessibility

Category: `accessibility`. Based on WCAG 2.2 and WAI-ARIA Authoring Practices. You review source code only: color contrast, focus appearance and screen-reader output cannot be verified from JSX alone, so state them as `needs-verification` or leave them out. `eslint-plugin-jsx-a11y` catches several of these, but real problems are reported regardless; mention it when the plugin is visibly absent, disabled or bypassed.

## a11y/unlabeled-control

**Look for:** `<input>`, `<select>`, `<textarea>` or custom controls with no programmatic label: no associated `<label>`, `aria-label` or `aria-labelledby`. A `placeholder` alone is not a label. Also: icon-only links and buttons (content is just an icon or image with no text, `aria-label` or visually hidden text), and a `<label htmlFor="x">` whose target input has no matching `id`.
**Why:** Screen-reader users cannot tell what the field is; click targets and autofill suffer.
**Bad:**
```tsx
<input type="email" placeholder="Email" onChange={onChange} />
```
**Good:** `<label htmlFor="email">Email</label><input id="email" … />`.
**False-positive guard:** Skip hidden inputs, controls wrapped in a `<label>`, and components that forward a `label` prop to a real label (check the component). If the component is unseen, `needs-verification`.
**Default severity:** high for form fields in a main flow; medium otherwise.

## a11y/clickable-non-interactive

**Look for:** `onClick` on `<div>`, `<span>` or other non-interactive elements without `role`, `tabIndex` and keyboard handling.
**Why:** Keyboard and assistive-technology users cannot reach or activate it.
**Bad:**
```tsx
<div className="btn" onClick={save}>Save</div>
```
**Good:** `<button type="button" onClick={save}>Save</button>`.
**False-positive guard:** Skip when the element has a nested real control handling the same action, is a purely decorative backdrop that has a keyboard-accessible alternative (e.g. Escape closes), or the click is event delegation on a container whose children are interactive.
**Default severity:** high for primary actions; medium for secondary.

## a11y/missing-alt

**Look for:** `<img>` (or `next/image` `Image`) with no `alt` attribute at all, or meaningless alt such as the file name on informative images.
**Why:** Screen readers announce the file name or skip the content.
**Bad:**
```tsx
<img src={product.photo} />
```
**Good:** `alt="Red running shoe"`, or `alt=""` for decorative images.
**False-positive guard:** `alt=""` is correct for decorative images; do not report it. Dynamic `alt={…}` is acceptable unless evidently empty.
**Default severity:** medium; high when the image conveys essential information.

## a11y/modal-focus

**Look for:** a custom dialog/modal/drawer implemented with divs that has no focus management: no `role="dialog"` with `aria-modal` and label, no initial focus, no focus trap, or no Escape-to-close, and no use of native `<dialog>` or an accessible library.
**Why:** Keyboard focus stays behind the overlay, so users tab through hidden content and cannot dismiss it.
**Bad:**
```tsx
{open && <div className="modal">{children}</div>}
```
**Good:** native `<dialog>` via `showModal()` or an accessible dialog library, plus focus return on close.
**False-positive guard:** Skip when the dialog comes from a library known to manage focus (Radix, Headless UI, React Aria) — check imports. Non-modal popovers have different requirements.
**Default severity:** high for blocking modals in main flows; medium otherwise.

## a11y/aria-misuse

**Look for:** ARIA that contradicts the element or is invalid: `role="button"` on `<a>`/`<div>` without keyboard support, `aria-hidden="true"` on focusable elements, `aria-label` on elements that ignore it, redundant or conflicting roles.
**Why:** "No ARIA is better than bad ARIA": it can hide controls or announce wrong semantics.
**Bad:**
```tsx
<button aria-hidden="true" onClick={close}>×</button>
```
**Good:** remove `aria-hidden` from focusable controls, or use `aria-label` and keep it exposed.
**False-positive guard:** Verify the attribute semantics before reporting; do not flag valid patterns such as `aria-hidden` on purely decorative icons inside a labelled button.
**Default severity:** medium; high when a primary control becomes unreachable.
