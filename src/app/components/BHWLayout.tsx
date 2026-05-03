import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Users, Calendar, Menu, LogOut,
  ChevronDown, ChevronRight, X,
  Globe, ClipboardList, User, Gift, UserCheck, UserPlus, Bell, Megaphone,
} from "lucide-react";
import { Button } from "./ui/button";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { cn } from "./ui/utils";
import { Toaster } from "./ui/sonner";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type NavLeaf = {
  path: string;
  tab?: string | null;
  icon: React.ElementType;
  label: string;
};
type NavGroup = { label: string; icon: React.ElementType; children: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const isGroup = (item: NavItem): item is NavGroup => "children" in item;

// Base nav items for BHW users (walang Admin at walang Dashboard admin)
const baseNavItems: NavItem[] = [
  { path: "/bhw/dashboard", tab: null, icon: LayoutDashboard, label: "Dashboard" },
  {
    label: "Patients",
    icon: Users,
    children: [
      { path: "/bhw/my-residents", tab: null, icon: Users, label: "My Residents" },
      { path: "/bhw/dashboard", tab: "patients", icon: Users, label: "Patient List" },
      { path: "/bhw/dashboard", tab: "appointments", icon: ClipboardList, label: "Queue (Tab)" },
      { path: "/bhw/rewards", tab: null, icon: Gift, label: "Rewards" },
      { path: "/bhw/tasks", tab: null, icon: ClipboardList, label: "Manage Tasks" },
      { path: "/bhw/manage-rewards", tab: null, icon: Gift, label: "Manage Rewards" },
    ],
  },
  { path: "/bhw/announcements", tab: null, icon: Megaphone, label: "Announcements" },
  {
    label: "Settings",
    icon: Globe,
    children: [
      { path: "/bhw/profile", icon: User, label: "My Profile" },
    ],
  },
];

// Admin-only nav items
const adminNavItems: NavItem[] = [
  {
    label: "Admin",
    icon: UserPlus,
    children: [
      { path: "/bhw/admin-dashboard", tab: null, icon: LayoutDashboard, label: "Dashboard" },
      { path: "/bhw/pending-approvals", tab: null, icon: UserCheck, label: "Pending Approvals" },
    ],
  },
];

function useCurrentTab(location: ReturnType<typeof useLocation>) {
  return new URLSearchParams(location.search).get("tab");
}

function isLeafActive(item: NavLeaf, pathname: string, currentTab: string | null) {
  if (item.tab === null || item.tab === undefined) {
    return pathname === item.path && !currentTab;
  }
  return pathname === item.path && currentTab === item.tab;
}

export function BHWLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("Health Worker");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Admin: false,
    Patients: true,
    Settings: false,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const currentTab = useCurrentTab(location);

  // FOR ADMIN: Only show Admin menu (no BHW Dashboard)
  // FOR BHW: Show baseNavItems
  let navItems: NavItem[] = [];
  if (isAdmin) {
    navItems = [...adminNavItems];
  } else {
    navItems = [...baseNavItems];
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const bhwDoc = await getDoc(doc(db, "bhws", user.uid));
        if (bhwDoc.exists()) {
          const data = bhwDoc.data();
          setUserName(data.name || user.displayName || user.email?.split('@')[0] || "Health Worker");
          setIsAdmin(data.isAdmin === true);
          setLoading(false);
        } else {
          await auth.signOut();
          navigate("/bhw/signin");
        }
      } else {
        navigate("/bhw/signin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    navItems.forEach((item) => {
      if (isGroup(item)) {
        const inside = item.children.some((c) => isLeafActive(c, location.pathname, currentTab));
        if (inside) setOpenGroups((prev) => ({ ...prev, [item.label]: true }));
      }
    });
  }, [location.pathname, currentTab, isAdmin]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const handleNav = (item: NavLeaf) => {
    if (item.tab) {
      navigate(`${item.path}?tab=${item.tab}`);
    } else {
      navigate(item.path);
    }
    setDrawerOpen(false);
  };

  const toggleGroup = (label: string) => {
    if (sidebarCollapsed) return;
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isGroupActiveCheck = (group: NavGroup) =>
    group.children.some((c) => isLeafActive(c, location.pathname, currentTab));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B0B45] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderSidebarItem = (item: NavItem) => {
    if (!isGroup(item)) {
      const active = isLeafActive(item, location.pathname, currentTab);
      const Icon = item.icon;
      return (
        <button
          key={item.label}
          onClick={() => handleNav(item)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left",
            active ? "bg-[#0B0B45] text-white shadow-md" : "text-gray-700 hover:bg-blue-50",
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
    const groupActive = isGroupActiveCheck(item);

    return (
      <div key={item.label}>
        <button
          onClick={() => toggleGroup(item.label)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all text-left",
            groupActive && !open ? "text-[#0B0B45] font-semibold" : "text-gray-700 hover:bg-blue-50",
            sidebarCollapsed && "justify-center"
          )}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <div className="flex items-center gap-3">
            <Icon className={cn("w-5 h-5 flex-shrink-0", groupActive && "text-[#0B0B45]")} />
            {!sidebarCollapsed && <span className="font-medium text-sm">{item.label}</span>}
          </div>
          {!sidebarCollapsed && (open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </button>

        {!sidebarCollapsed && open && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              const active = isLeafActive(child, location.pathname, currentTab);
              return (
                <button
                  key={child.label}
                  onClick={() => handleNav(child)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all text-left",
                    active ? "bg-[#0B0B45] text-white shadow-sm" : "text-gray-600 hover:bg-blue-50"
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
      <KeyboardShortcuts userType="bhw" />
      <Toaster position="top-right" />

      {/* Mobile Drawer */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        ref={drawerRef}
      >
        <div className="bg-[#0B0B45] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full bg-white p-1" />
            <div>
              <p className="font-bold text-sm">KomuniCare</p>
              <p className="text-xs text-blue-200">BHW Portal</p>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-blue-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-medium text-gray-800">{userName}</p>
          <p className="text-xs text-gray-500">{isAdmin ? "Admin" : "Health Worker"}</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            if (!isGroup(item)) {
              const active = isLeafActive(item, location.pathname, currentTab);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item)}
                  className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left", active ? "bg-[#0B0B45] text-white" : "text-gray-700 hover:bg-blue-50")}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            } else {
              const Icon = item.icon;
              const open = openGroups[item.label];
              const groupActive = isGroupActiveCheck(item);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setOpenGroups(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                    className={cn("w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all", groupActive && !open ? "text-[#0B0B45] font-semibold" : "text-gray-700 hover:bg-blue-50")}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {open && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isLeafActive(child, location.pathname, currentTab);
                        return (
                          <button
                            key={child.label}
                            onClick={() => handleNav(child)}
                            className={cn("w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all text-left", active ? "bg-[#0B0B45] text-white" : "text-gray-600 hover:bg-blue-50")}
                          >
                            <ChildIcon className="w-4 h-4" />
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
          <div className="bg-blue-50 rounded-lg p-4 mb-3">
            <p className="text-sm font-medium text-[#0B0B45] mb-1">Need Help?</p>
            <p className="text-xs text-blue-600">Contact your barangay health center</p>
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
                <button onClick={() => setDrawerOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
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
                <button className="p-2 rounded-full hover:bg-gray-100 relative"><Bell className="w-5 h-5 text-gray-500" /></button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 hidden sm:block">{userName}</span>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-[#0B0B45] font-medium text-sm">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
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
                <div className="bg-blue-50 rounded-lg p-4 mb-3">
                  <p className="text-sm font-medium text-[#0B0B45] mb-1">Need Help?</p>
                  <p className="text-xs text-blue-600">Contact your barangay health center</p>
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