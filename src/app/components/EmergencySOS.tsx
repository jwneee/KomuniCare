import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, MapPin, Phone, Heart, CheckCircle, Clock, X } from "lucide-react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  address: string;
  contactNumber: string;
  healthInfo: string;
  conditions?: string[];
  timestamp: Date;
  status: "pending" | "responding" | "resolved";
}

export function EmergencySOS() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sent, setSent] = useState(false);
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserProfile(currentUser.uid);
      } else {
        window.location.href = "/resident/signin";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: User alerts listener
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "emergency_alerts"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alertsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      } as SOSAlert));
      setAlerts(alertsList);
    });
    
    return () => unsubscribe();
  }, [user]);

  const loadUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "residents", uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSOS = async () => {
    setSosActive(true);
    let count = 3;
    setCountdown(count);
    
    const interval = setInterval(async () => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
        setSosActive(false);
        setSending(true);
        
        const newAlert = {
          userId: user.uid,
          userName: userProfile?.name || user.displayName || "Resident",
          address: userProfile?.address || "Address not set",
          contactNumber: userProfile?.phone || "No contact number",
          healthInfo: `Age: ${userProfile?.age || "N/A"}, Blood Type: ${userProfile?.bloodType || "N/A"}`,
          conditions: userProfile?.medicalConditions || [],
          timestamp: new Date(),
          status: "pending",
        };
        
        try {
          await addDoc(collection(db, "emergency_alerts"), newAlert);
          
          await addDoc(collection(db, "notifications"), {
            type: "emergency",
            userId: user.uid,
            userName: userProfile?.name || user.displayName || "Resident",
            message: `🚨 EMERGENCY SOS from ${userProfile?.name || user.displayName || "Resident"}! Immediate assistance needed.`,
            audience: "bhw",
            read: false,
            createdAt: new Date(),
          });
          
          setSent(true);
          toast.success("SOS Alert sent! BHW has been notified.");
          setTimeout(() => setSent(false), 5000);
        } catch (error) {
          console.error("Error sending SOS:", error);
          toast.error("Failed to send SOS alert");
        } finally {
          setSending(false);
        }
      }
    }, 1000);
  };

  const cancelSOS = () => {
    setSosActive(false);
    setCountdown(3);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-red-500 text-white">Active</Badge>;
      case "responding":
        return <Badge className="bg-orange-400 text-white">Responding</Badge>;
      case "resolved":
        return <Badge className="bg-green-500 text-white">Resolved</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-2xl font-bold">Emergency SOS</h1>
        <p className="text-muted-foreground text-sm mt-1">One-tap alert to your BHW and barangay</p>
      </div>

      {sent && (
        <Card className="p-4 bg-green-50 border-2 border-green-300 rounded-2xl">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">SOS Alert Sent!</p>
              <p className="text-sm">Your BHW has been notified with your health info.</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-8 shadow-lg rounded-2xl text-center">
        <p className="text-sm text-muted-foreground mb-2">For Senior Citizens · Pregnant Women · Emergencies</p>
        <p className="text-base font-medium text-gray-700 mb-8">Press the button to alert your BHW immediately</p>

        {sosActive ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-40 h-40 rounded-full bg-red-500 flex items-center justify-center shadow-2xl animate-pulse">
              <div className="text-white text-center">
                <p className="text-5xl font-black">{countdown}</p>
                <p className="text-sm font-medium mt-1">Sending...</p>
              </div>
            </div>
            <Button onClick={cancelSOS} variant="outline" className="border-gray-300 text-gray-600 gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleSOS}
              disabled={sending}
              className="w-40 h-40 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 flex items-center justify-center shadow-2xl transition-all border-8 border-red-200 disabled:opacity-50"
            >
              <div className="text-white text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-1" />
                <p className="text-lg font-black">SOS</p>
              </div>
            </button>
            <p className="text-xs text-muted-foreground">Tap once to begin • Will send in 3 seconds</p>
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-md rounded-2xl">
        <h2 className="text-base font-bold text-gray-800 mb-4">What gets sent to your BHW:</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Address: {userProfile?.address || "Not set"}</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Age: {userProfile?.age || "N/A"}, Blood: {userProfile?.bloodType || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
            <Phone className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Contact: {userProfile?.phone || "Not set"}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-lg rounded-2xl">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" /> Recent Alerts
        </h2>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No alerts yet</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{alert.userName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Emergency SOS</span>
                    <span className="text-xs text-muted-foreground">· {alert.address}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(alert.timestamp)}</p>
                </div>
                {getStatusBadge(alert.status)}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}