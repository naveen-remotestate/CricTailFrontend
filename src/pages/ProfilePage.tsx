import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User, Phone, Calendar, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{user?.full_name}</h1>
          <p className="text-muted-foreground">Player Profile</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile Number</p>
                <p className="font-medium">{user?.mobile_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">{new Date(user?.created_at || "").toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </motion.div>
    </div>
  );
}
