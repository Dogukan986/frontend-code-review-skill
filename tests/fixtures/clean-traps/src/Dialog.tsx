import { useEffect, useRef, type ReactNode } from "react";

type DialogProps = { open: boolean; onClose: () => void; title: string; children: ReactNode };

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-labelledby="dlg-title" onClose={onClose}>
      <h2 id="dlg-title">{title}</h2>
      {children}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </dialog>
  );
}
