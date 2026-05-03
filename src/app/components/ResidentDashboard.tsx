import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Heart, Award, Shield, Stethoscope, Activity, Bell, Calendar, Gift, Phone, Megaphone, FileText, ChevronRight } from "lucide-react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

interface HealthLog {
  id: string;
  userId: string;
  symptoms?: string[];
  temp?: string;
  bp?: string;
  hr?: string;
  notes?: string;
  status: string;
  date: string;
  time: string;
  createdAt: any;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: any;
}

export function ResidentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [lastLog, setLastLog] = useState<{ date: string; status: string } | null>(null);
  const [loggedToday, setLoggedToday] = useState(false);
  const [userName, setUserName] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentLogs, setRecentLogs] = useState<HealthLog[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || "Resident");
        await loadAnnouncements();
      } else {
        navigate("/resident/signin");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REAL-TIME: Health logs listener
  useEffect(() => {
    if (!user) return;
    
    const logsQuery = query(
      collection(db, "health_logs"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logs: HealthLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as HealthLog));
      
      setRecentLogs(logs.slice(0, 5));
      
      const totalPoints = logs.length * 10;
      setPoints(totalPoints);
      
      const today = new Date().toLocaleDateString("en-PH");
      const hasLoggedToday = logs.some(log => log.date === today);
      setLoggedToday(hasLoggedToday);
      
      if (logs.length > 0) {
        const latestLog = logs[0];
        setLastLog({ date: latestLog.date, status: latestLog.status });
      } else {
        setLastLog(null);
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  const loadAnnouncements = async () => {
    try {
      const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(5));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const announcementsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Announcement));
        setAnnouncements(announcementsList);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  const nextReward = 500;
  const progress = Math.min((points / nextReward) * 100, 100);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "vaccine": return <Shield className="w-4 h-4 text-blue-500" />;
      case "activity": return <Calendar className="w-4 h-4 text-green-500" />;
      default: return <Megaphone className="w-4 h-4 text-orange-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm mb-1">Welcome back,</p>
            <h1 className="text-2xl font-bold mb-1">{userName}!</h1>
            <p className="text-green-100 text-sm">Magandang Araw! Your health journey continues today.</p>
            {loggedToday && (
              <Badge className="mt-3 bg-white/20 text-white border-white/30">✓ Logged today</Badge>
            )}
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-full bg-white/20 items-center justify-center">
            <Heart className="w-7 h-7 fill-white" />
          </div>
        </div>
      </div>

      {/* Recent Health Logs Section - REAL-TIME */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-800">Recent Health Logs</h2>
            </div>
            <button 
              onClick={() => navigate("/resident/log-health")} 
              className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              Log New <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No health logs yet</p>
              <Button 
                onClick={() => navigate("/resident/log-health")} 
                variant="outline" 
                className="mt-3 border-green-600 text-green-600"
              >
                Log Your First Health Check
              </Button>
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-800">{log.date} at {log.time}</h3>
                      <Badge className={
                        log.status === "Stable" ? "bg-green-100 text-green-700" :
                        log.status === "Under Observation" ? "bg-yellow-100 text-yellow-700" :
                        log.status === "Needs Attention" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }>
                        {log.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {log.symptoms && log.symptoms.length > 0 && (
                        <span>Symptoms: {log.symptoms.join(", ")}</span>
                      )}
                      {log.temp && <span>Temp: {log.temp}</span>}
                      {log.bp && <span>BP: {log.bp}</span>}
                      {log.hr && <span>HR: {log.hr}</span>}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-gray-400 mt-1">Notes: {log.notes}</p>
                    )}
                  </div>
                  <Activity className="w-4 h-4 text-green-500" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* What's New Section */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-800">What's New</h2>
            <span className="text-xs text-gray-400 ml-auto">Latest updates</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {announcements.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No announcements yet</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      {getTypeIcon(announcement.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-800">{announcement.title}</h3>
                      <span className="text-xs text-gray-400">
                        {announcement.createdAt?.toDate 
                          ? new Date(announcement.createdAt.toDate()).toLocaleDateString()
                          : new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{announcement.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 shadow-md rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Health Points</h3>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Award className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <span className="text-2xl font-bold text-green-600">{points}</span>
          <Progress value={progress} className="h-2 my-2" />
          <p className="text-xs text-gray-400">{nextReward - points} points to next reward</p>
        </Card>

        <Card className="p-5 shadow-md rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Health Status</h3>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <Badge className={
            lastLog?.status === "Stable" ? "bg-green-500" : 
            lastLog?.status === "Under Observation" ? "bg-yellow-500" : 
            lastLog?.status === "Needs Attention" ? "bg-red-500" : "bg-gray-500"
          }>
            {lastLog?.status || "No data yet"}
          </Badge>
          <p className="text-xs text-gray-400 mt-2">
            {lastLog ? `Last check-in: ${lastLog.date}` : "Log your health to see status"}
          </p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/resident/log-health")}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl hover:shadow-md transition-all"
          >
            <Stethoscope className="w-6 h-6 text-green-600" />
            <span className="text-xs font-medium">Log Health</span>
          </button>
          <button
            onClick={() => navigate("/resident/appointments")}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:shadow-md transition-all"
          >
            <Calendar className="w-6 h-6 text-blue-600" />
            <span className="text-xs font-medium">Appointments</span>
          </button>
          <button
            onClick={() => navigate("/resident/tasks-rewards")}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl hover:shadow-md transition-all"
          >
            <Gift className="w-6 h-6 text-yellow-600" />
            <span className="text-xs font-medium">Rewards</span>
          </button>
          <button
            onClick={() => navigate("/resident/sos")}
            className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl hover:shadow-md transition-all"
          >
            <Phone className="w-6 h-6 text-red-600" />
            <span className="text-xs font-medium">Emergency</span>
          </button>
        </div>
      </div>

      {/* Log Health CTA */}
      {!loggedToday && (
        <Button
          onClick={() => navigate("/resident/log-health")}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6"
        >
          <Stethoscope className="w-5 h-5 mr-2" />
          Log Health Now (+10 pts)
        </Button>
      )}
    </div>
  );
}