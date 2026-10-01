import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import FriendsPageClient from "./friendsPageClient";

export default async function FriendsPage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/friends");
  }
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <FriendsPageClient />
    </Suspense>
  );
}
