
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import PublishForm from "./publishForm";

export default async function PublishPage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/publish");
  }
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <PublishForm />
    </Suspense>
  );
}



