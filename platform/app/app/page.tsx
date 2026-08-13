import Link from "next/link";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">OpenScholar</h1>

      <p className="mt-6 text-xl flex gap-2">
        <Link href="/publish" className="hover:underline">
          Publish.
        </Link>
        <Link href="/review" className="hover:underline">
          Review.
        </Link>
        <Link href="/collaborate" className="hover:underline">
          Explore.
        </Link>
      </p>
    </main>
  );
}