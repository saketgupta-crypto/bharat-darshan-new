import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { homeFor, useAuth } from "@/context/AuthContext";
import { errMsg } from "@/services/api";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast({ title: "Success", description: "Logged in successfully!" });
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/auth/login" ? from : homeFor(user.role), { replace: true });
    } catch (error) {
      const code = axios.isAxiosError(error) ? error.response?.data?.error?.code : undefined;
      if (code === "EMAIL_NOT_VERIFIED") {
        toast({ title: "Verify your email", description: "Enter the code we sent to your inbox." });
        navigate(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
      } else {
        toast({ title: "Error", description: errMsg(error, "Failed to log in. Please try again."), variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <hr></hr>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? "Signing in..." : "Sign In"}</Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/auth/signup" className="text-primary hover:underline">Sign up</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
