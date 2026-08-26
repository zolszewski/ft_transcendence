import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function ExplorePage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/explore");
  }

  return (
    <main>
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="border px-4 py-2 hover:underline">
          Home
        </Link>
        <LogoutButton />
      </header>
      <h1>Explore</h1>
      <p>Discover and explore academic work.</p>
    </main>
  );
}