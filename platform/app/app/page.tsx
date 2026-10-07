import Link from "next/link";
import ConnectedGallery from "@/components/ConnectedGallery";
import LogoutButton from "@/components/LogoutButton";
import MyDashboardButton from "@/components/MyDashboardButton";
import { getCurrentUser } from "@/lib/auth";
 
export default async function Home() {
  const user = await getCurrentUser();

  return (
    
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div>
        {user && (
          <div className="fixed top-4 right-4 flex items-center">
            <MyDashboardButton />
            <LogoutButton />
          </div>
        )}
      </div>
      <ConnectedGallery />
      
      <div className="relative z-10">
        <h1 className="text-5xl font-bold">OpenScholar</h1>
 
        <p className="mt-6 text-xl flex gap-2">
          <Link href="/publish" className="hover:underline">
            Publier.
          </Link>
          <Link href="/review" className="hover:underline">
            Relire.
          </Link>
          <Link href="/explore" className="hover:underline">
            Explorer.
          </Link>
          <Link href="/chat" className="hover:underline">
            Echanger.
          </Link>
        </p>
        
      </div>
    </main>
  );
}
 
