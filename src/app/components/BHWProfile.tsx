import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { User, Briefcase, MapPin, Phone, Save, Edit2 } from "lucide-react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface BHWProfileData {
  name: string;
  idNumber: string;
  barangay: string;
  phone: string;
  email: string;
}

export function BHWProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<BHWProfileData>({
    name: "",
    idNumber: "",
    barangay: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadProfile(currentUser.uid);
      } else {
        window.location.href = "/bhw/signin";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const docRef = doc(db, "bhws", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.name || "",
          idNumber: data.idNumber || "",
          barangay: data.barangay || "",
          phone: data.phone || "",
          email: user?.email || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, "bhws", user.uid);
      await setDoc(docRef, {
        name: profile.name,
        idNumber: profile.idNumber,
        barangay: profile.barangay,
        phone: profile.phone,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      toast.success("Profile saved successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B0B45] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Toaster position="top-right" />
      
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your BHW account information</p>
      </div>

      <Card className="p-6 shadow-xl rounded-2xl">
        <div className="flex justify-end mb-4">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(false)} variant="ghost">Cancel</Button>
              <Button onClick={saveProfile} disabled={saving} className="bg-red-600 hover:bg-red-700 gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <Label className="flex items-center gap-2 text-gray-700 mb-2"><User className="w-4 h-4 text-red-600" /> Full Name</Label>
            {isEditing ? (
              <Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} placeholder="Enter your full name" className="h-11" />
            ) : (
              <p className="text-gray-800 font-medium">{profile.name || "Not set"}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2 text-gray-700 mb-2"><Briefcase className="w-4 h-4 text-red-600" /> BHW ID Number</Label>
            {isEditing ? (
              <Input value={profile.idNumber} onChange={(e) => setProfile({...profile, idNumber: e.target.value})} placeholder="e.g., BHW-2026-001" className="h-11 font-mono" disabled={true} />
            ) : (
              <p className="text-gray-800 font-medium font-mono">{profile.idNumber || "Not set"}</p>
            )}
            {isEditing && <p className="text-xs text-muted-foreground mt-1">ID number cannot be changed. Contact admin for assistance.</p>}
          </div>

          <div>
            <Label className="flex items-center gap-2 text-gray-700 mb-2"><MapPin className="w-4 h-4 text-red-600" /> Assigned Barangay</Label>
            {isEditing ? (
              <Input value={profile.barangay} onChange={(e) => setProfile({...profile, barangay: e.target.value})} placeholder="e.g., Barangay Sta. Cruz" className="h-11" />
            ) : (
              <p className="text-gray-800 font-medium">{profile.barangay || "Not set"}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2 text-gray-700 mb-2"><Phone className="w-4 h-4 text-red-600" /> Contact Number</Label>
            {isEditing ? (
              <Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} placeholder="09123456789" className="h-11" />
            ) : (
              <p className="text-gray-800 font-medium">{profile.phone || "Not set"}</p>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2 text-gray-700 mb-2"><User className="w-4 h-4 text-red-600" /> Email Address</Label>
            <p className="text-gray-800 font-medium">{profile.email || user?.email || "Not set"}</p>
            <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
          </div>
        </div>
      </Card>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">⚠️ This information is used for your BHW identification and contact purposes.</p>
      </div>
    </div>
  );
}