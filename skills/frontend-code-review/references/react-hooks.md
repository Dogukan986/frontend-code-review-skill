# React Hooks

Category: `react-hooks`. Apply [evidence rules](evidence-and-confidence.md) first. `eslint-plugin-react-hooks` covers several of these rules, but that never excludes a real problem: report it when the failure is concrete, and note any suppression or enforced-but-violated config (see [lint overlap](evidence-and-confidence.md)).

## hooks/stale-closure

**Look for:** an effect, callback, timer or event listener that reads state/props captured at creation, while the dependency list (or `[]`) omits them and the stale value changes the outcome. A lint suppression on the line strengthens the finding.
**Why:** The handler keeps using the value from the render that created it, so users see or submit outdated data.
**Bad:**
```tsx
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { const id = setInterval(() => save(draft), 5000); return () => clearInterval(id); }, []);
```
**Good:** include `draft` in deps, or read it through a ref updated each render.
**False-positive guard:** Do not report when the value is a ref, a stable setter, a module constant, or when the omission is intentional and the code does not depend on freshness (commented "run once on mount" that only uses stable values).
**Default severity:** high when user data is affected and traced (`confirmed`); medium otherwise.

## hooks/missing-cleanup

**Look for:** subscriptions, timers, event listeners, observers or `WebSocket`s created inside `useEffect` with no returned cleanup.
**Why:** Leaks, duplicate handlers after re-run, and state updates or callbacks after unmount.
**Bad:**
```tsx
useEffect(() => { window.addEventListener("resize", onResize); }, []);
```
**Good:** `return () => window.removeEventListener("resize", onResize);`
**False-positive guard:** Skip when the resource is one-shot and finite (`setTimeout` of a few ms whose callback is safe after unmount), when the library returns auto-managed resources, or when cleanup exists in a helper you can see.
**Default severity:** high for repeated listeners/intervals; medium for one-shot resources.

## hooks/conditional-hook

**Look for:** a hook called inside a condition, loop, nested function or after an early `return`. A `rules-of-hooks` suppression on the line strengthens the finding.
**Why:** The hook order changes between renders, which makes React throw or corrupt state.
**Bad:**
```tsx
if (!user) return null;
const [open, setOpen] = useState(false);
```
**Good:** call all hooks unconditionally at the top, before any early return.
**False-positive guard:** Do not flag custom function names that merely start with `use` but are not hooks, or code in a file that is not a component or hook.
**Default severity:** high; `critical` only if you traced a path that throws in a core flow (`confirmed`).

## hooks/effect-derived-state

**Look for:** `useEffect` whose only job is to compute state from props/other state and call `setState`, producing an extra render with a visibly wrong intermediate frame, or effect chains that fight each other.
**Why:** Extra renders, flicker and desync. The value can be computed during render.
**Bad:**
```tsx
useEffect(() => { setFullName(first + " " + last); }, [first, last]);
```
**Good:** `const fullName = first + " " + last;`
**False-positive guard:** Do not flag effects that synchronise with external systems, fetch data, or reset state on a prop change with a documented reason. A single cheap derived value is `low` at most.
**Default severity:** low; medium when it causes visible flicker or loops.

## hooks/async-effect-race

**Look for:** an effect that starts an async request depending on props/state and sets state from the result with no cancellation or ignore flag, where the dependency can change quickly (search input, route id).
**Why:** An older, slower response can overwrite a newer one.
**Bad:**
```tsx
useEffect(() => { fetch(`/api/q?s=${term}`).then(r => r.json()).then(setResults); }, [term]);
```
**Good:** use `AbortController` or an `ignore` flag in cleanup.
**False-positive guard:** Skip when a data library (React Query, SWR, Server Components) manages the request, or the input cannot change while a request is in flight.
**Default severity:** medium; high if stale data is submitted or written.
