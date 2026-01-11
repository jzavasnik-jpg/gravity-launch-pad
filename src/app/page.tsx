import { Metadata } from "next";
import LandingContent from "./(marketing)/LandingContent";

export const metadata: Metadata = {
  title: "Launch Pad by Gravity | AI-Powered Market Validation",
  description:
    "Transform your product ideas into market-ready launches with AI-powered customer research, content creation, and viral marketing strategies.",
};

export default function HomePage() {
  return <LandingContent />;
}
