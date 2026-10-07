
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import PublierForm from "./publishForm";

export default async function PublierPage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/publish");
  }
  return (
    <Suspense fallback={<p className="p-8">Chargement…</p>}>
      <PublierForm />
    </Suspense>
  );
}



