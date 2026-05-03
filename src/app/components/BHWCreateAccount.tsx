import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { ArrowLeft, Briefcase, IdCard, MapPin, Phone, Upload, X, User } from "lucide-react";
import { toast, Toaster } from "sonner";
import { db, storage, auth } from "../firebase";
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

// Function to generate BHW ID (BHW-2026-XXX)
const generateBHWId = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const q = query(collection(db, "bhws"), where("idNumber", ">=", `BHW-${currentYear}-`));
  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;
  return `BHW-${currentYear}-${String(count).padStart(3, "0")}`;
};

// Function to generate email (BHW00001@newkalalake.gov.ph)
const generateEmail = (idNumber: string): string => {
  const numericPart = idNumber.split("-")[2];
  return `BHW${numericPart}@newkalalake.gov.ph`;
};

export function BHWCreateAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    barangay: "",
    phone: "",
  });

  // Check if user is admin (from bhws collection, isAdmin field)
  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/bhw/signin");
        return;
      }
      const bhwDoc = await getDoc(doc(db, "bhws", user.uid));
      if (!bhwDoc.exists() || bhwDoc.data()?.isAdmin !== true) {
        toast.error("Access denied. Admin only.");
        navigate("/bhw/dashboard");
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const timestamp = Date.now();
    const filename = `${path}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.barangay || !formData.phone) {
      toast.error("Please fill in all fields");
      return;
    }
    if (formData.phone.length !== 11) {
      toast.error("Phone number must be 11 digits");
      return;
    }
    if (!idPhoto) {
      toast.error("Please upload a valid ID (proof of residency)");
      return;
    }
    if (!profilePhoto) {
      toast.error("Please upload a profile picture");
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      const idNumber = await generateBHWId();
      const email = generateEmail(idNumber);
      const temporaryPassword = `Temp${idNumber.split("-")[2]}!`;

      const idPhotoURL = await uploadFile(idPhoto, "bhw_ids");
      const profilePhotoURL = await uploadFile(profilePhoto, "bhw_profiles");

      const { user } = await createUserWithEmailAndPassword(auth, email, temporaryPassword);
      await sendEmailVerification(user);

      await addDoc(collection(db, "pending_bhws"), {
        name: formData.name,
        email: email,
        idNumber: idNumber,
        barangay: formData.barangay,
        phone: formData.phone,
        idPhoto: idPhotoURL,
        profilePhoto: profilePhotoURL,
        status: "pending",
        temporaryPassword: temporaryPassword,
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid,
      });

      toast.success(`BHW account created! Email: ${email}, Temporary Password: ${temporaryPassword}`);
      setTimeout(() => navigate("/bhw/pending-approvals"), 3000);
    } catch (error: any) {
      console.error("Error creating BHW account:", error);
      toast.error(error.message || "Failed to create BHW account");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B0B45]"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-md mx-auto">
        <Button variant="ghost" onClick={() => navigate("/bhw/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 shadow-xl rounded-3xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Create BHW Account</h1>
            <p className="text-muted-foreground text-sm">Register a new Barangay Health Worker</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="flex items-center gap-2"><User className="w-4 h-4" /> Full Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Juan Dela Cruz" className="mt-2" required />
            </div>

            <div>
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Assigned Barangay</Label>
              <Input value={formData.barangay} onChange={(e) => setFormData({ ...formData, barangay: e.target.value })} placeholder="Barangay New Kalalake" className="mt-2" required />
            </div>

            <div>
              <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Contact Number</Label>
              <Input type="tel" placeholder="09123456789" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.slice(0, 11) })} className="mt-2" required />
            </div>

            {/* ID Upload */}
            <div>
              <Label className="flex items-center gap-2"><IdCard className="w-4 h-4" /> Valid ID (Proof that they are from New Kalalake)</Label>
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

            {/* Profile Picture Upload */}
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>Auto-generated:</strong><br />
                • BHW ID: Auto-generated (e.g., BHW-2026-001)<br />
                • Email: BHWXXX@newkalalake.gov.ph<br />
                • Temporary Password: Will be sent to the BHW's email
              </p>
            </div>

            <Button type="submit" disabled={submitting || uploading} className="w-full bg-gray-800 hover:bg-gray-900">
              {uploading ? "Uploading..." : submitting ? "Creating Account..." : "Create BHW Account"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}