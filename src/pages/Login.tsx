import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { set } from "date-fns";
import { apiFetch } from "@/api/config";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isEmail(email)) e.email = "Ogiltig e‑post";
    if (!password) e.password = "Ange lösenord";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSuccess(null);
	setErrors({});
    if (!validate()) return;
    try {
      setSubmitting(true);
      // TODO: Replace with your real API endpoint
	  const res = await apiFetch("/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
		  email: email.toLowerCase().trim(),
		  password,
		}),
		credentials: "include",
	  });
	  if (!res.ok) {
		const err = await res.json().catch(() => null);
		throw new Error(err?.detail || err?.message || `HTTP ${res.status}`);
	  }
	  // Backend return: {ok: true, user: {id, name, email}, access_token, token_type}
	  const data = await res.json();

	  // Store JWT token in localStorage
	  if (data.access_token) {
		localStorage.setItem("auth_token", data.access_token);
	  }

	  if (remember) {
		localStorage.setItem("user", JSON.stringify(data.user));
	  } else {
		sessionStorage.setItem("user", JSON.stringify(data.user));
	  }

	  setSuccess("Inloggad! Välkommen, " + data.user.name + ".");
	  navigate("/projects", { replace: true });
	} catch (err: any) {
	  setErrors({ submit: err?.message || "Fel vid inloggning" });
	} finally {
	  setSubmitting(false);
	}
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg rounded-2xl border border-border">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Logga in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E‑post</Label>
              <Input
                id="email"
                type="email"
                placeholder="namn@exempel.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v: boolean) => setRemember(v)}
                />
                Kom ihåg mig
              </label>
              <Link to="/reset-password" className="text-sm underline">Glömt lösenord?</Link>
            </div>

            {errors.submit && (
              <p className="text-sm text-destructive" role="alert">{errors.submit}</p>
            )}
            {success && (
              <p className="text-sm text-success" role="status">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Loggar in..." : "Logga in"}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Ny här? <Link to="/create-account" className="underline">Skapa konto</Link>
            </p>
            
            <p className="text-xs text-muted-foreground text-center">
              Genom att logga in godkänner du våra{" "}
              <Link 
                to="/terms-of-reference" 
                state={{ backgroundLocation: location }}
                className="underline hover:text-foreground"
              >
                villkor och uppförandekod
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
