type Todo = { id: string; text: string };

export function TodoList({ todos, onRemove }: { todos: Todo[]; onRemove: (id: string) => void }) {
  return (
    <ul>
      {todos.map((t, i) => (
        <li key={i}>
          <input defaultValue={t.text} aria-label={`Todo ${i + 1}`} />
          <button type="button" onClick={() => onRemove(t.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
