import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    mobile_number: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.mobile_number)
      newErrors.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile_number))
      newErrors.mobile_number = "Enter valid 10-digit mobile number";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login.mutateAsync(formData);
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="9876543210"
                value={formData.mobile_number}
                onChange={(e) =>
                  setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, "") })
                }
                error={errors.mobile_number}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  error={errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={login.isPending}
            >
              Login
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </Link>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
        <Link to="/" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </motion.div>
  );
}
