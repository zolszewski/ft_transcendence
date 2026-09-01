import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import  ExplorePageContent  from "./explorePage";

export default async function ExplorePage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/explore");
  }
  return (
    <ExplorePageContent />
  );
}