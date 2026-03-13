import type { Metadata } from "next";
import MarketingLayoutClient from "./MarketingLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "Launch by Gravity | AI-Powered Market Validation",
    template: "%s | Launch by Gravity",
  },
  description:
    "Transform your product ideas into market-ready launches with AI-powered customer research, content creation, and viral marketing strategies.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingLayoutClient>{children}</MarketingLayoutClient>;
}
