import Link from "next/link";

// footer on every page (mandatory Privacy Policy / Terms of Service links)
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} OpenScholar</span>
      <nav className="flex gap-4">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
      </nav>
    </footer>
  );
}
