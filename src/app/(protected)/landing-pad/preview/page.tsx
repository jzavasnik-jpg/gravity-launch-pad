'use client';

import { HeroRef } from "@/components/architect/preview/HeroRef";
import { ProblemRef } from "@/components/architect/preview/ProblemRef";
import { SocialProofRef } from "@/components/architect/preview/SocialProofRef";
import { TransformationRef } from "@/components/architect/preview/TransformationRef";
import { ValueStackRef } from "@/components/architect/preview/ValueStackRef";
import { SecondaryCTARef } from "@/components/architect/preview/SecondaryCTARef";
import { FooterRef } from "@/components/architect/preview/FooterRef";

export default function LandingPadPreviewPage() {
    return (
        <div className="min-h-screen w-full">
            <HeroRef />
            <ProblemRef />
            <SocialProofRef />
            <TransformationRef />
            <ValueStackRef />
            <SecondaryCTARef />
            <FooterRef />
        </div>
    );
}
