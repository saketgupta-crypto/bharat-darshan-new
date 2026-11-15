import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { errMsg } from "@/services/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
    setBusy(true);
    try {
      await authService.resetPassword(email, token, password);
      toast({ title: "Password updated", description: "Please log in with your new password." });
      navigate("/auth/login", { replace: true });
    } catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset password</CardTitle>
          <CardDescription className="text-center">Choose a new password for {email || "your account"}</CardDescription>
        </CardHeader>
        {!email || !token ? (
          <CardContent className="text-center pb-6 space-y-3"><p className="text-sm text-muted-foreground">This reset link is invalid.</p><Link to="/auth/forgot-password" className="text-primary hover:underline text-sm">Request a new link</Link></CardContent>
        ) : (
          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></div>
              <div className="space-y-2"><Label htmlFor="pw2">Confirm password</Label><Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" /></div>
            </CardContent>
            <CardFooter><Button className="w-full" type="submit" disabled={busy}>{busy ? "Saving..." : "Reset password"}</Button></CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
