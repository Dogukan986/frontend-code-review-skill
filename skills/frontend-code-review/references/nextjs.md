# Next.js Best Practices

Category: `nextjs`. First determine router type (`app/` vs `pages/`) and Next.js version from `package.json`. The Server/Client rules below apply to the App Router.

## next/secret-in-client

**Look for:** a `"use client"` module (or code imported by one) reading a server-only secret: `process.env.X` without the `NEXT_PUBLIC_` prefix used as a credential, or hard-coded API keys/tokens.
**Why:** Client bundles are public. A secret in them is exposed to every visitor. (Non-prefixed env vars are `undefined` in the browser, so the feature also breaks.)
**Bad:**
```tsx
"use client";
const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } });
```
**Good:** call the secret-using code from a Server Component, Route Handler or Server Action.
**False-positive guard:** `NEXT_PUBLIC_*` variables are meant to be public; do not report them unless the name or use shows a real secret. Confirm the file is actually a client module before reporting.
**Default severity:** `critical` when a real secret value is hard-coded or inlined and traced to a client module (`confirmed`); high when only the env access pattern is client-side.

## next/unnecessary-use-client

**Look for:** `"use client"` at the top of a file that uses no client-only features (state, effects, event handlers, browser APIs, client-only libraries), especially page/layout files that fetch data.
**Why:** Moves rendering and data fetching to the browser, increases bundle size and loses server-only benefits.
**Bad:**
```tsx
"use client";
export default async function Page() { const posts = await db.posts(); return <List posts={posts} />; }
```
**Good:** keep the page a Server Component; add `"use client"` only to the interactive leaf.
**False-positive guard:** The directive is required if the file or something it imports uses hooks, handlers, `window`, or a context consumer. Check imports before reporting. Leaf components marked client are normal.
**Default severity:** low; medium for page/layout-level directives that block server data fetching.

## next/img-element

**Look for:** a plain `<img>` for content images, especially large or above-the-fold, in a project using `next/image`-capable Next.js, with no `@next/next/no-img-element` justification.
**Why:** Loses automatic sizing, lazy loading and modern formats; can hurt LCP and cause layout shift.
**Bad:**
```tsx
<img src="/hero-4000.jpg" alt="Hero" />
```
**Good:** `<Image src="/hero-4000.jpg" alt="Hero" width={1200} height={600} priority />`.
**False-positive guard:** Skip SVG/icons, external images where `next/image` domains are not configured, and emails. Report when the image is evidently large or above the fold; if the `@next/next/no-img-element` lint rule is visibly off or suppressed, say so.
**Default severity:** low; medium for an evidenced large hero image.

## next/server-only-in-client

**Look for:** a client module importing server-only code (`fs`, `server-only` modules, database clients, `next/headers`, ORM instances).
**Why:** Build errors or leaked server code and dependencies in the client bundle.
**Bad:**
```tsx
"use client";
import { db } from "@/lib/db";
```
**Good:** fetch on the server and pass serialisable props, or call a Route Handler/Server Action.
**False-positive guard:** The build usually fails on this; report only when the guard is bypassed or the import is plainly present. Confirm the module is server-only by reading it.
**Default severity:** high; critical if it exposes credentials (`confirmed`).
