import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Clock, Calendar, Users, CheckCircle, Plus, X, AlertCircle } from "lucide-react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, addDoc, orderBy, onSnapshot } from "firebase/firestore";

type AppointmentType = "check-up" | "consultation" | "vaccination" | "prenatal";

interface Appointment {
  id: string;
  userId: string;
  name: string;
  type: AppointmentType;
  time: string;
  date: string;
  status: "pending" | "approved" | "rejected" | "done";
  notes?: string;
  createdAt: Date;
}

const typeColors: Record<AppointmentType, { bg: string; text: string; dot: string }> = {
  "check-up":   { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  consultation: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  vaccination:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  prenatal:     { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-400" },
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved": return { text: "Approved", className: "bg-green-100 text-green-700" };
    case "rejected": return { text: "Rejected", className: "bg-red-100 text-red-700" };
    case "done": return { text: "Completed", className: "bg-gray-100 text-gray-700" };
    default: return { text: "Pending", className: "bg-yellow-100 text-yellow-700" };
  }
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return dateStr;
};

export function AppointmentQueue() {
  const [user, setUser] = useState<any>(null);
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [form, setForm] = useState({ name: "", type: "check-up" as AppointmentType, time: "", date: getTodayDate() });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setForm(prev => ({ ...prev, name: currentUser.displayName || currentUser.email?.split('@')[0] || "", date: getTodayDate() }));
      } else {
        window.location.href = "/resident/signin";
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Appointments listener
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "appointments"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsList: Appointment[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setQueue(appointmentsList);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleBook = async () => {
    if (!form.name || !form.time || !user) return;
    
    try {
      const newAppointment = {
        userId: user.uid,
        name: form.name,
        type: form.type,
        time: form.time,
        date: form.date || getTodayDate(),
        status: "pending" as const,
        createdAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, "appointments"), newAppointment);
      
      await addDoc(collection(db, "notifications"), {
        type: "appointment",
        userId: user.uid,
        userName: form.name,
        message: `📅 New appointment request from ${form.name} for ${form.type} on ${form.date || getTodayDate()} at ${form.time}`,
        appointmentId: docRef.id,
        audience: "bhw",
        read: false,
        createdAt: new Date(),
      });
      
      setBooked(true);
      setTimeout(() => {
        setBooked(false);
        setShowBooking(false);
        setForm({ ...form, type: "check-up", time: "", date: getTodayDate() });
      }, 2000);
    } catch (error) {
      console.error("Error booking appointment:", error);
      alert("Failed to book appointment. Please try again.");
    }
  };

  const pendingCount = queue.filter((a) => a.status === "pending").length;
  const approvedCount = queue.filter((a) => a.status === "approved").length;
  const doneCount = queue.filter((a) => a.status === "done").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <div><h1 className="text-xl font-bold tracking-tight">Appointment & Queue</h1><p className="text-muted-foreground text-sm mt-0.5">Schedule your health center visit</p></div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 rounded-2xl shadow-sm border-0 bg-yellow-50">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-600 mb-1">Pending</p>
          <div className="flex items-end justify-between"><span className="text-2xl font-bold text-yellow-700">{pendingCount}</span><div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-yellow-600" /></div></div>
        </Card>
        <Card className="p-3 rounded-2xl shadow-sm border-0 bg-green-50">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-green-600 mb-1">Approved</p>
          <div className="flex items-end justify-between"><span className="text-2xl font-bold text-green-700">{approvedCount}</span><div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></div></div>
        </Card>
        <Card className="p-3 rounded-2xl shadow-sm border-0 bg-gray-50">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Completed</p>
          <div className="flex items-end justify-between"><span className="text-2xl font-bold text-gray-700">{doneCount}</span><div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-gray-600" /></div></div>
        </Card>
      </div>

      <Button onClick={() => setShowBooking(true)} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-sm shadow-md gap-2"><Plus className="w-4 h-4" /> Book Appointment</Button>

      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBooking(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-card rounded-t-3xl lg:rounded-3xl shadow-2xl p-6 z-10">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-5 lg:hidden" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">New Appointment</h2>
              <button onClick={() => setShowBooking(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            {booked ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CheckCircle className="w-8 h-8 text-emerald-500" /></div>
                <p className="font-bold text-lg text-emerald-700">Request Sent!</p>
                <p className="text-sm text-muted-foreground mt-1">Your appointment request is pending approval.</p>
                <p className="text-xs text-muted-foreground mt-2">You will be notified once confirmed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Full Name</label><input className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" placeholder="Enter resident name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Type</label><select className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AppointmentType })}><option value="check-up">Check-up</option><option value="consultation">Consultation</option><option value="vaccination">Vaccination</option><option value="prenatal">Prenatal</option></select></div>
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Preferred Date</label><input type="date" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Preferred Time</label><input type="time" className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                <Button onClick={handleBook} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold mt-1">Submit Request</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-green-600" /> My Appointments</h2><span className="text-xs text-muted-foreground">{queue.filter((a) => a.status === "pending").length} pending</span></div>
        <div className="space-y-2.5">
          {queue.length === 0 ? (
            <Card className="p-8 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No appointments yet</p><p className="text-sm text-gray-400">Click "Book Appointment" to schedule one</p></Card>
          ) : (
            queue.map((appt) => {
              const colors = typeColors[appt.type];
              const statusBadge = getStatusBadge(appt.status);
              const isPending = appt.status === "pending";
              const isRejected = appt.status === "rejected";
              const displayDate = formatDisplayDate(appt.date);
              return (
                <div key={appt.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isPending ? "bg-yellow-50 border-yellow-200" : isRejected ? "bg-red-50 border-red-200 opacity-70" : "bg-white border-gray-100"}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}><span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />{appt.type}</span><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge.className}`}>{statusBadge.text}</span></div>
                    <p className="font-semibold text-sm">{appt.name}</p>
                    <div className="flex items-center gap-3 mt-1"><span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {displayDate}</span><span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {appt.time}</span></div>
                    {isRejected && appt.notes && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {appt.notes}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    {isPending && <div className="text-center"><div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto"><Clock className="w-4 h-4 text-yellow-600" /></div><p className="text-[10px] text-yellow-600 mt-1">Waiting</p></div>}
                    {appt.status === "approved" && <div className="text-center"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto"><CheckCircle className="w-4 h-4 text-green-600" /></div><p className="text-[10px] text-green-600 mt-1">Approved</p></div>}
                    {appt.status === "rejected" && <div className="text-center"><div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mx-auto"><X className="w-4 h-4 text-red-600" /></div><p className="text-[10px] text-red-600 mt-1">Rejected</p></div>}
                    {appt.status === "done" && <div className="text-center"><div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mx-auto"><CheckCircle className="w-4 h-4 text-gray-600" /></div><p className="text-[10px] text-gray-600 mt-1">Done</p></div>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}