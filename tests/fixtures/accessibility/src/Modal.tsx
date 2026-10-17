import type { ReactNode } from "react";

export function Modal({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open) return null;
  return <div className="modal-overlay"><div className="modal">{children}</div></div>;
}
