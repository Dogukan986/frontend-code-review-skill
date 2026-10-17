import { useState } from "react";

type Player = { id: number; name: string; score: number };

// `players` always holds the full league: about 50,000 rows, loaded in a single request.
export function Leaderboard({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const visible = ranked.filter((p) => p.name.includes(query)).slice(0, 20);

  return (
    <div>
      <label htmlFor="q">Search</label>
      <input id="q" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ol>
        {visible.map((p) => (
          <li key={p.id}>{p.name}: {p.score}</li>
        ))}
      </ol>
    </div>
  );
}
