import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  Video,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Shield,
  UsersRound,
  Building2,
  Moon,
  Sun,
  Mail,
  Phone,
  IdCard,
  Briefcase,
  Edit3,
  Camera,
  FileBarChart2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { showToast } from "../utils/toast";
import { useAttendance } from "../contexts/attendance-context";
import { clearAuthSession, getCurrentUser } from "../utils/auth";
import { updateMe, fetchNotifications, markNotificationsAsRead, markAnnouncementAsViewed } from "../utils/api";
import { getSocket } from "../utils/socket";

const adminNavGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { name: "Employees", path: "/admin/employees", icon: Users },
      { name: "Projects", path: "/admin/projects", icon: FolderKanban },
      { name: "Tasks", path: "/admin/tasks", icon: CheckSquare },
      { name: "Departments", path: "/admin/departments", icon: Building2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Attendance", path: "/admin/attendance", icon: Calendar },
      { name: "Leaves", path: "/admin/leave", icon: FileText },
      { name: "Requests", path: "/admin/requests", icon: ClipboardList, badge: "5" },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Chat", path: "/chat", icon: MessageSquare },
      { name: "Meetings", path: "/admin/meetings", icon: Video },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
      { name: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

const teamleadNavGroups = [
  {
    label: "Overview",
    items: [
      { name: "Team Lead Dashboard", path: "/teamlead/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "My Team",
    items: [
      { name: "My Team", path: "/teamlead/team", icon: UsersRound },
    ],
  },
  {
    label: "Work",
    items: [
      { name: "Projects", path: "/teamlead/projects", icon: FolderKanban },
      { name: "Tasks", path: "/teamlead/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Attendance", path: "/teamlead/attendance", icon: Calendar },
      { name: "Leaves", path: "/teamlead/leave", icon: FileText },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Reports", path: "/teamlead/reports", icon: FileBarChart2 },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Chat", path: "/chat", icon: MessageSquare },
      { name: "Meetings", path: "/teamlead/meetings", icon: Video },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", path: "/teamlead/settings", icon: Settings },
    ],
  },
];

const employeeNavGroups = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Work",
    items: [
      { name: "My Tasks", path: "/employee/tasks", icon: CheckSquare },
      { name: "My Projects", path: "/employee/projects", icon: FolderKanban },
    ],
  },
  {
    label: "Personal",
    items: [
      { name: "Attendance", path: "/employee/attendance", icon: Calendar },
      { name: "My Leave", path: "/employee/leave", icon: FileText },
      { name: "Performance", path: "/employee/performance", icon: BarChart3 },
      { name: "Requests", path: "/employee/requests", icon: ClipboardList },
      { name: "My Profile", path: "/employee/profile", icon: User },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Chat", path: "/chat", icon: MessageSquare },
      { name: "Meetings", path: "/meetings", icon: Video },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", path: "/employee/settings", icon: Settings },
    ],
  },
];

const roleConfig = {
  admin: {
    label: "Administrator",
    color: "bg-[#162E93]",
    badge: "Admin",
    badgeColor: "bg-[#162E93]/10 text-[#162E93]",
    navGroups: adminNavGroups,
    roleIcon: Shield,
  },
  teamlead: {
    label: "Team Lead",
    color: "bg-[#088395]",
    badge: "Team Lead",
    badgeColor: "bg-[#088395]/10 text-[#088395]",
    navGroups: teamleadNavGroups,
    roleIcon: UsersRound,
  },
  employee: {
    label: "Employee",
    color: "bg-[#01B01B]",
    badge: "Employee",
    badgeColor: "bg-[#01B01B]/10 text-[#01B01B]",
    navGroups: employeeNavGroups,
    roleIcon: User,
  },
};

const initialNotifications = [];

function SidebarContent({ userRole, onClose }) {
  const location = useLocation();
  const config = roleConfig[userRole] || roleConfig.employee;
  const navGroups = config.navGroups || [];
  const currentUser = getCurrentUser() || {};
  const userNameStr = typeof currentUser.name === "object" ? (currentUser.name.name ?? "??") : (currentUser.name || "??");
  const initials = userNameStr.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#088395] rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">SyncFlow</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.badgeColor} bg-white/10 text-white/80`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
          {config.badge} View
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 sidebar-scrollbar">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-4">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-1.5">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all group ${
                    isActive
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-white/65 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    isActive ? "bg-[#088395] shadow-md" : "bg-white/5 group-hover:bg-white/10"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="bg-[#D6090D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#088395]" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile at Bottom */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/8 transition-all cursor-pointer">
          <div className={`w-9 h-9 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{typeof currentUser.name === "object" ? (currentUser.name.name ?? "Guest") : (currentUser.name || "Guest")}</p>
            <p className="text-xs text-white/50 truncate">{config.label}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-white/40" />
        </div>
      </div>
    </div>
  );
}

export function AppLayout({ children, userRole = "employee" }) {
  const navigate = useNavigate();
  const config = roleConfig[userRole] || roleConfig.employee;
  const attendance = useAttendance();

  const currentUser = getCurrentUser() || {};
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Scoped theme key
  const themeKey = `wf_theme_${(currentUser?.id || currentUser?._id) || 'guest'}`;
  const globalThemeKey = "wf_theme_global";

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem(themeKey) ?? localStorage.getItem(globalThemeKey);
    return stored === "dark";
  });

  // Apply dark mode to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(themeKey, "dark");
      localStorage.setItem(globalThemeKey, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(themeKey, "light");
      localStorage.setItem(globalThemeKey, "light");
    }
  }, [isDarkMode, themeKey]);

  const initials = (typeof currentUser.name === "object" ? (currentUser.name.name ?? "??") : (currentUser.name || "??")).split(" ").map(n => n[0]).join("").toUpperCase();

  const [profileData, setProfileData] = useState({
    email: currentUser.email || "",
    name: typeof currentUser.name === "object" ? (currentUser.name.name ?? "Guest") : (currentUser.name || "Guest"),
    role: config?.label || "Employee",
    password: "********",
    department: typeof currentUser.department === "object" ? (currentUser.department.name ?? "Engineering") : (currentUser.department || "Engineering"),
    joiningDate: typeof currentUser.joiningDate === "string" ? currentUser.joiningDate.slice(0, 10) : "2024-01-15",
    id: currentUser.employeeId || currentUser.id || currentUser._id || "EMP-001",
    cnic: currentUser.cnic || "12345-6789012-3",
    contact: currentUser.contact || currentUser.phone || "+1 (555) 123-4567",
    profilePicture: currentUser.avatarUrl || currentUser.profilePicture || "",
  });

  // Draft state for edit mode (pending changes, applied only on Save)
  const [draftData, setDraftData] = useState(null);
  const [draftPicture, setDraftPicture] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [viewAllModalOpen, setViewAllModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadNotifications() {
      try {
        const data = await fetchNotifications();
        if (mounted) {
          const items = Array.isArray(data) ? data : [];
          const mapped = items.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            time: n.time ? new Date(n.time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Recently",
            unread: n.unread,
            color: n.color || (n.type === 'meeting' ? 'bg-[#162E93]' : 'bg-[#088395]'),
            isAnnouncement: n.type === 'announcement' || n.type === 'meeting'
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    }
    loadNotifications();

    const socket = getSocket();
    socket.on('receive_notification', (notif) => {
      if (mounted) {
        showToast(`🔔 ${notif.title}: ${notif.message}`, "info");
        setNotifications(prev => [{
          id: Date.now(),
          ...notif,
          time: "Just now",
          unread: true,
          color: notif.type === 'meeting' ? 'bg-[#162E93]' : 'bg-[#088395]',
          isAnnouncement: notif.type === 'announcement' || notif.type === 'meeting'
        }, ...prev]);
      }
    });

    return () => {
      mounted = false;
      socket.off('receive_notification');
    };
  }, [currentUser.id, currentUser._id]);

  const handleNotificationClick = async (notif) => {
    if (notif.isAnnouncement) {
      setSelectedAnnouncement(notif);
      setAnnouncementModalOpen(true);
      if (notif.unread) {
        try {
          await markAnnouncementAsViewed(notif.id);
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
        } catch (err) {
          console.error("Failed to mark announcement as viewed", err);
          // Still mark as read locally to avoid stuck notification
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
        }
      }
    } else {
      // For operational notifications, just mark as read locally
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
      
      if (notif.type === 'task_done' || notif.type === 'task_overdue' || notif.type === 'task_new') {
        navigate(currentUser.role === 'admin' ? '/admin/tasks' : currentUser.role === 'teamlead' ? '/teamlead/tasks' : '/employee/tasks');
      } else if (notif.type === 'leave_request' || notif.type === 'leave_update') {
        navigate(currentUser.role === 'admin' ? '/admin/leave' : currentUser.role === 'teamlead' ? '/teamlead/leave' : '/employee/leave');
      } else if (notif.type === 'meeting') {
        const path = currentUser.role === 'admin' ? '/admin/meetings' : currentUser.role === 'teamlead' ? '/teamlead/meetings' : '/meetings';
        const typeParam = notif.meetingType ? `&type=${notif.meetingType}` : '';
        navigate(`${path}?join=${notif.meetingId}${typeParam}`);
      }
    }
    setNotificationsOpen(false);
  };

  const fileInputRef = useRef(null);

  const handlePickImage = () => {
    if (isEditMode) fileInputRef.current?.click();
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      setDraftPicture(dataUrl);
      showToast("Photo selected — click Save to apply", "info");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const displayedPicture = isEditMode && draftPicture !== null
    ? draftPicture
    : profileData.profilePicture;

  const unreadCount = notifications.filter(n => n.unread).length;

  const formatBreakTime = (s) => {
    if (s === 0) return "—";
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleProfileClick = () => {
    setProfileOpen(true);
    setIsEditMode(false);
    setDraftData(null);
    setDraftPicture(null);
  };

  const enterEditMode = () => {
    setDraftData({ ...profileData });
    setDraftPicture(null);
    setIsEditMode(true);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => n.unread);
    if (unread.length === 0) return;
    
    try {
      // PERSISTENT: Call the new backend endpoint to update lastNotificationCheck
      await markNotificationsAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      showToast("All notifications marked as read", "success");
    } catch (err) {
      // Fallback: Clear locally for UX
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
      showToast("Notifications cleared locally", "info");
    }
  };
  const handleSaveProfile = async () => {
    if (draftData) {
      try {
        const payload = {
          name: draftData.name,
          email: draftData.email,
          department: draftData.department,
          joiningDate: draftData.joiningDate,
          cnic: draftData.cnic,
          phone: draftData.contact,
          profilePicture: draftPicture !== null ? draftPicture : profileData.profilePicture,
        };
        // If password was changed (it's not the placeholder)
        if (draftData.password && draftData.password !== "********") {
          payload.password = draftData.password;
        }

        const updated = await updateMe(payload);
        // Refresh local user context if needed, but for now we update local state
        setProfileData({
          ...draftData,
          profilePicture: updated.user?.profilePicture || updated.user?.avatarUrl || profileData.profilePicture,
        });
        showToast("Profile updated successfully", "success");
      } catch (err) {
        showToast(err.message || "Failed to update profile", "error");
      }
    }
    setDraftData(null);
    setDraftPicture(null);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setDraftData(null);
    setDraftPicture(null);
    setIsEditMode(false);
  };

  const handleLogout = () => {
    clearAuthSession();
    showToast("Logged out successfully", "success");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    showToast(isDarkMode ? "Light mode activated" : "Dark mode activated", "info");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#1A1953] shadow-2xl z-30">
        <SidebarContent userRole={userRole} />
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-[#1A1953] shadow-2xl">
            <SidebarContent userRole={userRole} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 bg-background">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 lg:px-6 shadow-sm flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Attendance Status */}
            {(attendance.isCheckedIn || attendance.checkOutTime) && (
              <div className={`hidden md:flex items-center rounded-xl border overflow-hidden text-xs ${
                attendance.isOnBreak
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : attendance.isCheckedIn
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
                <div className="flex flex-col items-center px-3 py-1.5 border-r border-current/20">
                  <span className="text-[9px] uppercase tracking-widest opacity-60 leading-none mb-0.5">Check-in</span>
                  <span className="font-semibold leading-none">{attendance.checkInTime ?? "—"}</span>
                </div>
                <div className="flex flex-col items-center px-3 py-1.5 border-r border-current/20">
                  <span className="text-[9px] uppercase tracking-widest opacity-60 leading-none mb-0.5">Break</span>
                  <span className="font-mono font-semibold leading-none">
                    {formatBreakTime(attendance.totalBreakSeconds + (attendance.isOnBreak ? attendance.currentBreakSeconds : 0))}
                  </span>
                </div>
                <div className="flex flex-col items-center px-3 py-1.5">
                  <span className="text-[9px] uppercase tracking-widest opacity-60 leading-none mb-0.5">Check-out</span>
                  <span className="font-semibold leading-none">{attendance.checkOutTime ?? "—"}</span>
                </div>
              </div>
            )}

            {/* Dark Mode Toggle - Available for All Roles */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#D6090D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <span onClick={handleMarkAllRead} className="text-xs text-[#088395] cursor-pointer font-medium hover:underline">Mark all read</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${n.unread ? "bg-[#162E93]/5" : ""}`}
                          >
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${n.unread ? "text-gray-900" : "text-gray-600"}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                            </div>
                            {n.unread && <div className="w-2 h-2 rounded-full bg-[#162E93] flex-shrink-0 mt-2" />}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 text-center">
                      <span 
                        onClick={() => { setViewAllModalOpen(true); setNotificationsOpen(false); }} 
                        className="text-xs text-[#088395] cursor-pointer font-medium hover:underline"
                      >
                        View all notifications
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                  {profileData.profilePicture ? (
                    <img
                      src={profileData.profilePicture}
                      alt="Profile"
                      className="w-8 h-8 rounded-xl object-cover"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-xl ${config.color} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{profileData.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{config.label}</p>
                  </div>
                  <ChevronDown className="hidden md:block h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100">
                <DropdownMenuLabel className="pb-2">
                  <p className="font-semibold text-gray-900">{profileData.name}</p>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">{config.label} Account</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick} className="gap-2 rounded-lg group">
                  <User className="h-4 w-4 text-gray-500 group-focus:text-white" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 rounded-lg text-[#D6090D] focus:text-[#D6090D] focus:bg-red-50 dark:focus:bg-red-900/20 group">
                  <LogOut className="h-4 w-4 text-[#D6090D] group-focus:text-[#D6090D]" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Hidden file input for profile picture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />

      {/* Announcement Detail Modal */}
      <Dialog open={announcementModalOpen} onOpenChange={setAnnouncementModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">{selectedAnnouncement?.title}</DialogTitle>
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">Organization Update · {selectedAnnouncement?.time}</p>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedAnnouncement?.message}</p>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setAnnouncementModalOpen(false)} className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8]">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">My Profile</DialogTitle>
          </DialogHeader>

          <Tabs value={isEditMode ? "edit" : "view"} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view" onClick={() => setIsEditMode(false)}>View Profile</TabsTrigger>
              <TabsTrigger value="edit" onClick={enterEditMode}>Edit Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-5 mt-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {profileData.profilePicture ? (
                    <img
                      src={profileData.profilePicture}
                      alt="Profile"
                      className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#162E93]/20"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-2xl ${config.color} flex items-center justify-center text-white text-2xl font-bold`}>
                      {initials}
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900">{profileData.name}</p>
                <p className="text-xs text-gray-500">{profileData.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{profileData.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="h-4 w-4" /> Full Name
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{profileData.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Role Assigned
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{profileData.role}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Department
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{typeof profileData.department === "object" ? (profileData.department.name ?? "Engineering") : (profileData.department || "Engineering")}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Joining Date
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{profileData.joiningDate}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <IdCard className="h-4 w-4" /> Employee ID
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{profileData.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <IdCard className="h-4 w-4" /> CNIC
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{profileData.cnic}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Contact Number
                  </Label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-xl">{profileData.contact}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4 mt-4">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative group cursor-pointer"
                  onClick={handlePickImage}
                  title="Click to change profile picture"
                >
                  {displayedPicture ? (
                    <img
                      src={displayedPicture}
                      alt="Profile"
                      className="w-24 h-24 rounded-2xl object-cover ring-2 ring-[#162E93]/20"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-2xl ${config.color} flex items-center justify-center text-white text-2xl font-bold`}>
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#162E93] rounded-lg flex items-center justify-center shadow-lg hover:bg-[#1a36a8] transition-colors">
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  {draftPicture ? "📸 New photo selected — click Save to apply" : "Click photo to change"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Email</Label>
                  <Input
                    type="email"
                    value={draftData?.email ?? profileData.email}
                    onChange={(e) => setDraftData(prev => ({ ...prev, email: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Full Name</Label>
                  <Input
                    value={draftData?.name ?? profileData.name}
                    onChange={(e) => setDraftData(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Role Assigned</Label>
                  <Input
                    value={profileData.role}
                    disabled
                    className="rounded-xl border-gray-200 bg-gray-100 text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Department</Label>
                  <Input
                    value={draftData?.department ?? profileData.department}
                    onChange={(e) => setDraftData(prev => ({ ...prev, department: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">CNIC</Label>
                  <Input
                    value={draftData?.cnic ?? profileData.cnic}
                    onChange={(e) => setDraftData(prev => ({ ...prev, cnic: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-gray-200"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8]"
                  onClick={handleSaveProfile}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Announcement Details Modal */}
      <Dialog open={announcementModalOpen} onOpenChange={setAnnouncementModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className={`h-2 w-full ${selectedAnnouncement?.color || "bg-[#162E93]"}`} />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl ${selectedAnnouncement?.color || "bg-[#162E93]"}/10 flex items-center justify-center`}>
                  <Bell className={`h-5 w-5 ${selectedAnnouncement?.color?.replace('bg-', 'text-') || "text-[#162E93]"}`} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">{selectedAnnouncement?.title}</DialogTitle>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedAnnouncement?.time}</p>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedAnnouncement?.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setAnnouncementModalOpen(false)}
                className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] px-8"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* All Notifications Modal */}
      <Dialog open={viewAllModalOpen} onOpenChange={setViewAllModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
          <div className="h-2 w-full bg-[#162E93]" />
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#162E93]/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-[#162E93]" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">All Notifications</DialogTitle>
                    <DialogDescription>A complete history of your updates and broadcasts.</DialogDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMarkAllRead}
                  className="rounded-xl border-gray-200 text-xs h-8"
                >
                  Mark all as read
                </Button>
              </div>
            </DialogHeader>
            
            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleNotificationClick(n);
                        if (!n.isAnnouncement) setViewAllModalOpen(false);
                      }}
                      className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                        n.unread 
                          ? "bg-[#162E93]/5 border-[#162E93]/10 hover:border-[#162E93]/30" 
                          : "bg-white border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-1.5 h-auto rounded-full flex-shrink-0 ${n.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-bold truncate ${n.unread ? "text-gray-900" : "text-gray-700"}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full">
                            {n.time}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${n.unread ? "text-gray-600" : "text-gray-500"}`}>
                          {n.message}
                        </p>
                      </div>
                      {n.unread && <div className="w-2.5 h-2.5 rounded-full bg-[#162E93] self-center flex-shrink-0 shadow-sm" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400">No notifications found.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
              <Button 
                onClick={() => setViewAllModalOpen(false)}
                className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] px-10"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
