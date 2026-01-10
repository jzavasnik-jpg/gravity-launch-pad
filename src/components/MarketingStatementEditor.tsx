import React, { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useApp } from "@/context/AppContext";
import { PrimaryButton } from "./PrimaryButton";
import { Copy, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { generateMarketingStatements } from "@/lib/api";
import { saveMarketingStatements } from "@/lib/database-service";

interface MarketingStatementEditorProps {
  statements: {
    solution_statement?: string;
    usp_statement?: string;
    transformation_statement?: string;
  };
  avatarName: string;
}

export const MarketingStatementEditor: React.FC<MarketingStatementEditorProps> = ({
  statements,
  avatarName,
}) => {
  const { appState, setMarketingStatements } = useApp();
  const [editing, setEditing] = useState({
    solution_statement: statements.solution_statement || "",
    usp_statement: statements.usp_statement || "",
    transformation_statement: statements.transformation_statement || "",
  });
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to Firebase if we have an avatar ID
      if (appState.avatarData?.id) {
        await saveMarketingStatements(appState.avatarData.id, editing);
        console.log('[MarketingStatementEditor] Saved to Firebase');
      }

      setMarketingStatements(editing);
      toast.success("Marketing statements saved!");
    } catch (error) {
      console.error("Error saving statements:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const newStatements = await generateMarketingStatements(
        appState.gravityICP.answers,
        appState.selectedCoreDesire,
        appState.selectedSixS,
        appState.avatarData
      );

      // Save to Firebase immediately after regeneration
      if (appState.avatarData?.id) {
        await saveMarketingStatements(appState.avatarData.id, newStatements);
        console.log('[MarketingStatementEditor] Regenerated and saved to Firebase');
      }

      setEditing(newStatements);
      setMarketingStatements(newStatements);
      toast.success("Marketing statements regenerated!");
    } catch (error) {
      toast.error("Failed to regenerate statements. Please try again.");
      console.error(error);
    } finally {
      setRegenerating(false);
    }
  };

  const StatementCard = ({
    title,
    field,
    placeholder,
  }: {
    title: string;
    field: keyof typeof editing;
    placeholder: string;
  }) => (
    <GlassPanel padding="md" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-g-text">{title}</h3>
        <button
          onClick={() => handleCopy(editing[field], title)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4 text-g-muted" />
        </button>
      </div>
      <textarea
        value={editing[field]}
        onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
        placeholder={placeholder}
        className="w-full min-h-[120px] bg-white/5 border border-g-border rounded-lg p-4 text-g-text placeholder:text-g-muted focus:outline-none focus:border-g-accent resize-none"
      />
      <div className="text-xs text-g-muted text-right">
        {editing[field].length} characters
      </div>
    </GlassPanel>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-g-text">Marketing Statements</h2>
          <p className="text-g-muted">Edit and refine your messaging for {avatarName}</p>
        </div>
        <div className="flex gap-3">
          <PrimaryButton onClick={handleRegenerate} size="lg" disabled={regenerating || saving} loading={regenerating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate
          </PrimaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </PrimaryButton>
        </div>
      </div>

      <div className="grid gap-6">
        <StatementCard
          title="Solution Statement"
          field="solution_statement"
          placeholder="Describe the solution your product/service provides..."
        />
        <StatementCard
          title="Unique Selling Proposition"
          field="usp_statement"
          placeholder="What makes your offering uniquely valuable..."
        />
        <StatementCard
          title="Transformation Statement"
          field="transformation_statement"
          placeholder="Describe the transformation your customer will experience..."
        />
      </div>
    </div>
  );
};
