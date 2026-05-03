import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast, Toaster } from "sonner";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

export function BHWSignIn() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({ userId: "", password: "" });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      let email = "";
      
      const isBHWId = /^BHW-\d{4}-\d{3}$/.test(formData.userId);
      
      if (isBHWId) {
        const q = query(collection(db, "bhws"), where("idNumber", "==", formData.userId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          toast.error("Invalid BHW ID");
          setLoading(false);
          return;
        }
        
        const bhwData = querySnapshot.docs[0].data();
        email = bhwData.personalEmail;
      } else if (formData.userId.includes("@")) {
        email = formData.userId;
      } else {
        toast.error("Invalid BHW ID");
        setLoading(false);
        return;
      }
      
      await signInWithEmailAndPassword(auth, email, formData.password);
      toast.success("Welcome back!");
      setTimeout(() => navigate("/bhw/dashboard"), 500);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Invalid BHW ID or password");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
      toast.success("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setResetEmail("");
      }, 3000);
    } catch (error: any) {
      toast.error("No account found with this email address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-right" />
      
      <button 
        onClick={() => navigate("/")} 
        className="fixed top-6 left-6 flex items-center gap-1 text-gray-400 hover:text-gray-700 transition z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[380px]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <img src="/logo.png" alt="KomuniCare" className="w-14 h-14 rounded-full" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">KomuniCare</h1>
            <p className="text-xs text-gray-400 mt-1">BHW Portal</p>
          </div>

          {!showForgotPassword ? (
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-1">BHW ID</label>
                <Input 
                  type="text" 
                  placeholder=""
                  value={formData.userId} 
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })} 
                  className="h-10 rounded-md border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200"
                  required 
                />
                <p className="text-[10px] text-gray-400 mt-1">Use your BHW ID or Email</p>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder=""
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    className="h-10 rounded-md border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200 pr-10"
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-4">
                <button 
                  type="button" 
                  onClick={() => navigate("/bhw/register")} 
                  className="text-xs text-gray-700 hover:underline"
                >
                  Don't have an account? Sign Up
                </button>
              </div>

              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-800 h-10 rounded-md text-sm font-normal mb-4"
              >
                {loading ? "Signing In..." : "Log In"}
              </Button>

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)} 
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Forgot your password?
                </button>
              </div>

              <div className="text-center pt-8 mt-4 border-t border-gray-100">
                <div className="flex justify-center gap-3 text-xs text-gray-400">
                  <Link to="/privacy-policy" className="hover:text-gray-700">Privacy Policy</Link>
                  <span>|</span>
                  <Link to="/terms" className="hover:text-gray-700">Terms & Conditions</Link>
                  <span>|</span>
                  <Link to="/#contact" className="hover:text-gray-700">Contact Us</Link>
                </div>
              </div>
            </form>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
              {resetSent ? (
                <div className="text-center py-6">
                  <p className="text-green-600 mb-2">Reset email sent!</p>
                  <p className="text-sm text-gray-500">Check {resetEmail}</p>
                  <button 
                    onClick={() => setShowForgotPassword(false)} 
                    className="text-sm text-gray-700 mt-4"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
                  <p className="text-sm text-gray-500 mb-4">Enter your email to reset your password</p>
                  <Input 
                    type="email" 
                    placeholder="Email address" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    className="h-10 rounded-md border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200 mb-4"
                    required 
                  />
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gray-700 hover:bg-gray-800 h-10 rounded-md"
                  >
                    Send Reset Link
                  </Button>
                  <button 
                    onClick={() => setShowForgotPassword(false)} 
                    className="text-sm text-gray-700 mt-4 block w-full text-center"
                  >
                    Back to Login
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}