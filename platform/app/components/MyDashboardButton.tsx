"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

  type DashboardButtonProps = {
    beforeLogout?: () => Promise<boolean>;
  };
  
  
export default function MyDashboardButton({ beforeLogout }: DashboardButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
  
    async function goToDashboard() {
      setLoading(true);
  
      try {
        if (beforeLogout && !(await beforeLogout())) 
            return;
        router.push("/dashboard");
        
        } finally {
        setLoading(false);
      }
    }

  return (
    <button
      type="button"
      onClick={goToDashboard}
      className="btn-nav mr-2"
    >
      My Dashboard
    </button>
  );
}
