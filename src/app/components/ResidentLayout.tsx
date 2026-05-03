import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  Home, FileHeart, Phone, Gift, LogOut, Menu, X,
  ChevronDown, ChevronRight,
  Calendar, Bell, AlertTriangle,
  Trophy, Globe, HelpCircle, User,
} from "lucide-react";
import { Button } from "./ui/button";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { cn } from "./ui/utils";
import { Toaster } from "./ui/sonner";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type NavLeaf = { path: string; icon: React.ElementType; label: string };
type NavGroup = { label: string; icon: React.ElementType; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const isGroup = (item: NavItem): item is NavGroup => "children" in item;

const navItems: NavItem[] = [
  { path: "/resident/dashboard", icon: Home, label: "Dashboard" },
  {
    label: "Health",
    icon: Bell,
    children: [
      { path: "/resident/log-health", icon: FileHeart, label: "Log Health" },
    ],
  },
  { path: "/resident/appointments", icon: Calendar, label: "Appointments" },
  {
    label: "Community",
    icon: Trophy,
    children: [
      { path: "/resident/tasks-rewards", icon: Gift, label: "Rewards" },
    ],
  },
  {
    label: "Support",
    icon: HelpCircle,
    children: [
      { path: "/resident/sos", icon: AlertTriangle, label: "Emergency SOS" },
      { path: "/resident/emergency", icon: Phone, label: "Emergency Contacts" },
    ],
  },
  {
    label: "Settings",
    icon: Globe,
    children: [
      { path: "/resident/profile", icon: User, label: "My Profile" },
      // Language option REMOVED
    ],
  },
];

export function ResidentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("Resident");
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Health: true,
    Community: false,
    Support: false,
    Settings: false,
  });
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const residentDoc = await getDoc(doc(db, "residents", user.uid));
        if (residentDoc.exists()) {
          const data = residentDoc.data();
          setUserName(data.name || user.displayName || user.email?.split('@')[0] || "Resident");
          setLoading(false);
        } else {
          await auth.signOut();
          navigate("/resident/signin");
        }
      } else {
        navigate("/resident/signin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    navItems.forEach((item) => {
      if (isGroup(item)) {
        const inside = item.children.some((c) => location.pathname === c.path);
        if (inside) setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const toggleGroup = (label: string) => {
    if (sidebarCollapsed) return;
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isLeafActive = (path: string) => location.pathname === path;
  const isGroupActive = (group: NavGroup) =>
    group.children.some((c) => location.pathname === c.path);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderSidebarItem = (item: NavItem) => {
    if (!isGroup(item)) {
      const active = isLeafActive(item.path);
      const Icon = item.icon;
      return (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left",
            active ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-green-50",
            sidebarCollapsed && "justify-center"
          )}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
        </button>
      );
    }

    const Icon = item.icon;
    const open = openGroups[item.label];
    const groupActive = isGroupActive(item);

    return (
      <div key={item.label}>
        <button
          onClick={() => toggleGroup(item.label)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all",
            groupActive && !open ? "text-green-600 font-semibold" : "text-gray-700 hover:bg-green-50",
            sidebarCollapsed && "justify-center"
          )}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn("w-5 h-5 flex-shrink-0", groupActive && "text-green-600")} />
            {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
          </div>
          {!sidebarCollapsed && (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </button>

        {!sidebarCollapsed && open && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const active = isLeafActive(child.path);
              return (
                <button
                  key={child.path}
                  onClick={() => navigate(child.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all text-left",
                    active ? "bg-green-600 text-white shadow-sm" : "text-gray-600 hover:bg-green-50"
                  )}
                >
                  <ChildIcon className="w-4 h-4 flex-shrink-0 ml-1" />
                  <span>{child.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <KeyboardShortcuts userType="resident" />
      <Toaster position="top-right" />

      {/* Mobile Drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        ref={drawerRef}
      >
        <div className="bg-green-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full bg-white p-1" />
            <div>
              <p className="font-bold text-sm">KomuniCare</p>
              <p className="text-xs text-green-200">Resident Portal</p>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-green-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-medium text-gray-800">{userName}</p>
          <p className="text-xs text-gray-500">Resident</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            if (!isGroup(item)) {
              const active = isLeafActive(item.path);
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left",
                    active ? "bg-green-600 text-white" : "text-gray-700 hover:bg-green-50"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            } else {
              const Icon = item.icon;
              const open = openGroups[item.label];
              const groupActive = isGroupActive(item);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all",
                      groupActive && !open ? "text-green-600 font-semibold" : "text-gray-700 hover:bg-green-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {open && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isLeafActive(child.path);
                        return (
                          <button
                            key={child.path}
                            onClick={() => { navigate(child.path); setDrawerOpen(false); }}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all text-left",
                              active ? "bg-green-600 text-white" : "text-gray-600 hover:bg-green-50"
                            )}
                          >
                            <ChildIcon className="w-4 h-4 flex-shrink-0 ml-1" />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-green-50 rounded-lg p-4 mb-3">
            <p className="text-sm font-medium text-green-800 mb-1">Need Help?</p>
            <p className="text-xs text-green-700">Contact your barangay health center</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overlay */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Main Container */}
      <div className="flex flex-col min-h-screen bg-gray-50">
        
        {/* White Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center gap-2 cursor-default">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">KomuniCare</span>
                    <p className="text-xs text-gray-500 hidden sm:block">Barangay New Kalalake Health Center</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 rounded-full hover:bg-gray-100 relative">
                  <Bell className="w-5 h-5 text-gray-500" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:block">{userName}</span>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-medium text-sm">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Body with Sidebar and Content */}
        <div className="flex flex-1">
          <aside
            className={cn(
              "hidden lg:flex flex-col border-r border-gray-200 bg-white transition-all duration-200 sticky top-[64px] h-[calc(100vh-64px)]",
              sidebarCollapsed ? "w-20" : "w-64"
            )}
          >
            <div className="p-4 border-b border-gray-200">
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full justify-start text-gray-600">
                <Menu className="w-5 h-5" />
                {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
              </Button>
            </div>

            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => renderSidebarItem(item))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              {!sidebarCollapsed && (
                <div className="bg-green-50 rounded-lg p-4 mb-3">
                  <p className="text-sm font-medium text-green-800 mb-1">Need Help?</p>
                  <p className="text-xs text-green-700">Contact your barangay health center</p>
                </div>
              )}
              <Button onClick={handleLogout} variant="ghost" className={cn("w-full text-red-600 hover:bg-red-50", sidebarCollapsed ? "justify-center px-0" : "justify-start gap-2")}>
                <LogOut className="w-4 h-4" />
                {!sidebarCollapsed && <span>Sign Out</span>}
              </Button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}