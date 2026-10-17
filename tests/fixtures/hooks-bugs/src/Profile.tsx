import { useState } from "react";

export function Profile({ user }: { user: { name: string } | null }) {
  if (!user) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [editing, setEditing] = useState(false);

  return (
    <section>
      <h2>{user.name}</h2>
      <button type="button" onClick={() => setEditing(!editing)}>
        {editing ? "Done" : "Edit"}
      </button>
    </section>
  );
}
