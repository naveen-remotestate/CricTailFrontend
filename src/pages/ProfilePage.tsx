import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";
import { usePlayerStats, useUpdateProfile } from "@/hooks/usePlayers";
import { formatPlayerName, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  Calendar, 
  LogOut, 
  Check, 
  Shield, 
  Sword,
  Settings2,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, login, token } = useAuthStore();
  const { data: playerStats } = usePlayerStats();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    batting_style: "",
    bowling_style: "",
  });

  useEffect(() => {
    if (playerStats) {
      setFormData(prev => ({
        ...prev,
        batting_style: playerStats.batting_style || "RIGHT",
        bowling_style: playerStats.bowling_style || "MEDIUM",
      }));
    }
  }, [playerStats]);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateProfile.mutateAsync(formData);
      if (user && token) {
        login({ ...user, full_name: formData.full_name }, token);
      }
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Profile</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manage your identity</p>
        </div>
        <Button 
          variant={isEditing ? "ghost" : "outline"} 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
          className="rounded-full font-bold text-[10px] uppercase tracking-widest"
        >
          {isEditing ? <X className="h-3 w-3 mr-2" /> : <Settings2 className="h-3 w-3 mr-2" />}
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {/* Identity Card */}
      <Card className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-sm">
               {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="edit-name" 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                    <Input 
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="h-10 rounded-xl font-bold border-border bg-muted/20"
                    />
                  </motion.div>
                ) : (
                  <motion.div key="view-name" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-2xl font-black tracking-tight">{formatPlayerName(user?.full_name)}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs font-bold">{user?.mobile_number}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Playing Styles */}
        <section className="space-y-3">
          <h3 className="font-black text-[11px] uppercase tracking-widest text-muted-foreground px-1">Playing Roles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Batting */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Batting</span>
                  <Sword className="h-3.5 w-3.5 text-primary/30" />
                </div>
                {isEditing ? (
                  <div className="flex gap-1.5">
                    {["RIGHT", "LEFT"].map((style) => (
                      <button
                        key={style}
                        onClick={() => setFormData({...formData, batting_style: style})}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[9px] font-black uppercase border-2 transition-all",
                          formData.batting_style === style ? "bg-primary border-primary text-white" : "border-muted bg-muted/10 text-muted-foreground"
                        )}
                      >
                        {style === "RIGHT" ? "Right" : "Left"}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-base font-black uppercase tracking-tight italic">{formData.batting_style || "NOT SET"}</p>
                )}
              </div>
            </Card>

            {/* Bowling */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Bowling</span>
                  <Shield className="h-3.5 w-3.5 text-blue-600/30" />
                </div>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    {["FAST", "MEDIUM", "SPIN", "OFF SPIN", "LEG SPIN"].map((style) => (
                      <button
                        key={style}
                        onClick={() => setFormData({...formData, bowling_style: style})}
                        className={cn(
                          "py-2 rounded-lg text-[8px] font-black uppercase border-2 transition-all",
                          formData.bowling_style === style ? "bg-blue-600 border-blue-600 text-white" : "border-muted bg-muted/10 text-muted-foreground"
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-base font-black uppercase tracking-tight italic">{formData.bowling_style || "NOT SET"}</p>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Account Info */}
        <section className="space-y-3">
          <h3 className="font-black text-[11px] uppercase tracking-widest text-muted-foreground px-1">Account Info</h3>
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border/30">
            <div className="p-4 flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Member Since</p>
                <p className="text-xs font-bold">{new Date(user?.created_at || "").toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Action Area */}
        <div className="pt-4 space-y-3">
          {isEditing && (
            <Button 
              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs gap-2 shadow-lg shadow-primary/20"
              onClick={handleUpdate}
              isLoading={updateProfile.isPending}
            >
              <Check className="h-4 w-4" /> Save Profile
            </Button>
          )}
          
          <Button
            variant="ghost"
            className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
            isLoading={logout.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
