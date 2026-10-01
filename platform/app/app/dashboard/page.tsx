import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import DashboardForm from "./dashboardForm";

export default async function PublishPage() {

  const auth = await isAuthenticated();
    if (!auth) {
      redirect("/authentication/login?redirect=/dashboard");
    } 
    return <DashboardForm/>;
  }
