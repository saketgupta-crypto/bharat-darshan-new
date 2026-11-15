import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user.service";
import { errMsg } from "@/services/api";

const STYLES = ["Adventure", "Spiritual", "Historical", "Nature", "Luxury", "Budget", "Family", "Romantic", "Cultural"];

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [styles, setStyles] = useState<string[]>(user?.preferences?.travelStyles ?? []);
  const [budgetRange, setBudgetRange] = useState(user?.preferences?.budgetRange ?? "");
  const [dietary, setDietary] = useState(user?.preferences?.dietary ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updated = await userService.updateProfile({ name: name.trim(), phone: phone.trim(), preferences: { travelStyles: styles, budgetRange, dietary } });
      setUser(updated);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }); }
    finally { setIsUpdating(false); }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwBusy(true);
    try {
      await userService.changePassword(cur, next);
      toast({ title: "Password changed", description: "Please log in again." });
      await logout();
    } catch (err) { toast({ title: "Error", description: errMsg(err), variant: "destructive" }); }
    finally { setPwBusy(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Update your personal information and travel preferences</CardDescription></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={user?.email ?? ""} disabled /></div>
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} /></div>
            <div className="space-y-2"><Label>Preferred travel styles</Label>
              <div className="flex flex-wrap gap-2">{STYLES.map((s) => <Button key={s} type="button" size="sm" className="rounded-full" variant={styles.includes(s) ? "default" : "outline"} onClick={() => setStyles((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}>{s}</Button>)}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="budget">Usual budget range</Label><Input id="budget" value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} placeholder="e.g. 20k-40k" maxLength={30} /></div>
              <div className="space-y-2"><Label htmlFor="diet">Dietary preference</Label><Input id="diet" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Vegetarian" maxLength={60} /></div>
            </div>
            <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save changes"}</Button>
          </CardContent>
        </form>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle><CardDescription>You will be signed out of all devices</CardDescription></CardHeader>
        <form onSubmit={changePw}>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="cur">Current password</Label><Input id="cur" type="password" value={cur} onChange={(e) => setCur(e.target.value)} required autoComplete="current-password" /></div>
            <div className="space-y-2"><Label htmlFor="new">New password</Label><Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" /></div>
            <Button type="submit" variant="outline" disabled={pwBusy}>{pwBusy ? "Updating..." : "Change password"}</Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
