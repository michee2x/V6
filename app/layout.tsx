import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ConditionalHeader, ConditionalFooter } from "@/components/layout/conditional-layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://recrea8.app"),
  title: {
    default: "ReCrea8 — See something you like online? Recrea8 it.",
    template: "%s — ReCrea8",
  },
  description:
    "Paste a link or upload a reference. ReCrea8 breaks it down, builds a Power Prompt, and generates your own version — right inside ReCrea8.",
  keywords: [
    "AI recreation engine",
    "reverse engineer design",
    "recreate an ad",
    "power prompt",
    "AI content recreation",
    "recrea8"
  ],
  authors: [{ name: "ReCrea8" }],
  creator: "ReCrea8",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://recrea8.app",
    siteName: "ReCrea8",
    title: "ReCrea8 — See something you like online? Recrea8 it.",
    description:
      "See something you like online? Paste it into ReCrea8. Get a Power Prompt, and your own customized version — generated right inside the app.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReCrea8 — Understand content. Create from it.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReCrea8 — See something you like online? Recrea8 it.",
    description:
      "See something you like online? Paste it into ReCrea8. Get a Power Prompt, and your own customized version — generated right inside the app.",
    images: ["/og-image.png"],
    creator: "@recrea8",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "TPX5XzG9BX9yNlCwlKwkLOV3bABiTMeGkeKUY4Y9uz8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", inter.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        {/* Google Analytics (GA4) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DZFQRY6QF8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DZFQRY6QF8');
          `}
        </Script>
        <Providers>
          <ConditionalHeader>
            <Navbar />
          </ConditionalHeader>
          {children}
          <Toaster />
          <ConditionalFooter>
            <Footer />
          </ConditionalFooter>
        </Providers>
      </body>
    </html>
  );
}
