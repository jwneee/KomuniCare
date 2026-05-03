import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Search, Users, Phone, MapPin, Calendar, X, CheckCircle } from "lucide-react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { toast, Toaster } from "sonner";

interface Resident {
  id: string;
  name: string;
  address: string;
  phone: string;
  age?: string;
  bloodType?: string;
  registeredAt: string;
}

export default function BHWResidents() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    type: "check-up",
    date: new Date().toISOString().split('T')[0],
    time: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // REAL-TIME: Residents listener
  useEffect(() => {
    const q = query(collection(db, "residents"), orderBy("registeredAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const residentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resident));
      setResidents(residentsList);
      setLoading(false);
    }, (error) => {
      console.error("Error loading residents:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSchedule = async () => {
    if (!selectedResident || !scheduleForm.time) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      const newAppointment = {
        userId: selectedResident.id,
        name: selectedResident.name,
        type: scheduleForm.type,
        time: scheduleForm.time,
        date: scheduleForm.date,
        status: "approved",
        createdAt: new Date(),
      };
      await addDoc(collection(db, "appointments"), newAppointment);
      setBookingSuccess(true);
      toast.success(`Appointment scheduled for ${selectedResident.name}`);
      setTimeout(() => {
        setShowScheduleModal(false);
        setBookingSuccess(false);
        setSelectedResident(null);
        setScheduleForm({ type: "check-up", date: new Date().toISOString().split('T')[0], time: "" });
      }, 1500);
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment");
    }
  };

  const filteredResidents = residents.filter(r => r.name?.toLowerCase().includes(searchQ.toLowerCase()) || r.address?.toLowerCase().includes(searchQ.toLowerCase()));

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#0B0B45] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold">My Residents</h1>
        <p className="text-muted-foreground text-sm mt-1">List of residents under your barangay</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or barangay..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-9" />
      </div>

      {filteredResidents.length === 0 ? (
        <Card className="p-8 text-center"><Users className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No residents found</p></Card>
      ) : (
        <div className="grid gap-3">
          {filteredResidents.map((resident) => (
            <Card key={resident.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{resident.name || "Unknown"}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {resident.address || "N/A"}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {resident.phone || "N/A"}</span>
                    {resident.age && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Age: {resident.age}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-600" onClick={() => { setSelectedResident(resident); setShowScheduleModal(true); }}>Schedule</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showScheduleModal && selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Schedule Appointment</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                <p className="font-bold text-lg text-green-700">Appointment Scheduled!</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">Schedule appointment for <span className="font-semibold">{selectedResident.name}</span></p>
                <div className="space-y-4">
                  <div><Label className="text-sm font-medium">Type</Label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={scheduleForm.type} onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}>
                      <option value="check-up">Check-up</option><option value="consultation">Consultation</option><option value="vaccination">Vaccination</option><option value="prenatal">Prenatal</option>
                    </select>
                  </div>
                  <div><Label className="text-sm font-medium">Date</Label><input type="date" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={scheduleForm.date} onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })} /></div>
                  <div><Label className="text-sm font-medium">Time</Label><input type="time" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={scheduleForm.time} onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })} /></div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="flex-1">Cancel</Button>
                    <Button onClick={handleSchedule} className="bg-red-600 hover:bg-red-700 flex-1">Schedule</Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}