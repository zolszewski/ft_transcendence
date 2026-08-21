import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default async function ReviewPage() {
const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/review");
  }
  return (
    <main>
      <h1>Review</h1>
      <p>Review submitted academic work.</p>
    </main>
  );
}