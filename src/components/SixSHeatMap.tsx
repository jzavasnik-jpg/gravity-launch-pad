import * as React from "react";
import { cn } from "@/lib/utils";

interface SixSItem {
  name: string;
  description: string;
  score: number;
}

interface SixSHeatMapProps {
  items: SixSItem[];
  selectedName?: string;
  className?: string;
}

const defaultSixS: SixSItem[] = [
  { name: "Significance", description: "Recognition and personal value", score: 0 },
  { name: "Safe", description: "Trust, reliability, confidence", score: 0 },
  { name: "Supported", description: "Partnership, mentorship, care", score: 0 },
  { name: "Successful", description: "Achievement and competence", score: 0 },
  { name: "Surprise-and-delight", description: "Creativity and positive emotion", score: 0 },
  { name: "Sharing", description: "Community, pride, virality", score: 0 },
];

export const SixSHeatMap: React.FC<SixSHeatMapProps> = ({
  items = defaultSixS,
  selectedName,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-g-heading-2 mb-4">Six S Emotional Map</h3>
      {items.map((item) => {
        const isSelected = item.name === selectedName;
        const percentage = Math.min(Math.max(item.score, 0), 100);

        return (
          <div key={item.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "font-medium transition-colors",
                  isSelected ? "text-g-accent" : "text-g-text"
                )}
              >
                {item.name}
              </span>
              <span className="text-g-muted">{percentage}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 ease-out rounded-full",
                  isSelected
                    ? "bg-gradient-to-r from-[#4558E5] to-[#6E70FF] shadow-[0_0_10px_rgba(69,88,229,0.5)]"
                    : "bg-white/20"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-g-muted">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
