import { createBrowserRouter, Navigate } from "react-router";

// Auth Pages
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import OTPVerification from "./pages/otp-verification";
import ResetPassword from "./pages/reset-password";

// Admin Dashboard & Pages
import AdminDashboard from "./pages/admin-dashboard";
import Tasks from "./pages/tasks";
import Projects from "./pages/projects";
import Attendance from "./pages/attendance";
import Leave from "./pages/leave";
import Departments from "./pages/departments";
import Employees from "./pages/employees";
import Requests from "./pages/requests";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";

// Team Lead Dashboard & Pages
import TeamLeadDashboard from "./pages/team-lead-dashboard";
import TeamLeadTeam from "./pages/team-lead-team";
import TeamLeadTasks from "./pages/team-lead-tasks";
import TeamLeadProjects from "./pages/team-lead-projects";
import TeamLeadReports from "./pages/team-lead-reports";
import TeamLeadSettings from "./pages/team-lead-settings";
import TeamLeadAttendance from "./pages/team-lead-attendance";
import TeamLeadLeave from "./pages/team-lead-leave";

// Employee Dashboard & Pages
import EmployeeDashboard from "./pages/employee-dashboard";
import EmployeeTasks from "./pages/employee-tasks";
import EmployeeAttendance from "./pages/employee-attendance";
import EmployeeProjects from "./pages/employee-projects";
import EmployeeLeave from "./pages/employee-leave";
import EmployeePerformance from "./pages/employee-performance";
import EmployeeRequests from "./pages/employee-requests";
import EmployeeProfile from "./pages/employee-profile";
import EmployeeSettings from "./pages/employee-settings";

// Communication Pages
import Chat from "./pages/chat";
import Meetings from "./pages/meetings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  // ─── Auth Routes ───────────────────────────────────────────
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/otp-verification", element: <OTPVerification /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // ─── Admin Routes ──────────────────────────────────────────
  { path: "/admin/dashboard", element: <AdminDashboard /> },
  { path: "/admin/tasks", element: <Tasks /> },
  { path: "/admin/attendance", element: <Attendance /> },
  { path: "/admin/projects", element: <Projects /> },
  { path: "/admin/leave", element: <Leave /> },
  { path: "/admin/requests", element: <Requests /> },
  { path: "/admin/employees", element: <Employees /> },
  { path: "/admin/departments", element: <Departments /> },
  { path: "/admin/meetings", element: <Meetings /> },
  { path: "/admin/analytics", element: <Analytics /> },
  { path: "/admin/settings", element: <Settings /> },

  // ─── Team Lead Routes (Restricted authority — team data only) ──────────────────────────────────────
  { path: "/teamlead/dashboard", element: <TeamLeadDashboard /> },
  { path: "/teamlead/team",      element: <TeamLeadTeam /> },
  { path: "/teamlead/projects",  element: <TeamLeadProjects /> },
  { path: "/teamlead/tasks",     element: <TeamLeadTasks /> },
  { path: "/teamlead/attendance",element: <TeamLeadAttendance /> },
  { path: "/teamlead/leave",     element: <TeamLeadLeave /> },
  { path: "/teamlead/reports",   element: <TeamLeadReports /> },
  { path: "/teamlead/meetings",  element: <Meetings /> },
  { path: "/teamlead/settings",  element: <TeamLeadSettings /> },

  // ─── Employee Routes ───────────────────────────────────────
  { path: "/employee/dashboard",   element: <EmployeeDashboard /> },
  { path: "/employee/tasks",       element: <EmployeeTasks /> },
  { path: "/employee/attendance",  element: <EmployeeAttendance /> },
  { path: "/employee/projects",    element: <EmployeeProjects /> },
  { path: "/employee/leave",       element: <EmployeeLeave /> },
  { path: "/employee/performance", element: <EmployeePerformance /> },
  { path: "/employee/requests",    element: <EmployeeRequests /> },
  { path: "/employee/profile",     element: <EmployeeProfile /> },
  { path: "/employee/settings",    element: <EmployeeSettings /> },

  // ─── Shared Communication Routes ───────────────────────────
  { path: "/chat", element: <Chat /> },
  { path: "/meetings", element: <Meetings /> },

  // ─── Legacy / Redirect Routes ──────────────────────────────
  { path: "/dashboard", element: <Navigate to="/admin/dashboard" replace /> },
  { path: "/employee-dashboard", element: <Navigate to="/employee/dashboard" replace /> },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
