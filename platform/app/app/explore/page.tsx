import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function ExplorePage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/explore");
  }

  return (
    <main>
      <h1>Explore</h1>
      <p>Discover and explore academic work.</p>
    </main>
  );
}