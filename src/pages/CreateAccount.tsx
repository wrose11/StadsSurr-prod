import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/api/config";
import { set } from "date-fns";

// Simple validators
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const pwChecks = [
  { label: "Minst 8 tecken", test: (v: string) => v.length >= 8 },
  { label: "En siffra", test: (v: string) => /\d/.test(v) },
  { label: "En versal (A–Z)", test: (v: string) => /[A-ZÅÄÖ]/.test(v) },
];

type Form = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  accept: boolean;
};

export default function CreateAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    accept: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const update = (k: keyof Form, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Ange ditt namn";
    if (!isEmail(form.email)) e.email = "Ogiltig e-post";

    const failedPw = pwChecks.filter((c) => !c.test(form.password));
    if (failedPw.length) e.password = "Lösenordet uppfyller inte kraven";
    if (form.password !== form.confirm) e.confirm = "Lösenorden matchar inte";
    if (!form.accept) e.accept = "Du måste godkänna villkoren";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSuccess(null);
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
      };

	  const res = await apiFetch("/auth/register", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		credentials: "include",
	  });

	  if (!res.ok) {
		const err = await res.json().catch(() => null);
		throw new Error(err?.detail || err?.message || `HTTP ${res.status}`);
	  }
	  
	  const data = await res.json();
	  
	  // Store JWT token in localStorage
	  if (data.access_token) {
		localStorage.setItem("auth_token", data.access_token);
	  }
	  
	  // Store user info
	  localStorage.setItem("user", JSON.stringify({ id: data.id, name: data.name, email: data.email }));
	  
	  setSuccess(`Konto skapat! Välkommen, ${data.name}.`);
	  setForm({ name: "", email: "", password: "", confirm: "", accept: false });
	  setTimeout(() => {
		navigate("/projects", { replace: true });
	  }, 1000);
	} catch (err: any) {
	  setErrors({ submit: err?.message || "Kunde inte skapa konto" });
	} finally {
	  setSubmitting(false);
	}
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-border">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Skapa konto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                placeholder="För- och efternamn"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E‑post</Label>
              <Input
                id="email"
                type="email"
                placeholder="namn@exempel.se"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Minst 8 tecken, siffra och versal"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Dölj lösenord" : "Visa lösenord"}
                >
                  {showPw ? "Dölj" : "Visa"}
                </button>
              </div>
              <ul className="grid gap-1 text-xs text-muted-foreground">
                {pwChecks.map((c) => (
                  <li key={c.label} className={c.test(form.password) ? "line-through" : ""}>
                    {c.label}
                  </li>
                ))}
              </ul>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Bekräfta lösenord</Label>
              <Input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
                aria-invalid={!!errors.confirm}
              />
              {errors.confirm && (
                <p className="text-sm text-destructive">{errors.confirm}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="accept" checked={form.accept} onCheckedChange={(v: boolean) => update("accept", v)} />
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
            {errors.accept && <p className="text-sm text-destructive">{errors.accept}</p>}

            {errors.submit && (
              <p className="text-sm text-destructive" role="alert">{errors.submit}</p>
            )}
            {success && (
              <p className="text-sm text-success" role="status">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Skapar..." : "Skapa konto"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Har du redan ett konto? <Link to="/login" className="underline">Logga in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
