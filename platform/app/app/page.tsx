import Link from "next/link";
import ConnectedGallery from "@/components/ConnectedGallery";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
 
export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
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
        </p>
        {user && (
          <div className="mt-6 flex justify-center">
            <LogoutButton />
          </div>
        )}
      </div>
    </main>
  );
}
 
