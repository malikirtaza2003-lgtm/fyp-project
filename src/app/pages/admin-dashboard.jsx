import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  Users, UserCheck, Briefcase, CheckSquare, Clock, AlertTriangle, FolderKanban,
  TrendingUp, Plus, Trash2, Calendar, ArrowUpRight, ArrowRight, MoreHorizontal,
  Bell, Zap, Shield,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { fetchLeaves, fetchProjects, fetchTasks, fetchUsers, createAnnouncement, fetchAnnouncements } from "../utils/api";
import { getCurrentUser } from "../utils/auth";
import { showToast } from "../utils/toast";

function getProductivityData(tasks) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  return last7Days.map(date => {
    const dayName = days[date.getDay()];
    const dateStr = date.toISOString().split("T")[0];
    const dayTasks = tasks.filter(t => (t.updatedAt || t.createdAt || "").startsWith(dateStr));
    return {
      name: dayName,
      tasks: dayTasks.length,
      hours: dayTasks.reduce((acc, t) => acc + (parseFloat(t.workingHours) || 0), 0) || (dayTasks.length * 0.8)
    };
  });
}

function getPerformanceData(tasks) {
  const now = new Date();
  const weeks = ["Week 4", "Week 3", "Week 2", "Week 1"]; // Reversed for chart order
  
  return weeks.map((w, i) => {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - (i * 7));
    const weekStart = new Date(weekAgo);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekTasks = tasks.filter(t => {
      const date = new Date(t.createdAt || t.updatedAt || now);
      return date >= weekStart && date <= weekAgo;
    });

    const completed = weekTasks.filter(t => normalizeStatus(t.status) === "completed").length;
    const pending = weekTasks.filter(t => normalizeStatus(t.status) === "pending" || normalizeStatus(t.status) === "active").length;
    const overdue = weekTasks.filter(t => {
      if (normalizeStatus(t.status) === "completed") return false;
      const deadline = new Date(t.deadline || t.dueDate || "2099-01-01");
      return deadline < now && deadline >= weekStart;
    }).length;

    return { name: w, completed, pending, overdue };
  }).reverse();
}

function getRecentActivities(tasks, leaves, users) {
  const activities = [];
  
  tasks.slice(0, 5).forEach(t => {
    const assigneeObj = t.assignedTo || t.assignee;
    const assigneeName = typeof assigneeObj === "object" ? (assigneeObj.name ?? "Someone") : (assigneeObj || "Someone");
    
    activities.push({
      id: `task-${t._id || t.id}`,
      user: assigneeName,
      action: normalizeStatus(t.status) === "completed" ? "completed task" : "is working on",
      task: t.title,
      time: "Recent",
      avatar: initialsFromName(assigneeName),
      color: "bg-[#162E93]"
    });
  });

  leaves.slice(0, 3).forEach(l => {
    const empName = typeof l.employee === "object" ? (l.employee.name ?? "Someone") : (l.employee || "Someone");
    activities.push({
      id: `leave-${l._id || l.id}`,
      user: empName,
      action: "submitted leave request",
      task: "",
      time: "Recent",
      avatar: initialsFromName(empName),
      color: "bg-[#088395]"
    });
  });

  return activities.slice(0, 5);
}

function normalizeStatus(status) {
  return String(status ?? "").toLowerCase();
}

function formatLeaveDates(leave) {
  const start = leave.startDate ?? leave.date ?? "";
  const end = leave.endDate && leave.endDate !== start ? ` – ${leave.endDate}` : "";
  return `${start}${end}`.trim();
}

function initialsFromName(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

function StatCard({ title, value, subtitle, icon: Icon, color, gradient, trend }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
              trend.positive ? "bg-[#01B01B]/10 text-[#01B01B]" : "bg-[#D6090D]/10 text-[#D6090D]"
            }`}>
              <ArrowUpRight className={`h-3 w-3 ${!trend.positive ? "rotate-180" : ""}`} />
              {trend.value}
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [priority, setPriority] = useState("Medium");

  useEffect(() => {
    let mounted = true;

    async function loadDashboardData() {
      try {
        const [usersData, tasksData, projectsData, leavesData, announcementsData] = await Promise.all([
          fetchUsers(),
          fetchTasks(),
          fetchProjects(),
          fetchLeaves(),
          fetchAnnouncements(),
        ]);

        if (mounted) {
          setUsers(usersData);
          setTasks(tasksData);
          setProjects(projectsData);
          setLeaves(leavesData);
          setAnnouncements(Array.isArray(announcementsData) ? announcementsData : (announcementsData?.announcements || []));
        }
      } catch {
        // Keep the existing demo values if the backend is not reachable.
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const totalEmployees = users.filter((user) => user.role === "employee").length;
  const activeUsers = users.filter((user) => normalizeStatus(user.status) !== "inactive").length;
  const totalClients = new Set(projects.map((project) => project.client).filter(Boolean)).size;
  const activeProjects = projects.length;
  const tasksAssigned = tasks.length;
  const completedTasks = tasks.filter((task) => normalizeStatus(task.status) === "completed").length;
  const pendingReviews = tasks.filter((task) => normalizeStatus(task.status) === "pending").length;
  const overdueTasks = tasks.filter((task) => {
    const deadline = task.deadline ? new Date(`${task.deadline}T00:00:00`) : null;
    return deadline && normalizeStatus(task.status) !== "completed" && deadline < new Date();
  }).length;

  const liveTopEmployees = useMemo(() => {
    const taskStats = tasks.reduce((acc, task) => {
      const key = task.assignedToId ?? task.assignedTo ?? task.assignedById ?? task.assignedBy ?? "";
      if (!key) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = { total: 0, completed: 0 };
      }

      acc[key].total += 1;
      if (normalizeStatus(task.status) === "completed") {
        acc[key].completed += 1;
      }
      return acc;
    }, {});

    const performers = users
      .filter((user) => user.role === "employee")
      .map((user) => {
        const stats = taskStats[user.id] ?? { total: 0, completed: 0 };
        const score = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
        return {
          id: user.id,
          name: user.name,
          role: user.jobTitle || user.role,
          tasks: stats.total,
          score,
          avatar: initialsFromName(user.name),
        };
      })
      .sort((left, right) => right.score - left.score || right.tasks - left.tasks)
      .slice(0, 3);

    return performers;
  }, [tasks, users]);

  const livePendingLeaves = useMemo(() => {
    const pending = leaves
      .filter((leave) => normalizeStatus(leave.status) === "pending")
      .map((leave) => {
        const empObj = leave.employee || leave.user;
        const empName = typeof empObj === "object" ? (empObj.name ?? "Employee") : (empObj || "Employee");
        
        return {
          id: leave.id,
          name: empName,
          type: leave.leaveType || leave.type || "Leave",
          dates: formatLeaveDates(leave),
          days: leave.days ?? 1,
        };
      })
      .slice(0, 3);

    return pending;
  }, [leaves]);

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      showToast("Please enter both title and message", "error");
      return;
    }
    setIsAnnouncing(true);
    try {
      await createAnnouncement({ title, message, priority });
      setOpen(false);
      setTitle("");
      setMessage("");
      setPriority("Medium");
      showToast("Announcement broadcasted successfully", "success");
      const updated = await fetchAnnouncements();
      setAnnouncements(Array.isArray(updated) ? updated : (updated?.announcements || []));
    } catch (err) {
      showToast(err.message || "Failed to broadcast", "error");
    } finally {
      setIsAnnouncing(false);
    }
  };

  const productivityData = useMemo(() => getProductivityData(tasks), [tasks]);
  const performanceData = useMemo(() => getPerformanceData(tasks), [tasks]);
  const recentActivities = useMemo(() => getRecentActivities(tasks, leaves, users), [tasks, leaves, users]);

  const priorityColors = {
    High: "bg-[#D6090D]/10 text-[#D6090D]",
    Medium: "bg-[#088395]/10 text-[#088395]",
    Low: "bg-[#01B01B]/10 text-[#01B01B]",
  };

  return (
    <AppLayout userRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 mt-0.5">Welcome back, {(typeof getCurrentUser()?.name === "object" ? (getCurrentUser().name.name ?? "James") : (getCurrentUser()?.name ?? "James")).split(" ")[0]}! Here's what's happening today.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl border-gray-200 gap-1.5 h-9">
              <Calendar className="h-4 w-4 text-gray-500" />
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Button>
            <Button size="sm" className="rounded-xl bg-[#088395] hover:bg-[#0a6b7a] gap-1.5 h-9" onClick={() => navigate("/admin/tasks")}>
              <CheckSquare className="h-4 w-4" />
              Assign Task
            </Button>
            <Button size="sm" className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-1.5 h-9" onClick={() => setOpen(true)}>
              <Bell className="h-4 w-4" />
              Broadcast
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Employees" value={totalEmployees} subtitle="Live from users" icon={Users} color="text-[#162E93]" gradient="bg-gradient-to-br from-[#162E93] to-[#1a36a8]" trend={{ value: "+5%", positive: true }} />
          <StatCard title="Active Users" value={activeUsers} subtitle="Active account status" icon={UserCheck} color="text-[#088395]" gradient="bg-gradient-to-br from-[#088395] to-[#0a6b7a]" trend={{ value: "+3%", positive: true }} />
          <StatCard title="Total Clients" value={totalClients} subtitle="Unique project clients" icon={Briefcase} color="text-purple-600" gradient="bg-gradient-to-br from-purple-500 to-purple-700" trend={{ value: "+2", positive: true }} />
          <StatCard title="Active Projects" value={activeProjects} subtitle="Persisted projects" icon={FolderKanban} color="text-[#01B01B]" gradient="bg-gradient-to-br from-[#01B01B] to-[#018015]" />
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard title="Tasks Assigned" value={tasksAssigned} subtitle="Across all projects" icon={CheckSquare} color="text-[#162E93]" gradient="bg-gradient-to-br from-[#162E93]/80 to-[#088395]" />
          <StatCard title="Completed Tasks" value={completedTasks} subtitle="Backend task status" icon={TrendingUp} color="text-[#01B01B]" gradient="bg-gradient-to-br from-[#01B01B] to-green-600" trend={{ value: "+7%", positive: true }} />
          <StatCard title="Pending Reviews" value={pendingReviews} subtitle="Needs attention" icon={Clock} color="text-yellow-600" gradient="bg-gradient-to-br from-yellow-500 to-orange-500" trend={{ value: "5 new", positive: false }} />
          <StatCard title="Overdue Tasks" value={overdueTasks} subtitle="Immediate action" icon={AlertTriangle} color="text-[#D6090D]" gradient="bg-gradient-to-br from-[#D6090D] to-red-700" trend={{ value: "+2", positive: false }} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-gray-800">Productivity Overview</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Tasks completed this week</p>
                </div>
                <Badge className="bg-[#162E93]/10 text-[#162E93] border-0">This Week</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#162E93" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#162E93" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                  <Area type="monotone" dataKey="tasks" stroke="#162E93" fill="url(#tasksGrad)" strokeWidth={2.5} name="Tasks" dot={{ fill: "#162E93", r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-gray-800">Task Completion Trends</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Weekly breakdown by status</p>
                </div>
                <Badge className="bg-[#01B01B]/10 text-[#01B01B] border-0">4 Weeks</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={performanceData} barGap={3}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="completed" fill="#01B01B" radius={[6, 6, 0, 0]} name="Completed" />
                  <Bar dataKey="pending" fill="#088395" radius={[6, 6, 0, 0]} name="Pending" />
                  <Bar dataKey="overdue" fill="#D6090D" radius={[6, 6, 0, 0]} name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {[
                  { color: "bg-[#01B01B]", label: "Completed" },
                  { color: "bg-[#088395]", label: "Pending" },
                  { color: "bg-[#D6090D]", label: "Overdue" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-1.5 rounded-full ${l.color}`} />
                    <span className="text-xs text-gray-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-gray-800">Announcements</CardTitle>
                <Button size="sm" variant="ghost" className="gap-1 text-[#088395] hover:text-[#162E93] h-8 text-xs" onClick={() => setOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {announcements.slice(0, 3).map((announcement) => (
                  <div key={announcement.id} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#162E93]/10 flex items-center justify-center">
                          <Bell className="h-3.5 w-3.5 text-[#162E93]" />
                        </div>
                        <p className="text-sm font-medium text-gray-800">{announcement.title}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${priorityColors[announcement.priority]}`}>
                          {announcement.priority}
                        </span>
                        <button onClick={() => setAnnouncements(prev => prev.filter(a => a.id !== announcement.id))} className="text-gray-300 hover:text-[#D6090D] transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 ml-8 leading-relaxed">{announcement.message}</p>
                    <p className="text-[10px] text-gray-400 ml-8 mt-1">{announcement.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl ${activity.color} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-[10px] font-bold">{activity.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <span className="font-semibold">{typeof activity.user === "object" ? (activity.user.name ?? "—") : (activity.user || "—")}</span>{" "}
                        {activity.action}{" "}
                        {activity.task && <span className="font-medium text-[#162E93]">"{activity.task}"</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-800">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveTopEmployees.map((emp, i) => (
                    <div key={emp.id} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#162E93] to-[#088395] flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold">{emp.avatar}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.tasks} tasks</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#01B01B]">{emp.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-gray-800">Pending Leaves</CardTitle>
                  <Badge className="bg-[#D6090D]/10 text-[#D6090D] border-0 text-xs">{livePendingLeaves.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {livePendingLeaves.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{leave.name}</p>
                        <p className="text-[10px] text-gray-500">{leave.type} • {leave.dates}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button className="px-2 py-1 rounded-lg bg-[#01B01B]/10 text-[#01B01B] text-[10px] font-medium hover:bg-[#01B01B]/20 transition-colors">
                          Approve
                        </button>
                        <button className="px-2 py-1 rounded-lg bg-[#D6090D]/10 text-[#D6090D] text-[10px] font-medium hover:bg-[#D6090D]/20 transition-colors">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Add Employee", icon: Users, path: "/admin/employees", color: "bg-[#162E93]/10 text-[#162E93] hover:bg-[#162E93]/15" },
                    { label: "New Project", icon: FolderKanban, path: "/admin/projects", color: "bg-[#088395]/10 text-[#088395] hover:bg-[#088395]/15" },
                    { label: "Meetings", icon: Calendar, path: "/admin/meetings", color: "bg-[#01B01B]/10 text-[#01B01B] hover:bg-[#01B01B]/15" },
                    { label: "Analytics", icon: TrendingUp, path: "/admin/analytics", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => navigate(action.path)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${action.color}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Broadcast Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Announcement Title</Label>
              <Input
                id="ann-title"
                placeholder="e.g., Office Holiday Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-msg">Message</Label>
              <Textarea
                id="ann-msg"
                placeholder="Type your message here..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl border-gray-200 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority Level</Label>
              <div className="flex gap-2">
                {["High", "Medium", "Low"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      priority === p 
                        ? p === "High" ? "bg-red-100 border-red-400 text-red-700" : p === "Medium" ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-green-100 border-green-400 text-green-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-gray-200">
              Cancel
            </Button>
            <Button
              onClick={handleAddAnnouncement}
              disabled={isAnnouncing}
              className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8]"
            >
              {isAnnouncing ? "Broadcasting..." : "Broadcast Announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
