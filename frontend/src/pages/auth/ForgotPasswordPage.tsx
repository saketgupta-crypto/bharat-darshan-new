import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { errMsg } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await authService.forgotPassword(email.trim()); setSent(true); }
    catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot password</CardTitle>
          <CardDescription className="text-center">We will email you a reset link</CardDescription>
        </CardHeader>
        {sent ? (
          <CardContent className="text-center space-y-4 pb-6">
            <p className="text-sm text-muted-foreground">If an account exists for {email}, a reset link is on its way. It expires in 30 minutes.</p>
            <Link to="/auth/login" className="text-primary hover:underline text-sm">Back to login</Link>
          </CardContent>
        ) : (
          <form onSubmit={submit}>
            <CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button className="w-full" type="submit" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</Button>
              <Link to="/auth/login" className="text-sm text-primary hover:underline">Back to login</Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
