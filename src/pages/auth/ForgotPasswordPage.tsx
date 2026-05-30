import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForgotPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type Step = "input" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("input");
  const [formData, setFormData] = useState({
    mobile_number: "",
    otp: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const forgotPassword = useForgotPassword();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.mobile_number) newErrors.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile_number)) newErrors.mobile_number = "Enter valid 10-digit number";
    if (!formData.otp) newErrors.otp = "OTP is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Min 6 characters";
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await forgotPassword.mutateAsync({
        mobile_number: formData.mobile_number,
        otp: formData.otp,
        password: formData.password,
      });
      toast.success("Password reset successful!");
      setStep("success");
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || "Reset failed";
      toast.error(message);
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
          {step === "input" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold">Reset Password</h2>
                <p className="text-sm text-muted-foreground">Enter details to reset your password</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="9876543210"
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, "") })}
                  error={errors.mobile_number}
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  error={errors.otp}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  error={errors.confirm_password}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                isLoading={forgotPassword.isPending}
              >
                Reset Password
              </Button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Password Reset!</h2>
              <p className="text-sm text-muted-foreground">Your password has been reset successfully.</p>
              <Button className="w-full" asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" className="mt-4 w-full" asChild>
        <Link to="/login" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </Button>
    </motion.div>
  );
}
