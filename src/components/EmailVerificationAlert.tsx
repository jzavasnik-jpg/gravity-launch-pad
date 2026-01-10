import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail } from "lucide-react";
import { useState } from "react";
import { resendVerificationEmail } from "@/lib/auth-service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface EmailVerificationAlertProps {
  email: string;
  className?: string;
}

export const EmailVerificationAlert = ({ email, className }: EmailVerificationAlertProps) => {
  const [loading, setLoading] = useState(false);
  const { checkEmailVerification } = useAuth();

  const handleResendVerification = async () => {
    setLoading(true);
    const { error } = await resendVerificationEmail(email);
    setLoading(false);

    if (error) {
      toast.error("Failed to resend verification email. Please try again.");
    } else {
      toast.success("Verification email sent! Please check your inbox.");
    }
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Email Verification Required</AlertTitle>
      <AlertDescription className="flex flex-col gap-2 mt-2">
        <p>
          Please verify your email address to access content creation features. Check your inbox
          for a verification link.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={loading}
            className="w-fit"
          >
            <Mail className="mr-2 h-4 w-4" />
            {loading ? "Sending..." : "Resend Verification Email"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              setLoading(true);
              const verified = await checkEmailVerification();
              setLoading(false);
              if (verified) {
                toast.success("Email verified successfully!");
              } else {
                toast.error("Email not verified yet. Please check your inbox.");
              }
            }}
            disabled={loading}
            className="w-fit"
          >
            I've verified my email
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
