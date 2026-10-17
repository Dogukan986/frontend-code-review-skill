import { useEffect, useState } from "react";

export function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0);

  // Run once on mount: only the document is touched, no props or state are read.
  useEffect(() => {
    document.title = "Counter ready";
  }, []);

  return (
    <section style={{ padding: 8 }}>
      <h2 id="counter-label">{label}</h2>
      <button type="button" aria-describedby="counter-label" onClick={() => setCount((c) => c + 1)}>
        Clicked {count} times
      </button>
    </section>
  );
}
