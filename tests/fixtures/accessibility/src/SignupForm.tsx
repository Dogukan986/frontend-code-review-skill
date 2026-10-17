export function SignupForm({ onSubmit }: { onSubmit: () => void }) {
  return (
    <form onSubmit={onSubmit}>
      <input type="email" placeholder="Email" />
      <div className="btn" onClick={onSubmit}>Sign up</div>
    </form>
  );
}
