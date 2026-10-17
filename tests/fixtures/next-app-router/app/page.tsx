"use client";

import { Hero } from "./components/Hero";
import { posts } from "../data/posts";

export default function Page() {
  return (
    <main>
      <Hero />
      <ul>
        {posts.map((p) => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
    </main>
  );
}
