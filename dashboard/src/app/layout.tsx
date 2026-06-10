import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PeopleHard Dashboard",
  description: "A premium academic dashboard for Thapar University students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans antialiased">
        <Providers>
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden p-4 md:p-8 lg:p-10">
            <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
