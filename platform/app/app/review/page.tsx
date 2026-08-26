import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function ReviewPage() {
const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/review");
  }
  return (
    <main>
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="border px-4 py-2 hover:underline">
          Home
        </Link>
        <LogoutButton />
      </header>
      <h1>Review</h1>
      <p>Review submitted academic work.</p>
    </main>
  );
}