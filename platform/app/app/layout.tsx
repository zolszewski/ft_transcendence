import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { ChatProvider } from "@/components/chat/ChatProvider";
import ChatDock from "@/components/chat/ChatDock";
import SiteFooter from "@/components/SiteFooter";

//mounts the ChatProvider (holds all the chat state)


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "OpenScholar",
  description: "Projet étudiant 42",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //grab the logged-in user's id
  const user = await getCurrentUser();

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ChatProvider userId={user?.id ?? null}>
          {children}
          {/* Privacy Policy / Terms of Service links, on every page */}
          <SiteFooter />
          {/* chat dock, bottom right on every page */}
          <ChatDock />
        </ChatProvider>
      </body>
    </html>
  );
}
