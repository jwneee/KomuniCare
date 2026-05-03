import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  User, 
  Calendar, 
  Droplet, 
  Phone, 
  Heart, 
  AlertCircle,
  Save,
  Edit2
} from "lucide-react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface ProfileData {
  name: string;
  age: string;
  bloodType: string;
  emergencyContact: string;
  emergencyPhone: string;
  conditions: string[];
  address: string;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function ResidentProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    age: "",
    bloodType: "",
    emergencyContact: "",
    emergencyPhone: "",
    conditions: [],
    address: "",
  });
  const [newCondition, setNewCondition] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadProfile(currentUser.uid);
      } else {
        window.location.href = "/resident/signin";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    try {
      const docRef = doc(db, "residents", uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          name: data.name || "",
          age: data.age || "",
          bloodType: data.bloodType || "",
          emergencyContact: data.emergencyContact || "",
          emergencyPhone: data.emergencyPhone || "",
          conditions: data.conditions || [],
          address: data.address || "",
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
      const docRef = doc(db, "residents", user.uid);
      await setDoc(docRef, {
        ...profile,
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

  const addCondition = () => {
    if (newCondition.trim() && !profile.conditions.includes(newCondition.trim())) {
      setProfile({
        ...profile,
        conditions: [...profile.conditions, newCondition.trim()]
      });
      setNewCondition("");
    }
  };

  const removeCondition = (condition: string) => {
    setProfile({
      ...profile,
      conditions: profile.conditions.filter(c => c !== condition)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-61px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-61px)] overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-sm text-gray-500">Manage your personal health information</p>
        </div>

        {/* Profile Card */}
        <Card className="p-6 shadow-xl rounded-2xl">
          {/* Edit Toggle */}
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

          {/* Profile Fields */}
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <Label className="flex items-center gap-2 text-gray-700 mb-2">
                <User className="w-4 h-4 text-red-600" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="Enter your full name"
                  className="h-11"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.name || "Not set"}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <Label className="flex items-center gap-2 text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-red-600" />
                Age
              </Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({...profile, age: e.target.value})}
                  placeholder="Enter your age"
                  className="h-11"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.age || "Not set"}</p>
              )}
            </div>

            {/* Blood Type */}
            <div>
              <Label className="flex items-center gap-2 text-gray-700 mb-2">
                <Droplet className="w-4 h-4 text-red-600" />
                Blood Type
              </Label>
              {isEditing ? (
                <select
                  value={profile.bloodType}
                  onChange={(e) => setProfile({...profile, bloodType: e.target.value})}
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="">Select blood type</option>
                  {bloodTypes.map(bt => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-800 font-medium">{profile.bloodType || "Not set"}</p>
              )}
            </div>

            {/* Address/Barangay */}
            <div>
              <Label className="flex items-center gap-2 text-gray-700 mb-2">
                <Heart className="w-4 h-4 text-red-600" />
                Barangay/Address
              </Label>
              {isEditing ? (
                <Input
                  value={profile.address}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  placeholder="Enter your barangay or address"
                  className="h-11"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.address || "Not set"}</p>
              )}
            </div>

            {/* Emergency Contact Name */}
            <div>
              <Label className="flex items-center gap-2 text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-red-600" />
                Emergency Contact Person
              </Label>
              {isEditing ? (
                <Input
                  value={profile.emergencyContact}
                  onChange={(e) => setProfile({...profile, emergencyContact: e.target.value})}
                  placeholder="e.g., Juan Dela Cruz"
                  className="h-11"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.emergencyContact || "Not set"}</p>
              )}
            </div>

            {/* Emergency Phone */}
            <div>
              <Label className="flex items-center gap-2 text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-red-600" />
                Emergency Phone Number
              </Label>
              {isEditing ? (
                <Input
                  value={profile.emergencyPhone}
                  onChange={(e) => setProfile({...profile, emergencyPhone: e.target.value})}
                  placeholder="e.g., 09123456789"
                  className="h-11"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profile.emergencyPhone || "Not set"}</p>
              )}
            </div>

            {/* Medical Conditions */}
            <div>
              <Label className="flex items-center gap-2 text-gray-700 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Medical Conditions
              </Label>
              {isEditing ? (
                <div>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="e.g., Hypertension, Diabetes, Asthma"
                      className="h-11 flex-1"
                    />
                    <Button onClick={addCondition} type="button" variant="outline">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.conditions.map((condition) => (
                      <span
                        key={condition}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {condition}
                        <button
                          onClick={() => removeCondition(condition)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.conditions.length > 0 ? (
                    profile.conditions.map((condition) => (
                      <span key={condition} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {condition}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No conditions listed</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            ⚠️ This information will be used for your Digital Health ID and health records.
          </p>
        </div>
      </div>
    </div>
  );
}