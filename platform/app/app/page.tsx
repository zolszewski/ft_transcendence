import Link from "next/link";
import ConnectedGallery from "@/components/ConnectedGallery";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
 
export default async function Home() {
  const user = await getCurrentUser();

  return (
    
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <div>
        {user && (
          <div className="fixed top-4 right-4">
            <LogoutButton />
          </div>
        )}
      </div>
      <ConnectedGallery />
      
      <div className="relative z-10">
        <h1 className="text-5xl font-bold">OpenScholar</h1>
 
        <p className="mt-6 text-xl flex gap-2">
          <Link href="/publish" className="hover:underline">
            Publish.
          </Link>
          <Link href="/review" className="hover:underline">
            Review.
          </Link>
          <Link href="/explore" className="hover:underline">
            Explore.
          </Link>
          <Link href="/chat" className="hover:underline">
            Chat.
          </Link>
        </p>
        
      </div>
    </main>
  );
}
 
