import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://recrea8.app"),
  title: {
    default: "recrea8",
    template: "%s — recrea8",
  },
  description:
    "Paste any link — a video, image, or article — and get an instant AI breakdown. Then turn it into a ready-to-use creative brief in seconds.",
  keywords: [
    "content analysis",
    "creative brief",
    "AI content tool",
    "video breakdown",
    "content strategy",
    "recrea8",
  ],
  authors: [{ name: "recrea8" }],
  creator: "recrea8",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://recrea8.app",
    siteName: "recrea8",
    title: "recrea8 — Paste a link, understand it. Create from it.",
    description:
      "Paste any link — a video, image, or article — and get an instant AI breakdown. Then turn it into a ready-to-use creative brief in seconds.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "recrea8 — Understand content. Create from it.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "recrea8 — Paste a link, understand it. Create from it.",
    description:
      "Paste any link — a video, image, or article — and get an instant AI breakdown. Then turn it into a ready-to-use creative brief in seconds.",
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
          <Navbar />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
