const STEPS = ["Install", "Configure", "Run"];

export function Steps() {
  return (
    <ol>
      {STEPS.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  );
}
