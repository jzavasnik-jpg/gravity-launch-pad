import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Launch Pad by Gravity | AI-Powered Market Validation",
    template: "%s | Launch Pad by Gravity",
  },
  description:
    "Transform your product ideas into market-ready launches with AI-powered customer research, content creation, and viral marketing strategies.",
  keywords: [
    "product launch",
    "market validation",
    "AI marketing",
    "content creation",
    "customer research",
    "viral marketing",
  ],
  authors: [{ name: "Gravity" }],
  creator: "Gravity",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://launchpad.gravity.com",
    siteName: "Launch Pad by Gravity",
    title: "Launch Pad by Gravity | AI-Powered Market Validation",
    description:
      "Transform your product ideas into market-ready launches with AI-powered customer research, content creation, and viral marketing strategies.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Launch Pad by Gravity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Launch Pad by Gravity",
    description: "AI-Powered Market Validation for Product Launchers",
    images: ["/og-twitter.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
