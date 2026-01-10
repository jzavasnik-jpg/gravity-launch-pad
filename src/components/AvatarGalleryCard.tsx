import { Card } from "@/components/ui/card";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AvatarProfile } from "@/components/AvatarProfile";
import { useState } from "react";
import { smartCapitalize } from "@/lib/utils";

export interface AvatarCardData {
  photo_url: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  topInsight?: string;
  story?: string;
  isPlaceholder?: boolean;
  pain_points?: string[];
  daily_challenges?: string[];
  dreams?: string[];
  buying_triggers?: string[];
  pain_points_matrix?: any;
  six_s_scores?: any;
  id?: string;
}

interface AvatarGalleryCardProps {
  avatars?: AvatarCardData[];
  onViewDetails?: (avatar: AvatarCardData) => void;
}

function generateAvatarStory(avatar: AvatarCardData): string {
  if (avatar.story) return smartCapitalize(avatar.story);

  // If we have daily challenges and dreams, combine them
  if (avatar.daily_challenges && avatar.daily_challenges.length > 0) {
    const challenge = avatar.daily_challenges[0];
    const dream = avatar.dreams?.[0];

    if (dream) {
      return `${challenge} ${dream}`;
    }
    return challenge;
  }

  return `A professional navigating the complexities of their field with determination and vision.`;
}

export const PLACEHOLDER_AVATARS: AvatarCardData[] = [
  {
    photo_url: "/avatars/female/Middle_aged_european_woman1.jpg",
    name: "Sarah Mitchell",
    age: 42,
    gender: "Female",
    occupation: "Marketing Director",
    story: "Sarah leads marketing at a mid-sized tech company, constantly balancing creativity with data-driven results.",
    topInsight: "Needs proven systems that work, not another tool to learn",
    isPlaceholder: true,
    pain_points: [
      "She struggles to prove the ROI of her marketing campaigns to the executive team.",
      "She feels overwhelmed by managing too many disconnected tools and platforms.",
      "She faces constant pressure to deliver better results with a limited budget."
    ],
    daily_challenges: [
      "She spends hours coordinating campaigns across multiple channels manually.",
      "She battles to get executive buy-in for her new strategic initiatives.",
      "She manages a small but ambitious team that needs constant guidance."
    ],
    dreams: [
      "She dreams of building a marketing system that runs like clockwork.",
      "She aspires to become known as a strategic leader, not just a tactician.",
      "She wants to create campaigns that consistently generate high-quality pipeline."
    ],
    buying_triggers: [
      "She sees case studies from similar companies that achieved success.",
      "She is offered a free trial or pilot program to test the waters.",
      "She receives a clear implementation timeline that fits her schedule."
    ],
    pain_points_matrix: {
      Significance: {
        score: 8,
        challenges: [
          "She feels her strategic value is often overlooked by the board.",
          "She worries that her team's hard work isn't being recognized.",
          "She struggles to articulate her personal impact on revenue growth."
        ]
      },
      Safe: {
        score: 6,
        challenges: [
          "She fears choosing the wrong tool will damage her reputation.",
          "She is anxious about data security and compliance risks.",
          "She worries about the stability of new vendor relationships."
        ]
      },
      Supported: {
        score: 7,
        challenges: [
          "She feels isolated without a reliable vendor support team.",
          "She lacks a mentor to guide her through complex decisions.",
          "She struggles to find a community of peers for advice."
        ]
      },
      Successful: {
        score: 9,
        challenges: [
          "She is terrified of missing her quarterly pipeline targets.",
          "She feels incompetent when campaigns fail to perform.",
          "She struggles to demonstrate tangible success metrics."
        ]
      },
      "Surprise-and-delight": {
        score: 5,
        challenges: [
          "She finds it hard to stand out in a crowded market.",
          "She is bored with generic marketing tactics that lack creativity.",
          "She misses the joy of launching truly innovative campaigns."
        ]
      },
      Sharing: {
        score: 6,
        challenges: [
          "She struggles to build her personal brand as a thought leader.",
          "She finds it difficult to share her successes with her network.",
          "She feels disconnected from the broader marketing community."
        ]
      }
    }
  },
  {
    photo_url: "/avatars/male/Middle_aged_caucasian_man1.jpg",
    name: "Marcus Johnson",
    age: 38,
    gender: "Male",
    occupation: "Startup Founder",
    story: "Marcus bootstrapped his SaaS startup to $2M ARR but hit a growth plateau.",
    topInsight: "Ready to invest in growth, but needs the right strategy first",
    isPlaceholder: true,
    pain_points: [
      "His revenue has plateaued for over 6 months despite his best efforts.",
      "He is exhausted from wearing too many hats as a solo founder.",
      "He feels he can't compete with well-funded competitors in his space."
    ],
    daily_challenges: [
      "He struggles to decide which growth lever to pull next.",
      "He spends too much time finding and retaining senior talent.",
      "He constantly balances product development with sales duties."
    ],
    dreams: [
      "He aims to scale his company to $10M ARR in the next 2 years.",
      "He wants to build a company culture that attracts A-players.",
      "He aspires to establish market leadership in his specific niche."
    ],
    buying_triggers: [
      "He receives a referral from a trusted fellow founder.",
      "He sees a clear ROI calculator or financial projections.",
      "He is offered flexible payment terms that match his cash flow."
    ],
    pain_points_matrix: {
      Significance: {
        score: 9,
        challenges: [
          "He feels stuck and unable to break through his growth ceiling.",
          "He worries that his vision is not being fully realized.",
          "He struggles to gain recognition as a serious industry player."
        ]
      },
      Safe: {
        score: 8,
        challenges: [
          "He fears the financial risk of making the wrong investment.",
          "He is anxious about running out of runway before scaling.",
          "He worries about the long-term viability of his business model."
        ]
      },
      Supported: {
        score: 7,
        challenges: [
          "He feels lonely and needs guidance from a mentor or advisor.",
          "He lacks a support network of other founders at his stage.",
          "He struggles to find reliable partners who understand his vision."
        ]
      },
      Successful: {
        score: 10,
        challenges: [
          "He is desperate to hit his next major funding milestone.",
          "He feels like a failure when growth targets are missed.",
          "He struggles to prove his company's potential to investors."
        ]
      },
      "Surprise-and-delight": {
        score: 4,
        challenges: [
          "He finds it hard to differentiate his product from competitors.",
          "He is tired of the same old growth hacks that don't work.",
          "He craves a breakthrough idea that will excite the market."
        ]
      },
      Sharing: {
        score: 5,
        challenges: [
          "He struggles to build his personal founder brand online.",
          "He finds it difficult to share his journey authentically.",
          "He feels invisible in the broader startup ecosystem."
        ]
      }
    }
  }
];

export const FULL_EXAMPLE_AVATARS = PLACEHOLDER_AVATARS;

export function AvatarGalleryCard({ avatars = PLACEHOLDER_AVATARS, onViewDetails }: AvatarGalleryCardProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarCardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewClick = (avatar: AvatarCardData) => {
    if (avatar.isPlaceholder) {
      setSelectedAvatar(avatar);
      setIsModalOpen(true);
    } else if (onViewDetails) {
      onViewDetails(avatar);
    }
  };

  return (
    <>
      <div className="flex gap-6 overflow-x-auto pb-4 px-2">
        {avatars.map((avatar, index) => (
          <Card
            key={avatar.id || index}
            className="w-[360px] flex-shrink-0 bg-background/5 backdrop-blur-lg border-border/10 hover:bg-background/10 transition-all p-6"
          >
            <div className="flex gap-4 mb-4">
              <img
                src={avatar.photo_url}
                alt={avatar.name}
                className="w-20 h-20 rounded-lg object-cover ring-2 ring-primary/20"
              />
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-lg text-g-text">{avatar.name}</h3>
                <p className="text-xs uppercase text-g-muted tracking-wide">{avatar.gender}</p>
                <p className="text-sm text-g-text mt-1">{avatar.age} • {avatar.occupation}</p>
              </div>
            </div>
            <p className="text-sm text-g-text text-left leading-relaxed mb-4">
              {generateAvatarStory(avatar)}
            </p>
            <div className="italic text-g-muted text-xs text-left mb-4 border-l-2 border-primary/30 pl-3">
              "{avatar.topInsight || 'Ready to transform their approach...'}"
            </div>
            <PrimaryButton
              onClick={() => handleViewClick(avatar)}
              className="w-full"
            >
              {avatar.isPlaceholder ? 'View Example' : 'View Details'}
            </PrimaryButton>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-g-bg-1/95 border-g-border">
          <DialogTitle className="sr-only">Avatar Profile</DialogTitle>
          {selectedAvatar && (
            <AvatarProfile avatar={selectedAvatar} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
