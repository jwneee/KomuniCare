import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, CheckCircle2, Thermometer, Heart } from "lucide-react";
import { toast, Toaster } from "sonner";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function HealthLoggingForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [symptoms, setSymptoms] = useState({
    fever: false, cough: false, soreThroat: false,
    headache: false, fatigue: false, difficultyBreathing: false,
  });
  const [bloodPressure, setBloodPressure] = useState({ systolic: "", diastolic: "" });
  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/resident/signin");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSymptomChange = (symptom: string) => {
    setSymptoms((prev) => ({ ...prev, [symptom]: !prev[symptom as keyof typeof symptoms] }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login again");
      return;
    }

    const activeSymptoms = Object.entries(symptoms).filter(([, v]) => v).map(([k]) => k);
    const bpValue = bloodPressure.systolic && bloodPressure.diastolic ? `${bloodPressure.systolic}/${bloodPressure.diastolic}` : null;
    const tempValue = temperature ? `${temperature}°C` : null;
    const hrValue = heartRate ? `${heartRate} bpm` : null;
    const status = activeSymptoms.length > 2 ? "Needs Attention" : activeSymptoms.length > 0 ? "Under Observation" : "Stable";

    const newLog = {
      userId: user.uid,
      date: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
      time: new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
      symptoms: activeSymptoms,
      bp: bpValue,
      temp: tempValue,
      hr: hrValue,
      notes: notes,
      status: status,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "health_logs"), newLog);
      
      if (activeSymptoms.length > 0) {
        await addDoc(collection(db, "notifications"), {
          type: "health_alert",
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || "Resident",
          message: `🩺 ${user.displayName || user.email?.split('@')[0] || "Resident"} reported symptoms: ${activeSymptoms.join(", ")}`,
          symptoms: activeSymptoms,
          audience: "bhw",
          read: false,
          createdAt: new Date(),
        });
      }
      
      toast.success("Health log saved successfully! +10 points");
      setSubmitted(true);
      setTimeout(() => navigate("/resident/dashboard"), 1500);
    } catch (error) {
      console.error("Error saving health log:", error);
      toast.error("Failed to save health log. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Health Logged!</h2>
          <p className="text-muted-foreground">+10 points earned. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Toaster position="top-right" />
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/resident/dashboard")} className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5 mr-1" /> Back
        </button>
        <div>
          <h1 className="text-2xl font-bold">Log Your Health</h1>
          <p className="text-muted-foreground text-sm">Daily health check-in • Earn 10 pts</p>
        </div>
      </div>

      <Card className="p-6 shadow-md rounded-2xl">
        <h3 className="text-lg font-semibold mb-4">Any symptoms today?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "fever", label: "Fever" },
            { id: "cough", label: "Cough" },
            { id: "soreThroat", label: "Sore Throat" },
            { id: "headache", label: "Headache" },
            { id: "fatigue", label: "Fatigue" },
            { id: "difficultyBreathing", label: "Difficulty Breathing" },
          ].map((symptom) => (
            <div key={symptom.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${symptoms[symptom.id as keyof typeof symptoms] ? "border-green-400 bg-green-50 dark:bg-green-950/30" : "border-border hover:border-green-200"}`}
              onClick={() => handleSymptomChange(symptom.id)}>
              <Checkbox id={symptom.id} checked={symptoms[symptom.id as keyof typeof symptoms]} onCheckedChange={() => handleSymptomChange(symptom.id)} />
              <Label htmlFor={symptom.id} className="cursor-pointer select-none text-sm">{symptom.label}</Label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 shadow-md rounded-2xl">
        <h3 className="text-lg font-semibold mb-4">Vital Signs <span className="text-sm font-normal text-muted-foreground">(optional)</span></h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label className="text-sm mb-2 block flex items-center gap-1"><Heart className="w-4 h-4 text-red-500" /> Blood Pressure</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" placeholder="120" value={bloodPressure.systolic} onChange={(e) => setBloodPressure(p => ({ ...p, systolic: e.target.value }))} className="h-11 rounded-xl text-center" />
              <span className="text-muted-foreground font-bold">/</span>
              <Input type="number" placeholder="80" value={bloodPressure.diastolic} onChange={(e) => setBloodPressure(p => ({ ...p, diastolic: e.target.value }))} className="h-11 rounded-xl text-center" />
              <span className="text-muted-foreground text-sm">mmHg</span>
            </div>
          </div>
          <div>
            <Label className="text-sm mb-2 block flex items-center gap-1"><Thermometer className="w-4 h-4 text-orange-500" /> Temperature</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" step="0.1" placeholder="36.5" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="h-11 rounded-xl" />
              <span className="text-muted-foreground text-sm">°C</span>
            </div>
          </div>
          <div>
            <Label className="text-sm mb-2 block">Heart Rate</Label>
            <div className="flex gap-2 items-center">
              <Input type="number" placeholder="72" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="h-11 rounded-xl" />
              <span className="text-muted-foreground text-sm">bpm</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-md rounded-2xl">
        <h3 className="text-lg font-semibold mb-3">Additional Notes <span className="text-sm font-normal text-muted-foreground">(optional)</span></h3>
        <textarea
          className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
          placeholder="Describe how you're feeling today..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      <Button onClick={handleSubmit} className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg text-lg font-semibold">
        Submit Health Log
      </Button>
    </div>
  );
}