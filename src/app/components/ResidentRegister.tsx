import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Upload, X, IdCard } from "lucide-react";
import { toast, Toaster } from "sonner";
import { auth, db, storage } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TermsModal } from "./TermsModal";

export function ResidentRegister() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

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

  const validateAddress = (address: string) => {
    const addressLower = address.toLowerCase();
    return addressLower.includes("new kalalake") || addressLower.includes("barangay new kalalake");
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

  const uploadFile = async (file: File, path: string): Promise<string> => {
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
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!validateFullName(formData.name)) {
      toast.error("Please enter a valid full name (letters only, no numbers or symbols)");
      return;
    }
    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!validatePhone(formData.phone)) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }
    if (!validateAddress(formData.address)) {
      toast.error("Only residents of Barangay New Kalalake can register");
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
      toast.error("Please upload a valid ID (proof of residency)");
      return;
    }
    setShowTerms(true);
    setPendingSubmit(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setUploading(true);

    try {
      const idPhotoURL = await uploadFile(idPhoto!, "resident_ids");
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(user, { displayName: formData.name });

      await addDoc(collection(db, "pending_residents"), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idPhoto: idPhotoURL,
        status: "pending",
        submittedAt: new Date(),
        uid: user.uid,
        password: formData.password,
      });

      toast.success("Registration submitted! Please wait for admin/BHW approval.");
      setTimeout(() => navigate("/resident/signin"), 3000);
    } catch (error: any) {
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
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-right" />
      
      <TermsModal
        open={showTerms}
        onOpenChange={setShowTerms}
        onAgree={handleSubmit}
        title="Resident Terms & Conditions"
        userType="resident"
      />
      
      <button 
        onClick={() => navigate("/")} 
        className="fixed top-6 left-6 flex items-center gap-1 text-gray-400 hover:text-green-600 transition z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>
      
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <img src="/logo.png" alt="KomuniCare" className="w-14 h-14 rounded-full" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-800">KomuniCare</h1>
            <p className="text-xs text-gray-400 mt-1">Create Resident Account</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Full Name</label>
              <Input 
                type="text" 
                placeholder="Juan Dela Cruz"
                value={formData.name} 
                onChange={(e) => handleChange("name", e.target.value)} 
                className={`h-10 rounded-md border-2 border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.name && !validateFullName(formData.name) && formData.name !== "" ? "border-orange-500" : ""}`}
                required 
              />
              {formData.name && !validateFullName(formData.name) && (
                <p className="text-xs text-orange-500 mt-1">Letters only, no numbers or symbols</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Email Address</label>
              <Input 
                type="email" 
                placeholder="resident@example.com"
                value={formData.email} 
                onChange={(e) => handleChange("email", e.target.value)} 
                className={`h-10 rounded-md border-2 border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.email && !validateEmail(formData.email) && formData.email !== "" ? "border-orange-500" : ""}`}
                required 
              />
              {formData.email && !validateEmail(formData.email) && (
                <p className="text-xs text-orange-500 mt-1">Enter a valid email address</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Phone Number</label>
              <Input 
                type="tel" 
                placeholder="09123456789"
                value={formData.phone} 
                onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} 
                className={`h-10 rounded-md border-2 border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.phone && !validatePhone(formData.phone) && formData.phone !== "" ? "border-orange-500" : ""}`}
                required 
              />
              {formData.phone && !validatePhone(formData.phone) && (
                <p className="text-xs text-orange-500 mt-1">Exactly 11 digits (e.g., 09123456789)</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Address</label>
              <Input 
                type="text" 
                placeholder="Barangay New Kalalake, Olongapo City"
                value={formData.address} 
                onChange={(e) => handleChange("address", e.target.value)} 
                className={`h-10 rounded-md border-2 border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600 focus:ring-offset-0 focus:outline-none transition-all duration-200 ${formData.address && !validateAddress(formData.address) && formData.address !== "" ? "border-orange-500" : ""}`}
                required 
              />
              {formData.address && !validateAddress(formData.address) && (
                <p className="text-xs text-orange-500 mt-1">Only residents of Barangay New Kalalake can register</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Must include "Barangay New Kalalake" or "New Kalalake"</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1 flex items-center gap-2">
                <IdCard className="w-4 h-4" />
                Valid ID (Proof of Residency)
              </label>
              {!idPhotoPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 mt-1">
                  <Upload className="w-8 h-8 text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Click to upload ID</p>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIdPhoto(file);
                      setIdPhotoPreview(URL.createObjectURL(file));
                    }
                  }} />
                </label>
              ) : (
                <div className="relative mt-1">
                  <img src={idPhotoPreview} alt="ID Preview" className="w-full h-28 object-contain border rounded-lg bg-gray-50" />
                  <button 
                    type="button" 
                    onClick={() => { setIdPhoto(null); setIdPhotoPreview(null); }} 
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-1">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a strong password"
                  value={formData.password} 
                  onChange={(e) => handleChange("password", e.target.value)} 
                  className="h-10 rounded-md border-2 border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600 focus:ring-offset-0 focus:outline-none transition-all duration-200 pr-10"
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

            <div className="mb-6">
              <label className="block text-xs text-gray-600 mb-1">Confirm Password</label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword} 
                  onChange={(e) => handleChange("confirmPassword", e.target.value)} 
                  className={`h-10 rounded-md border-2 border-gray-300 focus:border-green-600 focus:ring-2 focus:ring-green-600 focus:ring-offset-0 focus:outline-none transition-all duration-200 pr-10 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-orange-500" : ""}`}
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-orange-500 mt-1">Passwords do not match</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password !== "" && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passwords match</p>
              )}
            </div>

            <div className="flex justify-end mb-4">
              <button 
                type="button"
                onClick={() => navigate("/resident/signin")} 
                className="text-xs text-green-700 hover:underline"
              >
                Already have an account? Sign In
              </button>
            </div>

            <Button 
              type="button"
              onClick={handleRegisterClick}
              disabled={loading || uploading}
              className="w-full bg-green-700 hover:bg-green-800 h-10 rounded-md text-sm font-normal mb-4"
            >
              {uploading ? "Uploading ID..." : loading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center text-xs text-gray-400 mb-4">
              <p>⚠️ Your account will be verified by a BHW before you can login.</p>
            </div>

            <div className="text-center pt-6 mt-2 border-t border-gray-100">
              <div className="flex justify-center gap-3 text-xs text-gray-400">
                <Link to="/privacy-policy" className="hover:text-green-700">Privacy Policy</Link>
                <span>|</span>
                <Link to="/terms" className="hover:text-green-700">Terms & Conditions</Link>
                <span>|</span>
                <Link to="/#contact" className="hover:text-green-700">Contact Us</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}