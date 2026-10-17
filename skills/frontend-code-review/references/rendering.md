# Rendering

Category: `rendering`.

**Not problems on their own** (never report solely for these): inline arrow functions or object/array literals in JSX; components or values not wrapped in `React.memo`, `useMemo` or `useCallback`; re-rendering a small component. Memoization has a cost and often does nothing. Report a performance finding only when you can state **impact** (what re-renders or blocks, how often, how large) and quote evidence. With React Compiler enabled, manual memoization is largely unnecessary.

## rendering/index-key

**Look for:** `key={index}` (or array index) on list items that can be reordered, inserted, removed or filtered, **and** items hold state, inputs, focus or animations.
**Why:** React reuses the wrong component instance, so typed text, checkboxes or animation state jump to the wrong row.
**Bad:**
```tsx
{todos.map((t, i) => <TodoRow key={i} todo={t} />)}
```
**Good:** `key={t.id}`.
**False-positive guard:** Index keys are fine for static lists that never reorder and have no per-item state. Do not report those.
**Default severity:** medium; low for read-only lists that can change but hold no state.

## rendering/expensive-render-work

**Look for:** demonstrably heavy synchronous work on the render path (sorting/filtering/parsing a large dataset, regex over big text, deep clones) that re-runs on frequent renders (typing, scrolling, timers) unrelated to the data.
**Why:** Blocks the main thread and makes the UI janky.
**Bad:**
```tsx
const sorted = items.slice().sort(compare); // items: ~50k rows, component re-renders on every keystroke
```
**Good:** compute once with `useMemo` keyed on `items`, move out of render, or paginate/virtualize.
**False-positive guard:** Require evidence of size (a constant, a data source, a comment) **and** render frequency. Unknown size → `needs-verification`, `low`. Skip small collections and work that runs once.
**Default severity:** medium when size and frequency are both evidenced; otherwise low/`needs-verification`.

## rendering/unstable-context-value

**Look for:** a Context Provider whose `value` is a new object/array each render, wrapping many consumers, in a component that re-renders often for unrelated reasons.
**Why:** Every consumer re-renders on every provider render.
**Bad:**
```tsx
<ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
```
**Good:** memoize the value, or split context.
**False-positive guard:** Skip when the provider rarely re-renders (near the root with stable props) or has few consumers. Show the frequency or fan-out; otherwise `low`.
**Default severity:** low; medium with evidenced fan-out and frequent renders.

## rendering/unvirtualized-large-list

**Look for:** rendering hundreds or thousands of DOM rows from data whose size is evidenced (API page size, constant, fixture), with no pagination or virtualization.
**Why:** Large DOM trees slow first render, scrolling and updates.
**Bad:**
```tsx
{allMessages.map(m => <Message key={m.id} {...m} />)} // allMessages: unbounded history
```
**Good:** paginate or use a virtualization library.
**False-positive guard:** Do not report when size is unknown or small. Evidence of size is required.
**Default severity:** medium; `needs-verification` (capped at medium) when size is inferred.
