import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import { errMsg } from "@/services/api";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [asGuide, setAsGuide] = useState(false);
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [pricePerDay, setPricePerDay] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await authService.register({
        name: name.trim(), email: email.trim(), password,
        ...(asGuide ? { asGuide: true, guide: {
          location: location.trim(),
          languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
          experienceYears: Number(experienceYears) || 0,
          pricePerDay: Number(pricePerDay) || 0,
        } } : {}),
      });
      toast({ title: "Account created", description: "We emailed you a 6-digit verification code." });
      navigate(`/auth/verify-email?email=${encodeURIComponent(email.trim())}${asGuide ? "&guide=1" : ""}`);
    } catch (error) {
      toast({ title: "Error", description: errMsg(error, "Failed to create account. Please try again."), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">Enter your information to create an account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">At least 8 characters with a letter and a number.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={asGuide} onChange={(e) => setAsGuide(e.target.checked)} />
              I am a tour guide (needs admin approval)
            </label>
            {asGuide && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="space-y-1"><Label htmlFor="g-loc">Base location</Label><Input id="g-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Agra, Uttar Pradesh" required /></div>
                <div className="space-y-1"><Label htmlFor="g-lang">Languages (comma separated)</Label><Input id="g-lang" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Hindi, English" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label htmlFor="g-exp">Experience (years)</Label><Input id="g-exp" type="number" min={0} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} /></div>
                  <div className="space-y-1"><Label htmlFor="g-price">Price per day (INR)</Label><Input id="g-price" type="number" min={0} value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required /></div>
                </div>
              </div>
            )}
            <hr></hr>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>{isLoading ? "Creating account..." : "Sign Up"}</Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">Sign in</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
