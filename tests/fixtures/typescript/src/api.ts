export interface User {
  id: string;
  email: string;
}

export async function getUser(id: string): Promise<any> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}

export async function loadSettings(): Promise<User> {
  const raw = localStorage.getItem("settings");
  return JSON.parse(raw as string) as unknown as User;
}

export function firstAdmin(users: Map<string, User>) {
  return users.get("admin")!.email;
}
