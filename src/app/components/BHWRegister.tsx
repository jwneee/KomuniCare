import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { ArrowLeft, Briefcase, IdCard, Lock, Eye, EyeOff, MapPin, Phone, Upload, X, User, Mail, CheckCircle, XCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import { db, storage, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { TermsModal } from "./TermsModal";

export function BHWRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    personalEmail: "",
    barangay: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [emailSent, setEmailSent] = useState(false);

  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  const validateFullName = (name: string) => {
    const nameRegex = /^[A-Za-z\s\.\-]+$/;
    return nameRegex.test(name) && name.trim().length >= 2;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
  };

  const checkPasswordStrength = (password: string) => {
    setPasswordChecks({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const isPasswordValid = () => {
    return Object.values(passwordChecks).every(check => check === true);
  };

  const uploadFile = async (file: File | null, path: string): Promise<string> => {
    if (!file) {
      throw new Error("No file provided");
    }
    const timestamp = Date.now();
    const filename = `${path}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password") {
      checkPasswordStrength(value);
    }
  };

  const handleRegisterClick = () => {
    if (!validateFullName(formData.name)) {
      toast.error("Please enter a valid full name (letters only, no numbers or symbols)");
      return;
    }
    if (!validateEmail(formData.personalEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }
    if (!formData.barangay.trim()) {
      toast.error("Please enter your assigned barangay");
      return;
    }
    if (!isPasswordValid()) {
      toast.error("Please meet all password requirements");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!idPhoto) {
      toast.error("Please upload a valid ID (proof that you are from New Kalalake)");
      return;
    }
    if (!profilePhoto) {
      toast.error("Please upload a profile picture");
      return;
    }
    setShowTerms(true);
    setPendingSubmit(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setUploading(true);

    try {
      const idPhotoURL = await uploadFile(idPhoto, "bhw_ids");
      const profilePhotoURL = await uploadFile(profilePhoto, "bhw_profiles");

      const { user } = await createUserWithEmailAndPassword(auth, formData.personalEmail, formData.password);
      await sendEmailVerification(user);
      setEmailSent(true);

      await addDoc(collection(db, "pending_bhws"), {
        name: formData.name,
        personalEmail: formData.personalEmail,
        barangay: formData.barangay,
        phone: formData.phone,
        idPhoto: idPhotoURL,
        profilePhoto: profilePhotoURL,
        status: "pending",
        createdAt: new Date(),
        uid: user.uid,
        password: formData.password,
      });

      toast.success("Registration submitted! Please check your email to verify your account.");
      toast.info("Once verified, admin will review and approve your application.");
      setTimeout(() => navigate("/bhw/signin"), 5000);
    } catch (error: any) {
      console.error("Error registering:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already registered");
      } else {
        toast.error(error.message || "Registration failed");
      }
    } finally {
      setLoading(false);
      setUploading(false);
      setPendingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <Toaster position="top-right" />
      
      <TermsModal
        open={showTerms}
        onOpenChange={setShowTerms}
        onAgree={handleSubmit}
        title="BHW Terms & Conditions"
        userType="bhw"
      />
      
      <div className="max-w-md mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-8 shadow-xl rounded-3xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Register as BHW</h1>
            <p className="text-muted-foreground text-sm">Create your Barangay Health Worker account</p>
          </div>

          {emailSent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Verification Email Sent!</h2>
              <p className="text-gray-500 text-sm">
                Please check your email <strong>{formData.personalEmail}</strong> and click the verification link.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                After verification, wait for admin approval.
              </p>
              <Button 
                onClick={() => navigate("/bhw/signin")} 
                className="mt-6 bg-green-600 hover:bg-green-700"
              >
                Go to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
              <div>
                <Label className="flex items-center gap-2"><User className="w-4 h-4" /> Full Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => handleChange("name", e.target.value)} 
                  placeholder="Juan Dela Cruz" 
                  className={`mt-2 border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.name && !validateFullName(formData.name) && formData.name !== "" ? "border-blue-900" : ""}`}
                  required 
                />
                {formData.name && !validateFullName(formData.name) && (
                  <p className="text-xs text-blue-900 mt-1">Letters only, no numbers or symbols</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Personal Email Address</Label>
                <Input 
                  type="email" 
                  value={formData.personalEmail} 
                  onChange={(e) => handleChange("personalEmail", e.target.value)} 
                  placeholder="juan@example.com" 
                  className={`mt-2 border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.personalEmail && !validateEmail(formData.personalEmail) && formData.personalEmail !== "" ? "border-blue-900" : ""}`}
                  required 
                />
                {formData.personalEmail && !validateEmail(formData.personalEmail) && (
                  <p className="text-xs text-blue-900 mt-1">Enter a valid email address</p>
                )}
                <p className="text-xs text-gray-400 mt-1">You will receive a verification email here</p>
              </div>

              <div>
                <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Assigned Barangay</Label>
                <Input 
                  value={formData.barangay} 
                  onChange={(e) => handleChange("barangay", e.target.value)} 
                  placeholder="Barangay New Kalalake" 
                  className="mt-2 border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200"
                  required 
                />
              </div>

              <div>
                <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Contact Number</Label>
                <Input 
                  type="tel" 
                  placeholder="09123456789" 
                  value={formData.phone} 
                  onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} 
                  className={`mt-2 border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.phone && !validatePhone(formData.phone) && formData.phone !== "" ? "border-blue-900" : ""}`}
                  required 
                />
                {formData.phone && !validatePhone(formData.phone) && (
                  <p className="text-xs text-blue-900 mt-1">Exactly 11 digits (e.g., 09123456789)</p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2"><IdCard className="w-4 h-4" /> Valid ID (Proof that you are from New Kalalake)</Label>
                {!idPhotoPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 mt-2">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload ID</p>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { setIdPhoto(file); setIdPhotoPreview(URL.createObjectURL(file)); }
                    }} />
                  </label>
                ) : (
                  <div className="relative mt-2">
                    <img src={idPhotoPreview} alt="ID Preview" className="w-full h-32 object-contain border rounded-lg" />
                    <button type="button" onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2"><User className="w-4 h-4" /> Profile Picture</Label>
                {!profilePhotoPreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 mt-2">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload profile picture</p>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { setProfilePhoto(file); setProfilePhotoPreview(URL.createObjectURL(file)); }
                    }} />
                  </label>
                ) : (
                  <div className="relative mt-2">
                    <img src={profilePhotoPreview} alt="Profile Preview" className="w-24 h-24 object-cover rounded-full mx-auto border" />
                    <button type="button" onClick={() => { setProfilePhoto(null); setProfilePhotoPreview(null); }} className="absolute top-0 right-1/3 bg-red-500 text-white rounded-full p-1"><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2"><Lock className="w-4 h-4" /> Password</Label>
                <div className="relative mt-2">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => handleChange("password", e.target.value)} 
                    className="pr-10 border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200"
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-500 mb-1">Password must contain:</p>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordChecks.minLength ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-gray-300" />}
                      <span className={passwordChecks.minLength ? "text-green-600" : "text-gray-400"}>At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordChecks.uppercase ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-gray-300" />}
                      <span className={passwordChecks.uppercase ? "text-green-600" : "text-gray-400"}>Uppercase letter (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordChecks.lowercase ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-gray-300" />}
                      <span className={passwordChecks.lowercase ? "text-green-600" : "text-gray-400"}>Lowercase letter (a-z)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordChecks.number ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-gray-300" />}
                      <span className={passwordChecks.number ? "text-green-600" : "text-gray-400"}>Number (0-9)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {passwordChecks.specialChar ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-gray-300" />}
                      <span className={passwordChecks.specialChar ? "text-green-600" : "text-gray-400"}>Special character (!@#$%^&*)</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2"><Lock className="w-4 h-4" /> Confirm Password</Label>
                <div className="relative mt-2">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={formData.confirmPassword} 
                    onChange={(e) => handleChange("confirmPassword", e.target.value)} 
                    className={`pr-10 border-2 border-gray-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-blue-900" : ""}`}
                    required 
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-blue-900 mt-1">Passwords do not match</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password !== "" && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> You will receive a verification email. After verification, an admin will review and approve your application. You will receive your BHW ID once approved.
                </p>
              </div>

              <Button 
                type="button"
                onClick={handleRegisterClick}
                disabled={loading || uploading}
                className="w-full bg-gray-800 hover:bg-gray-900"
              >
                {uploading ? "Uploading..." : loading ? "Submitting..." : "Submit Application"}
              </Button>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button type="button" onClick={() => navigate("/bhw/signin")} className="text-gray-800 font-medium hover:underline">
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}