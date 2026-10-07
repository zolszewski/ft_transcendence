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
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenScholar",
  description: "a 42 students project",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
      lang="en"
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
