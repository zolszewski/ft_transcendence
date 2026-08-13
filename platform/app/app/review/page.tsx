import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function ReviewPage() {
  if (!isAuthenticated()) {
    redirect("/");
  }

  return (
    <main>
      <h1>Review</h1>
      <p>Review submitted academic work.</p>
    </main>
  );
}