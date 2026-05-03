import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Logo } from "./Logo";
import { toast, Toaster } from "sonner";
import { auth } from "../firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [validLink, setValidLink] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oobCode, setOobCode] = useState("");

  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (code) {
      setOobCode(code);
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          console.log("Reset code valid for:", email);
          setValidLink(true);
        })
        .catch((error) => {
          console.error("Invalid reset code:", error);
          setValidLink(false);
        });
    } else {
      setValidLink(false);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error("Please enter a new password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Password reset successful! Please sign in with your new password.");
      setTimeout(() => navigate("/resident/signin"), 2000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!validLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid or Expired Link</h1>
          <p className="text-muted-foreground mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button onClick={() => navigate("/resident/signin")} className="bg-red-600 hover:bg-red-700">
            Back to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-6">
      <Toaster position="top-right" />
      <Card className="max-w-md w-full p-8 shadow-2xl rounded-3xl">
        <Logo className="justify-center mb-6" size="md" />

        <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
        <p className="text-center text-muted-foreground mb-6">
          Enter your new password
        </p>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-12 rounded-xl pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative mt-2">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="h-12 rounded-xl pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg mt-6"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/resident/signin")}
              className="text-sm text-red-600 hover:text-red-700 hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}