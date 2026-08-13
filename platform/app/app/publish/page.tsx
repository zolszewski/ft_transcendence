import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function PublishPage() {
  if (!isAuthenticated()) {
    redirect("/");
  }

  return (
    <main>
      <h1>Publish</h1>
      <p>Create and publish your academic work.</p>
    </main>
  );
}