"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Shield, Eye, Database } from "lucide-react";

/**
 * AI Consent Dialog Component
 *
 * Displays a consent dialog for AI features on first use.
 * Explains what data the AI will access and requires explicit user consent.
 * Stores consent preference in localStorage.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onConsent - Callback when user grants consent
 * @param {function} props.onDecline - Callback when user declines consent
 *
 * @example
 * ```tsx
 * <AIConsentDialog
 *   open={showConsent}
 *   onConsent={() => setAIEnabled(true)}
 *   onDecline={() => setShowConsent(false)}
 * />
 * ```
 */
interface AIConsentDialogProps {
  open: boolean;
  onConsent: () => void;
  onDecline: () => void;
}

export function AIConsentDialog({
  open,
  onConsent,
  onDecline,
}: AIConsentDialogProps) {
  const [understood, setUnderstood] = useState(false);

  // Reset checkbox when the dialog opens
  useEffect(() => {
    if (open) {
      setUnderstood(false);
    }
  }, [open]);

  const handleConsent = () => {
    if (!understood) return;

    // Store consent in localStorage
    localStorage.setItem("banb_ai_consent", "granted");
    localStorage.setItem("banb_ai_consent_date", new Date().toISOString());

    onConsent();
  };

  const handleDecline = () => {
    localStorage.setItem("banb_ai_consent", "declined");
    onDecline();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDecline()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle>Enable AI Banking Assistant</DialogTitle>
          </div>
        </DialogHeader>

        <div className="text-muted-foreground text-sm text-left space-y-4 pt-4">
          <p>
            Our AI assistant can help you manage your banking by analyzing your
            data and suggesting actions.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">What the AI can access:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                  <li>Your USDC balance</li>
                  <li>Transaction history</li>
                  <li>Saved recipients</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Security measures:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                  <li>All operations require your confirmation</li>
                  <li>Your private keys are never shared</li>
                  <li>Conversations are not stored permanently</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Audit trail:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All AI operations are logged for your security and can be
                  reviewed in your history.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="understand"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked === true)}
            />
            <label
              htmlFor="understand"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I understand what data the AI will access and how it will be used
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="w-full sm:w-auto"
          >
            Not Now
          </Button>
          <Button
            onClick={handleConsent}
            disabled={!understood}
            className="w-full sm:w-auto"
          >
            Enable AI Assistant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to check if the user has granted AI consent.
 * Returns consent status and functions to manage consent.
 *
 * @returns {Object} Consent state and functions
 * @returns {boolean | null} return.hasConsent - Consent status (null if not set)
 * @returns {function} return.grantConsent - Function to grant consent
 * @returns {function} return.revokeConsent - Function to revoke consent
 * @returns {function} return.checkConsent - Function to check current consent
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { hasConsent, grantConsent, revokeConsent } = useAIConsent();
 *
 *   if (hasConsent === null) {
 *     return <AIConsentDialog onConsent={grantConsent} />;
 *   }
 *
 *   return hasConsent? <AIChat />: <div>AI disabled</div>;
 * }
 * ```
 */
export function useAIConsent(): {
  hasConsent: boolean | null;
  grantConsent: () => void;
  revokeConsent: () => void;
  checkConsent: () => void;
} {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = () => {
    const consent = localStorage.getItem("banb_ai_consent");
    setHasConsent(consent === "granted");
  };

  const grantConsent = () => {
    localStorage.setItem("banb_ai_consent", "granted");
    localStorage.setItem("banb_ai_consent_date", new Date().toISOString());
    setHasConsent(true);
  };

  const revokeConsent = () => {
    localStorage.setItem("banb_ai_consent", "declined");
    localStorage.removeItem("banb_ai_consent_date");
    setHasConsent(false);
  };

  return {
    hasConsent,
    grantConsent,
    revokeConsent,
    checkConsent,
  };
}
