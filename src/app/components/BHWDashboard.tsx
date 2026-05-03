import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Users, Calendar, Activity, AlertTriangle, Search, Check, X, Clock, MessageSquare, Gift, CheckCircle, MapPin, Navigation, Phone, Heart, FileText, User, Stethoscope } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { toast, Toaster } from "sonner";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, where, onSnapshot, addDoc, getDoc } from "firebase/firestore";

interface Resident {
  id: string;
  name: string;
  address: string;
  phone: string;
  age?: string;
  bloodType?: string;
  registeredAt: string;
}

interface Appointment {
  id: string;
  userId: string;
  name: string;
  type: string;
  time: string;
  date: string;
  status: string;
  notes?: string;
  createdAt: any;
}

interface HealthLog {
  id: string;
  userId: string;
  date: string;
  time: string;
  symptoms: string[];
  temp?: string;
  bp?: string;
  hr?: string;
  notes?: string;
  status: string;
  createdAt: any;
}

interface RedeemedReward {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitle: string;
  pointsSpent: number;
  redeemCode: string;
  status: "pending" | "claimed" | "expired";
  redeemedAt: any;
}

interface EmergencyAlert {
  id: string;
  userId: string;
  userName: string;
  address: string;
  contactNumber: string;
  healthInfo: string;
  timestamp: any;
  status: "pending" | "responding" | "resolved";
}

const VALID_TABS = ["overview", "patients", "appointments", "rewards", "emergency", "health-logs"];

export default function BHWDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const activeTab = VALID_TABS.includes(tabFromUrl || "") ? tabFromUrl! : "overview";

  const setActiveTab = (tab: string) => {
    setSearchParams(tab === "overview" ? {} : { tab });
  };

  const [residents, setResidents] = useState<Resident[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [rewards, setRewards] = useState<RedeemedReward[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [selectedReward, setSelectedReward] = useState<RedeemedReward | null>(null);
  
  // For Health Logs - Sidebar selection
  const [selectedResidentForLogs, setSelectedResidentForLogs] = useState<Resident | null>(null);
  const [selectedResidentLogs, setSelectedResidentLogs] = useState<HealthLog[]>([]);
  const [healthLogsSearchQ, setHealthLogsSearchQ] = useState("");

  // REAL-TIME: Residents listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "residents"), orderBy("registeredAt", "desc")),
      (snapshot) => {
        const residentsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Resident));
        setResidents(residentsList);
      },
      (error) => console.error("Error fetching residents:", error)
    );
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Appointments listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "appointments"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const appointmentsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
        setAppointments(appointmentsList);
      }
    );
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Health logs listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "health_logs"),
      (snapshot) => {
        const logsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as HealthLog));
        setHealthLogs(logsList);
      }
    );
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Rewards listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "Redeemed Rewards"), orderBy("redeemedAt", "desc")),
      (snapshot) => {
        const rewardsList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as RedeemedReward));
        setRewards(rewardsList);
      }
    );
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Emergency alerts listener
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "emergency_alerts"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyAlert));
        setEmergencyAlerts(alerts);
        setLoadingData(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Get residents with health logs only
  const residentsWithLogs = residents.filter(resident => 
    healthLogs.some(log => log.userId === resident.id)
  );

  // Filter residents with logs by search
  const filteredResidentsWithLogs = residentsWithLogs.filter((r) =>
    r.name?.toLowerCase().includes(healthLogsSearchQ.toLowerCase())
  );

  const updateAppointmentStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      
      const appointmentRef = doc(db, "appointments", id);
      const appointmentSnap = await getDoc(appointmentRef);
      const appointment = appointmentSnap.data() as Appointment;
      
      await updateDoc(appointmentRef, updateData);
      
      if (appointment && appointment.userId) {
        const statusMessage = status === "approved" 
          ? `✅ Your appointment on ${appointment.date} at ${appointment.time} has been approved.`
          : `❌ Your appointment on ${appointment.date} at ${appointment.time} has been rejected.${notes ? ` Reason: ${notes}` : ""}`;
        
        await addDoc(collection(db, "notifications"), {
          type: "appointment_status",
          userId: appointment.userId,
          userName: appointment.name,
          message: statusMessage,
          audience: "resident",
          read: false,
          createdAt: new Date(),
        });
      }
      
      toast.success(`Appointment ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "updated"}!`);
      setSelectedAppointment(null);
      setRejectNote("");
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    }
  };

  const updateRewardStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "Redeemed Rewards", id), { status });
      toast.success(`Reward ${status === "claimed" ? "claimed" : "updated"}!`);
      setSelectedReward(null);
      setVerifyCode("");
    } catch (error) {
      console.error("Error updating reward:", error);
      toast.error("Failed to update reward");
    }
  };

  const updateEmergencyStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "emergency_alerts", id), { status });
      toast.success(`Emergency alert marked as ${status}`);
      
      const alert = emergencyAlerts.find(a => a.id === id);
      if (alert && alert.userId) {
        await addDoc(collection(db, "notifications"), {
          type: "emergency_response",
          userId: alert.userId,
          message: status === "responding" 
            ? "🚨 A BHW is on their way to your location. Help is coming!"
            : "✅ Emergency has been resolved. Stay safe!",
          audience: "resident",
          read: false,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error updating emergency:", error);
      toast.error("Failed to update emergency status");
    }
  };

  const verifyRewardByCode = async () => {
    if (!verifyCode) {
      toast.error("Please enter a redeem code");
      return;
    }

    const reward = rewards.find(r => r.redeemCode === verifyCode && r.status === "pending");
    if (reward) {
      setSelectedReward(reward);
      toast.success(`Found reward: ${reward.rewardTitle}`);
    } else {
      toast.error("Invalid or already claimed code");
      setSelectedReward(null);
    }
  };

  const activeCases = residents.filter(resident => {
    const userLogs = healthLogs.filter(log => log.userId === resident.id);
    const recentLogs = userLogs.filter(log => {
      const logDate = log.createdAt?.toDate?.() || new Date(log.createdAt);
      const daysAgo = (new Date().getTime() - logDate.getTime()) / (1000 * 3600 * 24);
      return daysAgo <= 7 && log.symptoms && log.symptoms.length > 0;
    });
    return recentLogs.length > 0;
  }).length;

  const todayFormatted = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === todayFormatted);
  const pendingAppointments = appointments.filter(a => a.status === "pending");
  const pendingRewards = rewards.filter(r => r.status === "pending");
  const activeEmergencies = emergencyAlerts.filter(e => e.status === "pending");

  const filteredResidents = residents.filter((r) =>
    r.name?.toLowerCase().includes(searchQ.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      case "done":
        return <Badge className="bg-gray-100 text-gray-700">Completed</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const stats = [
    { label: "Total Patients", value: residents.length.toString(), icon: Users, color: "blue" },
    { label: "Today's Appointments", value: todayAppointments.length.toString(), icon: Calendar, color: "green" },
    { label: "Active Cases", value: activeCases.toString(), icon: Activity, color: "red" },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-3xl font-bold mb-1">Health Worker Dashboard</h1>
        <p className="text-muted-foreground">Managing community health services</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            blue: "bg-blue-100 text-blue-600",
            green: "bg-green-100 text-green-600",
            red: "bg-red-100 text-red-600",
          };
          return (
            <Card key={i} className="p-5 shadow-md rounded-xl hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-full ${colorMap[stat.color]} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {activeEmergencies.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">{activeEmergencies.length} Active Emergency Alert(s)</p>
                <p className="text-sm text-red-600">Immediate attention required!</p>
              </div>
            </div>
            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => setActiveTab("emergency")}>
              View Now
            </Button>
          </div>
        </Card>
      )}

      {pendingAppointments.length > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">{pendingAppointments.length} pending appointment(s)</p>
                <p className="text-sm text-yellow-600">Please review and approve/reject requests</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("appointments")} className="border-yellow-600 text-yellow-600">
              Review Now
            </Button>
          </div>
        </Card>
      )}

      {pendingRewards.length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">{pendingRewards.length} pending reward(s)</p>
                <p className="text-sm text-green-600">Residents are waiting to claim their rewards</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("rewards")} className="border-green-600 text-green-600">
              Verify Now
            </Button>
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emergency" className="relative">
            Emergency
            {activeEmergencies.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="patients">Patients ({residents.length})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({pendingAppointments.length} pending)</TabsTrigger>
          <TabsTrigger value="rewards">Rewards ({pendingRewards.length} pending)</TabsTrigger>
          <TabsTrigger value="health-logs">Health Logs ({residentsWithLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6 shadow-md rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Emergency Alerts
              </h3>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("emergency")}>View All</Button>
            </div>
            <div className="space-y-3">
              {activeEmergencies.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No active emergencies</p>
              ) : (
                activeEmergencies.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-red-800">{alert.userName}</p>
                        <p className="text-xs text-red-600 mt-1">📍 {alert.address}</p>
                        <p className="text-xs text-red-500 mt-1">📞 {alert.contactNumber}</p>
                        <p className="text-xs text-red-500">🩺 {alert.healthInfo}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => updateEmergencyStatus(alert.id, "responding")}>
                          Responding
                        </Button>
                        <Button size="sm" variant="outline" className="border-green-600 text-green-600" onClick={() => updateEmergencyStatus(alert.id, "resolved")}>
                          Resolve
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(alert.timestamp?.toDate?.() || alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-md rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Patients</h3>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("patients")}>View All</Button>
              </div>
              <div className="space-y-3">
                {residents.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-muted-foreground">{r.address} • {r.phone}</p></div>
                    <Badge className="bg-green-500">Registered</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6 shadow-md rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Today's Appointments</h3>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("appointments")}>View All</Button>
              </div>
              <div className="space-y-3">
                {todayAppointments.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-muted-foreground">{a.time} • {a.type}</p></div>
                    {getStatusBadge(a.status)}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emergency">
          <Card className="p-6 shadow-md rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Emergency Alerts
              </h3>
            </div>
            <div className="space-y-4">
              {emergencyAlerts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No emergency alerts</p>
              ) : (
                emergencyAlerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-xl border ${
                    alert.status === "pending" ? "bg-red-50 border-red-200" :
                    alert.status === "responding" ? "bg-orange-50 border-orange-200" :
                    "bg-green-50 border-green-200"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.status === "pending" ? "text-red-500" :
                            alert.status === "responding" ? "text-orange-500" :
                            "text-green-500"
                          }`} />
                          <p className="font-semibold text-gray-800">{alert.userName}</p>
                          {alert.status === "pending" && (
                            <Badge className="bg-red-500 text-white animate-pulse">ACTIVE</Badge>
                          )}
                          {alert.status === "responding" && (
                            <Badge className="bg-orange-500 text-white">Responding</Badge>
                          )}
                          {alert.status === "resolved" && (
                            <Badge className="bg-green-500 text-white">Resolved</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /> {alert.address}</p>
                          <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> {alert.contactNumber}</p>
                          <p className="flex items-center gap-2 col-span-2"><Heart className="w-4 h-4 text-gray-500" /> {alert.healthInfo}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                          Reported: {new Date(alert.timestamp?.toDate?.() || alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {alert.status !== "resolved" && (
                        <div className="flex gap-2 ml-4">
                          {alert.status === "pending" && (
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => updateEmergencyStatus(alert.id, "responding")}>
                              Responding
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => updateEmergencyStatus(alert.id, "resolved")}
                          >
                            Resolve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card className="p-6 shadow-md rounded-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Patient Records</h3></div>
            <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search patients by name..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="pl-9" /></div>
            <div className="space-y-3">
              {filteredResidents.map((r) => (
                <Card key={r.id} className="p-4 bg-accent/30 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div><h4 className="font-medium">{r.name}</h4><div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground"><span>📍 {r.address}</span><span>📞 {r.phone}</span>{r.age && <span>🎂 Age: {r.age}</span>}{r.bloodType && <span>🩸 Blood: {r.bloodType}</span>}</div><p className="text-xs text-muted-foreground mt-1">Registered: {new Date(r.registeredAt).toLocaleDateString()}</p></div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                </Card>
              ))}
              {filteredResidents.length === 0 && <p className="text-center text-muted-foreground py-6">No patients found.</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card className="p-6 shadow-md rounded-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Appointment Requests</h3></div>
            {pendingAppointments.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Pending Requests ({pendingAppointments.length})</h4>
                <div className="space-y-3">
                  {pendingAppointments.map((a) => (
                    <Card key={a.id} className="p-4 bg-yellow-50 border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div><h4 className="font-medium">{a.name}</h4><p className="text-sm text-muted-foreground">{a.date} at {a.time} • {a.type}</p><p className="text-xs text-muted-foreground mt-1">Requested on: {new Date(a.createdAt?.toDate?.() || a.createdAt).toLocaleDateString()}</p></div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateAppointmentStatus(a.id, "approved")}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={() => { setSelectedAppointment(a); setRejectNote(""); }}><X className="w-4 h-4 mr-1" /> Reject</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {selectedAppointment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <Card className="p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Reject Appointment</h3><button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button></div>
                  <p className="text-sm text-gray-600 mb-4">Reject appointment for <span className="font-semibold">{selectedAppointment.name}</span></p>
                  <div className="mb-4"><Label className="text-sm font-medium">Reason (optional)</Label><textarea className="w-full border rounded-lg px-3 py-2 text-sm mt-1" rows={3} placeholder="e.g., No available slots..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} /></div>
                  <div className="flex gap-3"><Button variant="outline" onClick={() => setSelectedAppointment(null)}>Cancel</Button><Button className="bg-red-600 hover:bg-red-700" onClick={() => updateAppointmentStatus(selectedAppointment.id, "rejected", rejectNote)}>Confirm Reject</Button></div>
                </Card>
              </div>
            )}
            <div><h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> All Appointments</h4>
              <div className="space-y-3">
                {appointments.map((a) => (
                  <Card key={a.id} className="p-4 bg-accent/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div><h4 className="font-medium">{a.name}</h4><p className="text-sm text-muted-foreground">{a.date} at {a.time} • {a.type}</p>{a.notes && a.status === "rejected" && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {a.notes}</p>}</div>
                      {getStatusBadge(a.status)}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rewards">
          <Card className="p-6 shadow-md rounded-xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Reward Verification</h3></div>
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-700 mb-3">Verify Redeem Code</h4>
              <div className="flex gap-3"><Input placeholder="Enter redeem code (e.g., RWD-ABC-123)" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.toUpperCase())} className="font-mono" /><Button onClick={verifyRewardByCode} className="bg-green-600 hover:bg-green-700">Verify</Button></div>
            </div>
            {selectedReward && (
              <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
                <div className="flex items-start justify-between">
                  <div><h4 className="font-semibold text-gray-800">{selectedReward.rewardTitle}</h4><p className="text-sm text-gray-600 mt-1">Resident ID: {selectedReward.userId?.slice(0, 12)}...</p><p className="text-xs text-gray-500 mt-1">Redeemed on: {new Date(selectedReward.redeemedAt?.toDate?.() || selectedReward.redeemedAt).toLocaleDateString()}</p><p className="text-xs text-gray-500">Code: <span className="font-mono font-bold">{selectedReward.redeemCode}</span></p></div>
                  <div className="flex gap-2"><Button onClick={() => updateRewardStatus(selectedReward.id, "claimed")} className="bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-1" /> Claim & Complete</Button><Button variant="outline" onClick={() => setSelectedReward(null)} className="border-gray-400">Cancel</Button></div>
                </div>
              </Card>
            )}
            <div><h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-yellow-500" /> Pending Rewards ({pendingRewards.length})</h4>
              <div className="space-y-3">
                {pendingRewards.map((r) => {
                  const resident = residents.find(res => res.id === r.userId);
                  return (<Card key={r.id} className="p-4 bg-yellow-50 border-yellow-200"><div className="flex items-start justify-between"><div><h4 className="font-semibold text-gray-800">{r.rewardTitle}</h4><p className="text-sm text-gray-600">{resident?.name || "Unknown Resident"}</p><p className="text-xs text-gray-500 mt-1">Code: <span className="font-mono font-bold">{r.redeemCode}</span></p><p className="text-xs text-gray-500">Redeemed: {new Date(r.redeemedAt?.toDate?.() || r.redeemedAt).toLocaleDateString()}</p></div><Button onClick={() => updateRewardStatus(r.id, "claimed")} className="bg-green-600 hover:bg-green-700"><Check className="w-4 h-4 mr-1" /> Claim</Button></div></Card>);
                })}
              </div>
            </div>
            <div className="mt-6"><h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Claimed Rewards History</h4>
              <div className="space-y-2">{rewards.filter(r => r.status === "claimed").slice(0, 5).map((r) => {
                const resident = residents.find(res => res.id === r.userId);
                return (<div key={r.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center"><div><p className="text-sm font-medium">{r.rewardTitle}</p><p className="text-xs text-gray-500">{resident?.name || "Unknown"}</p></div><Badge className="bg-green-100 text-green-700">Claimed</Badge></div>);
              })}{rewards.filter(r => r.status === "claimed").length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No claimed rewards yet</p>}</div>
            </div>
          </Card>
        </TabsContent>

        {/* HEALTH LOGS TAB - WITH SIDEBAR LAYOUT */}
        <TabsContent value="health-logs" className="space-y-4">
          <Card className="p-6 shadow-md rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Resident Health Logs</h3>
              <p className="text-sm text-muted-foreground ml-auto">Showing residents with health logs only</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Sidebar - List of Residents */}
              <div className="md:col-span-1 border-r pr-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search resident..." 
                    value={healthLogsSearchQ} 
                    onChange={(e) => setHealthLogsSearchQ(e.target.value)} 
                    className="pl-9" 
                  />
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredResidentsWithLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No residents with health logs</p>
                  ) : (
                    filteredResidentsWithLogs.map((resident) => {
                      const residentLogs = healthLogs.filter(log => log.userId === resident.id);
                      const latestLog = residentLogs[0];
                      const isSelected = selectedResidentForLogs?.id === resident.id;
                      return (
                        <div 
                          key={resident.id} 
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected ? "bg-green-50 border-l-4 border-green-600" : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            setSelectedResidentForLogs(resident);
                            setSelectedResidentLogs(residentLogs);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <p className="font-medium text-sm">{resident.name}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate">{resident.address}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {residentLogs.length} logs
                                </Badge>
                                {latestLog && (
                                  <Badge className={
                                    latestLog.status === "Stable" ? "bg-green-100 text-green-700" :
                                    latestLog.status === "Under Observation" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  }>
                                    {latestLog.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Stethoscope className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Side - Health Logs Details */}
              <div className="md:col-span-2">
                {!selectedResidentForLogs ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a resident from the left to view their health logs</p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 pb-3 border-b">
                      <h4 className="font-semibold text-lg">{selectedResidentForLogs.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedResidentForLogs.address}</p>
                      <p className="text-xs text-muted-foreground mt-1">📞 {selectedResidentForLogs.phone}</p>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {selectedResidentLogs.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No health logs yet</p>
                      ) : (
                        selectedResidentLogs.map((log) => (
                          <Card key={log.id} className="p-4 bg-gray-50 hover:bg-gray-100 transition">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-medium text-sm">{log.date} at {log.time}</p>
                                  <Badge className={
                                    log.status === "Stable" ? "bg-green-100 text-green-700" :
                                    log.status === "Under Observation" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  }>
                                    {log.status}
                                  </Badge>
                                </div>
                                {log.symptoms && log.symptoms.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-gray-500">Symptoms:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {log.symptoms.map((symptom, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {symptom}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                  {log.temp && (
                                    <p className="text-sm"><span className="font-medium">Temperature:</span> {log.temp}</p>
                                  )}
                                  {log.bp && (
                                    <p className="text-sm"><span className="font-medium">Blood Pressure:</span> {log.bp}</p>
                                  )}
                                  {log.hr && (
                                    <p className="text-sm"><span className="font-medium">Heart Rate:</span> {log.hr}</p>
                                  )}
                                </div>
                                {log.notes && (
                                  <p className="text-sm text-gray-500 mt-2"><span className="font-medium">Notes:</span> {log.notes}</p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}