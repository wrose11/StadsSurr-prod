import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface ConsultationFormProps {
  projectId: number;
  phase: string;
  isAuthenticated: boolean;
  onSubmitted?: () => void;
}

export default function ConsultationForm({ projectId, phase, isAuthenticated, onSubmitted }: ConsultationFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Logga in för att lämna synpunkter",
        description: "Du måste vara inloggad för att skicka en synpunkt.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    if (!message.trim() || !consent) {
      toast({
        title: "Komplettera formuläret",
        description: !message.trim() ? "Skriv din synpunkt innan du skickar." : "Du måste godkänna publicering för att skicka.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${projectId}/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          project_id: projectId,
          phase,
          content: message,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Kunde inte skicka synpunkt");
      }

      setMessage("");
      setConsent(false);
      toast({ title: "Tack för din synpunkt!", description: "Vi har tagit emot den." });
      onSubmitted?.();
    } catch (err: any) {
      toast({ title: "Något gick fel", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={isAuthenticated ? "Skriv din synpunkt här..." : "Logga in för att lämna synpunkter"}
        className="min-h-[120px]"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={!isAuthenticated}
      />

      {/* <label className="inline-flex items-center gap-2 text-sm">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} disabled={!isAuthenticated} />
        <span>Godkänn ToR och att din synpunkt delas med Stockholms Stad.</span>
      </label>

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline">
          <Link
            to="/terms-of-reference"
            state={{ backgroundLocation: location }}
            onClick={(e) => e.stopPropagation()} // säkerställ att inget annat triggas
          >
            Läs villkor och uppförandekod
          </Link>
        </Button> */}

        <div className="flex items-center gap-2">
          <Checkbox id="accept" checked={consent} onCheckedChange={(v) => setConsent(!!v)} disabled={!isAuthenticated} />
          <Label htmlFor="accept" className="text-sm leading-tight">
            Jag godkänner{" "}
            <Link 
              to="/terms-of-reference" 
              state={{ backgroundLocation: location }}
              className="underline hover:text-foreground"
            >
              villkor och uppförandekod
            </Link>
          </Label>
        </div>


        <div className="flex items-center gap-2">
        <Button
          type="submit"
          variant="accent"
          disabled={!isAuthenticated || !message.trim() || !consent || submitting}
        >
          {submitting ? "Skickar..." : "Skicka synpunkt"}
        </Button>
      </div>

      {!isAuthenticated && (
        <p className="text-xs text-right text-muted-foreground">Logga in för att lämna synpunkter</p>
      )}
    </form>
  );
}
