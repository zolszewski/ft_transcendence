import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function PublishPage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/publish");
  }

  return (
    <main>
      <h1>Publish</h1>
      <p>Create and publish your academic work.</p>
    </main>
  );
}