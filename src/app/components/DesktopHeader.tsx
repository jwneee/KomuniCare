import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Input } from "./ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useTheme } from "next-themes";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Logo } from "./Logo";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
  audience?: string;
}

export function DesktopHeader({ userType }: { userType: "resident" | "bhw" }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split('@')[0] || "User");
      }
    });

    const unsubscribeNotif = onSnapshot(
      query(collection(db, "notifications"), orderBy("createdAt", "desc")),
      (snapshot) => {
        let notifs: Notification[] = snapshot.docs.map(doc => {
          const data = doc.data();
          let notificationType: "info" | "success" | "warning" = "info";
          
          if (data.type === "emergency") notificationType = "warning";
          else if (data.type === "reward") notificationType = "success";
          else if (data.type === "appointment") notificationType = "info";
          
          return {
            id: doc.id,
            title: data.type === "emergency" ? "🚨 EMERGENCY" : data.type === "appointment" ? "📅 Appointment" : data.type === "reward" ? "🎁 Reward" : "ℹ️ Update",
            description: data.message || "You have a new notification",
            time: data.createdAt?.toDate ? formatTimeAgo(data.createdAt.toDate()) : "Just now",
            read: data.read || false,
            type: notificationType,
            audience: data.audience,
          };
        });
        
        if (userType === "resident") {
          notifs = notifs.filter(n => n.audience === "resident" || !n.audience);
        } else if (userType === "bhw") {
          notifs = notifs.filter(n => n.audience === "bhw" || !n.audience);
        }
        
        setNotifications(notifs);
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeNotif();
    };
  }, [userType]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    for (const notif of unreadNotifs) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <header className="hidden lg:block sticky top-0 z-[100] bg-background border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <Logo size="sm" />

        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-6 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients, records, programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 w-full"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative inline-flex items-center justify-center size-9 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>

          <Popover>
            <PopoverTrigger>
              <button className="relative inline-flex items-center justify-center size-9 rounded-md hover:bg-accent transition-colors" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-medium pointer-events-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs px-2 py-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`w-full text-left p-4 border-b hover:bg-accent transition-colors ${!notification.read ? "bg-accent/50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mb-1">{notification.description}</p>
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                        </div>
                        {!notification.read && <div className="w-2 h-2 rounded-full bg-red-600 mt-1 flex-shrink-0" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-red-600 text-white text-sm">{userInitials}</AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline-block text-sm font-medium">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}