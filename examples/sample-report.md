# Frontend Code Review: whole project (src/)

> Real output of the skill on `tests/fixtures/accessibility` (from an earlier skill version, see docs/eval-runs/initial-single-run).

## Summary

| Severity | Count |
|---|---|
| critical | 0 |
| high | 3 |
| medium | 1 |
| low | 0 |

## Findings

### F1 · high · confirmed · Sign up action is a clickable div, not keyboard accessible

- **File:** `src/SignupForm.tsx:5`
- **Rule:** `a11y/clickable-non-interactive` (accessibility)
- **Explanation:** The primary submit action is a <div> with onClick and no role, tabIndex or key handler, so keyboard and screen-reader users cannot reach or activate it. There is no real submit button in the form to provide the same action.
- **Evidence:**

  ```tsx
  <div className="btn" onClick={onSubmit}>Sign up</div>
  ```

- **Suggested fix:** Replace with <button type="submit">Sign up</button> and drop the onClick (the form's onSubmit handles it).

### F2 · high · confirmed · Email input has only a placeholder, no label

- **File:** `src/SignupForm.tsx:4`
- **Rule:** `a11y/unlabeled-control` (accessibility)
- **Explanation:** The input has no associated <label>, aria-label or aria-labelledby; a placeholder is not an accessible label. Screen-reader users cannot identify the field in the signup flow.
- **Evidence:**

  ```tsx
  <input type="email" placeholder="Email" />
  ```

- **Suggested fix:** Add <label htmlFor="email">Email</label> and id="email" on the input (or an aria-label).

### F3 · high · confirmed · Custom modal has no dialog semantics or focus management

- **File:** `src/Modal.tsx:5`
- **Rule:** `a11y/modal-focus` (accessibility)
- **Explanation:** The modal is plain divs with no role="dialog", aria-modal, accessible name, initial focus, focus trap, or Escape-to-close, and no accessible dialog library is imported. Keyboard focus stays behind the overlay and users cannot dismiss it.
- **Evidence:**

  ```tsx
  return <div className="modal-overlay"><div className="modal">{children}</div></div>;
  ```

- **Suggested fix:** Use native <dialog> with showModal(), or an accessible library (Radix Dialog, Headless UI, React Aria); otherwise add role="dialog" aria-modal="true" aria-labelledby, move focus in, trap it, close on Escape and restore focus on close.

### F4 · medium · confirmed · Image has no alt attribute

- **File:** `src/Avatar.tsx:2`
- **Rule:** `a11y/missing-alt` (accessibility)
- **Explanation:** The <img> has no alt attribute at all, so screen readers may announce the file URL. Use alt="" if decorative.
- **Evidence:**

  ```tsx
  return <img src={src} className="avatar" />;
  ```

- **Suggested fix:** Add alt text (e.g. an alt prop describing the user) or alt="" if the avatar is purely decorative.

## Suspicious content

None found.

## Limitations

- Only the 3 source files in src/ were reviewed; no ESLint config was present so jsx-a11y status is unknown.
- Color contrast, focus styles and actual screen-reader output cannot be verified from source.
- Callers of these components were not present, so how they are used (e.g. Modal content) was not checked.
