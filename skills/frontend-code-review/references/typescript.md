# TypeScript Type Safety

Category: `typescript`. First read `tsconfig.json`. Focus on **explicit** escapes the compiler accepts. If `strict` is `true`, implicit `any` would not compile, so such code is unlikely to exist; if you do see it, report it once and note the config should reject it. If `strict` is `false`, say so as context, and report implicit `any` only where it hides a concrete failure, grouped as one finding rather than one per missing annotation.

## ts/any-boundary

**Look for:** explicit `any` (or `Function`, `object`-as-escape) in exported function signatures, props, API response types or shared state, so unchecked values flow into other modules.
**Why:** `any` switches off checking for everything it touches, hiding real bugs far from the cause.
**Bad:**
```ts
export async function getUser(id: string): Promise<any> { /* … */ }
```
**Good:** a concrete type, or `unknown` plus narrowing/validation.
**False-positive guard:** Do not report `any` in tests, local throwaway code, or generic constraints where it is intentional and commented. One finding per boundary, not per usage.
**Default severity:** medium; low when confined to one file.

## ts/unsafe-assertion

**Look for:** `as` casts that assert something the code does not establish: `as unknown as T`, casting external data (`JSON.parse`, `fetch().json()`, `localStorage`, `searchParams`) straight to a domain type, or casting to silence an error.
**Why:** The compiler trusts the assertion; if reality differs the failure happens at runtime far from the cast.
**Bad:**
```ts
const user = (await res.json()) as unknown as User;
```
**Good:** validate (schema or type guard) and narrow.
**False-positive guard:** Skip safe widening casts, `as const`, DOM element narrowing right after a null check, and casts directly adjacent to a runtime check.
**Default severity:** medium for external data; low for internal casts.

## ts/non-null-assertion

**Look for:** `!` on values that are genuinely optional at runtime (`Map.get`, `querySelector`, `array.find`, API fields, `ref.current` before mount) without a preceding guarantee.
**Why:** Converts a compile-time warning into a runtime `TypeError`.
**Bad:**
```ts
const el = document.getElementById("root")!;
```
**Good:** check and handle the null case, or throw an explicit error.
**False-positive guard:** Skip when the line above establishes non-nullness, in tests, or for patterns like `ref.current!` inside event handlers that run after mount. Say what could be null, or drop it.
**Default severity:** low; medium when the value comes from user/API input.

## ts/unvalidated-external-data

**Look for:** values from network, storage, URL or `postMessage` used as typed data with no validation, where wrong shape would crash or corrupt state.
**Why:** Types are erased at runtime; the server or user may send anything.
**Bad:**
```ts
const { items } = await res.json();
items.map(render);
```
**Good:** validate shape (schema or guard) before use.
**False-positive guard:** Skip when the data source is your own typed, versioned backend and a shared contract is evident, or validation exists in a layer you can see. Otherwise `needs-verification`.
**Default severity:** medium; `needs-verification` when the contract is unseen.
