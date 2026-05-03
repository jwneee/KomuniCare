import { createBrowserRouter } from "react-router";
import { WelcomePage } from "./components/WelcomePage";
import { InfoLayout } from "./components/InfoLayout";
import { AboutBarangay } from "./components/AboutBarangay";
import { BarangayOfficials } from "./components/BarangayOfficials";
import { BHWList } from "./components/BHWList";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsPage } from "./components/TermsPage";
import { ResidentSignIn } from "./components/ResidentSignIn";
import { ResidentRegister } from "./components/ResidentRegister";
import { BHWSignIn } from "./components/BHWSignIn";
import { BHWRegister } from "./components/BHWRegister";
import { ResidentLayout } from "./components/ResidentLayout";
import { BHWLayout } from "./components/BHWLayout";
import { ResidentDashboard } from "./components/ResidentDashboard";
import { HealthLoggingForm } from "./components/HealthLoggingForm";
import { TasksRewards } from "./components/TasksRewards";
import { EmergencyContacts } from "./components/EmergencyContacts";
import BHWDashboard from "./components/BHWDashboard";
import { AppointmentQueue } from "./components/AppointmentQueue";
import { EmergencySOS } from "./components/EmergencySOS";
import { ResidentProfile } from "./components/ResidentProfile";
import BHWResidents from "./components/BHWResidents";
import { ResetPassword } from "./components/ResetPassword";
import { BHWProfile } from "./components/BHWProfile";
import { BHWRewards } from "./components/BHWRewards";
import { BHWTasks } from "./components/BHWTasks";
import { BHWManageRewards } from "./components/BHWManageRewards";
import { BHWPendingApprovals } from "./components/BHWPendingApprovals";
import { BHWCreateAccount } from "./components/BHWCreateAccount";
import { BHWManageAnnouncements } from "./components/BHWManageAnnouncements";
import AdminDashboard from "./components/AdminDashboard";

export const router = createBrowserRouter([
  { path: "/", Component: WelcomePage },
  { path: "/reset-password", Component: ResetPassword },
  { path: "/resident/signin", Component: ResidentSignIn },
  { path: "/resident/register", Component: ResidentRegister },
  { path: "/bhw/signin", Component: BHWSignIn },
  { path: "/bhw/register", Component: BHWRegister },

  {
    path: "/",
    Component: InfoLayout,
    children: [
      { path: "about-barangay", Component: AboutBarangay },
      { path: "barangay-officials", Component: BarangayOfficials },
      { path: "bhw-list", Component: BHWList },
      { path: "privacy-policy", Component: PrivacyPolicy },
      { path: "terms", Component: TermsPage },
    ],
  },

  {
    path: "/resident",
    Component: ResidentLayout,
    children: [
      { path: "dashboard", Component: ResidentDashboard },
      { path: "log-health", Component: HealthLoggingForm },
      { path: "tasks-rewards", Component: TasksRewards },
      { path: "emergency", Component: EmergencyContacts },
      { path: "appointments", Component: AppointmentQueue },
      { path: "sos", Component: EmergencySOS },
      { path: "profile", Component: ResidentProfile },
    ],
  },

  {
    path: "/bhw",
    Component: BHWLayout,
    children: [
      { path: "dashboard", Component: BHWDashboard },
      { path: "appointments", Component: AppointmentQueue },
      { path: "my-residents", Component: BHWResidents },
      { path: "rewards", Component: BHWRewards },
      { path: "tasks", Component: BHWTasks },
      { path: "manage-rewards", Component: BHWManageRewards },
      { path: "pending-approvals", Component: BHWPendingApprovals },
      { path: "create-bhw", Component: BHWCreateAccount },
      { path: "profile", Component: BHWProfile },
      { path: "announcements", Component: BHWManageAnnouncements },
      { path: "admin-dashboard", Component: AdminDashboard },
    ],
  },
]);