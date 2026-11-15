import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { errMsg } from "@/services/api";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const isGuide = params.get("guide") === "1";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authService.verifyEmail(email.trim(), otp.trim());
      toast({ title: "Email verified", description: isGuide ? "Your guide account is awaiting admin approval. You can log in once approved." : "You can now log in." });
      navigate("/auth/login", { replace: true });
    } catch (err) {
      toast({ title: "Error", description: errMsg(err), variant: "destructive" });
    } finally { setBusy(false); }
  };
  const resend = async () => {
    try { await authService.resendOtp(email.trim()); toast({ title: "Code sent", description: "If the account exists, a new code was emailed." }); }
    catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">Enter the 6-digit code we emailed you (valid for 10 minutes)</CardDescription>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="otp">Verification code</Label><Input id="otp" inputMode="numeric" pattern="\d{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required className="tracking-[0.5em] text-center text-lg" /></div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button className="w-full" type="submit" disabled={busy || otp.length !== 6}>{busy ? "Verifying..." : "Verify"}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={resend} disabled={!email}>Resend code</Button>
            <Link to="/auth/login" className="text-sm text-primary hover:underline">Back to login</Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
