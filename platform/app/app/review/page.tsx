import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import ReviewList from "./review-list";
 
export default async function ReviewPage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect("/authentication/login?redirect=/review");
  }
 
  return <ReviewList />;
}
 
