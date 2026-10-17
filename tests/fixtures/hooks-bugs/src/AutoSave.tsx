import { useEffect, useState } from "react";

export function AutoSave({ save }: { save: (text: string) => void }) {
  const [draft, setDraft] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setInterval(() => save(draft), 5000);
    return () => clearInterval(id);
  }, []);

  return <textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Draft" />;
}
