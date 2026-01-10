import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Launch Pad by Gravity | AI-Powered Market Validation",
  description:
    "Transform your product ideas into market-ready launches with AI-powered customer research, content creation, and viral marketing strategies.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
