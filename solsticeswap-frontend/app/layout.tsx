import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "SolsticeSwap - Privacy-Preserving Token Swap",
  description: "Fully encrypted order matching system that prevents front-running",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        <main className="flex flex-col min-h-screen bg-background">
          <Providers>
            <Navigation />
            {children}
          </Providers>
        </main>
      </body>
    </html>
  );
}

