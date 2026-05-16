import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Landing Page Auditor | Premium Audit Reports",
  description: "Analyze and optimize landing pages with state-of-the-art AI vision and copy analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} bg-zinc-950 text-zinc-100 antialiased`}>
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950"></div>
        <main className="min-h-screen relative">
          {children}
        </main>
      </body>
    </html>
  );
}
