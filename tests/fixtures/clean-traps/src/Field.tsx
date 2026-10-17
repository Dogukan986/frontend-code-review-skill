import { useRef } from "react";

export function Field({ label }: { label: string }) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label>
        {label}
        <input ref={ref} type="text" />
      </label>
      <img src="/decor.svg" alt="" />
      <button type="button" onClick={() => ref.current?.focus()}>
        Focus field
      </button>
    </div>
  );
}
