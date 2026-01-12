import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
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
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
