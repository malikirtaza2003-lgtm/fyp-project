import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { fetchTasks, fetchUsers, createTask, fetchProjects } from "../utils/api";
import { showToast } from "../utils/toast";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Plus,
  MoreHorizontal,
  Star
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from "recharts";

export default function TeamLeadDashboard() {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", assignee: "", priority: "Medium", dueDate: "" });
  const [activityView, setActivityView] = useState("week");

  useEffect(() => {
    let mounted = true;
    async function loadDashboard() {
      try {
        const [usersData, tasksData, projectsData] = await Promise.all([
          fetchUsers(), 
          fetchTasks(),
          fetchProjects()
        ]);
        if (mounted) {
          setTeamMembers(Array.isArray(usersData) ? usersData.filter(u => String(u.role).toLowerCase() === 'employee') : []);
          setTasks(Array.isArray(tasksData) ? tasksData : []);
          setProjects(Array.isArray(projectsData) ? projectsData : []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    }
    loadDashboard();
    return () => { mounted = false; };
  }, []);

  const handleAssignTask = async () => {
    if (!newTask.title || !newTask.assignee) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    try {
      await createTask({
        title: newTask.title,
        assignee: newTask.assignee,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        status: "Pending"
      });
      showToast("Task assigned successfully", "success");
      setIsAssignModalOpen(false);
      setNewTask({ title: "", assignee: "", priority: "Medium", dueDate: "" });
      const updatedTasks = await fetchTasks();
      setTasks(updatedTasks);
    } catch (err) {
      showToast(err.message || "Failed to assign task", "error");
    }
  };

  const totalTeamMembers = teamMembers.length;
  const activeTasksCount = tasks.filter(t => ["active", "in-progress", "in progress"].includes(String(t.status || "").toLowerCase())).length;
  const completedTasksCount = tasks.filter(t => ["completed", "done"].includes(String(t.status || "").toLowerCase())).length;
  const efficiency = tasks.length ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const activityData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map(d => ({
      day: d,
      completed: Math.max(0, Math.round(completedTasksCount / 6) + Math.floor(Math.random() * 2)),
      pending: Math.max(0, Math.round(activeTasksCount / 6) + Math.floor(Math.random() * 2))
    }));
  }, [completedTasksCount, activeTasksCount]);

  const activityDataMonth = useMemo(() => {
    return ["W1", "W2", "W3", "W4"].map(w => ({
      day: w,
      completed: Math.max(0, Math.round(completedTasksCount / 4) + Math.floor(Math.random() * 3)),
      pending: Math.max(0, Math.round(activeTasksCount / 4) + Math.floor(Math.random() * 2))
    }));
  }, [completedTasksCount, activeTasksCount]);

  const distributionData = useMemo(() => {
    const total = Math.max(1, tasks.length);
    const inProgress = tasks.filter(t => ["active", "in-progress", "in progress"].includes(String(t.status || "").toLowerCase())).length;
    const completed = tasks.filter(t => ["completed", "done"].includes(String(t.status || "").toLowerCase())).length;
    const pending = tasks.filter(t => String(t.status || "").toLowerCase() === "pending").length;
    const overdue = tasks.filter(t => {
      const s = String(t.status || "").toLowerCase();
      if (["completed", "done"].includes(s)) return false;
      const deadline = t.deadline || t.dueDate || t.due_date;
      return deadline && new Date(deadline) < new Date();
    }).length;

    return [
      { name: "Completed", value: Math.round((completed / total) * 100), color: "#10B981" },
      { name: "In Progress", value: Math.round((inProgress / total) * 100), color: "#162E93" },
      { name: "Pending", value: Math.round((pending / total) * 100), color: "#088395" },
      { name: "Overdue", value: Math.round((overdue / total) * 100), color: "#EF4444" },
    ];
  }, [tasks]);

  const teamPerformanceData = useMemo(() => {
    return teamMembers.slice(0, 5).map(m => {
      const uTasks = tasks.filter(t => t.assignedTo === m.name || t.assignedToId === (m.id || m._id));
      const done = uTasks.filter(t => ["completed", "done"].includes(String(t.status || "").toLowerCase())).length;
      const pct = uTasks.length ? Math.round((done / uTasks.length) * 100) : 0;
      return {
        name: m.name,
        role: m.role || m.jobTitle || "Member",
        tasks: `${done}/${uTasks.length}`,
        perf: `${pct}%`,
        stars: pct > 90 ? 5 : pct > 70 ? 4 : 3,
        initial: (m.name || "??").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
        color: "bg-[#162E93]"
      };
    });
  }, [teamMembers, tasks]);

  const dashboardProjectsData = useMemo(() => {
    return projects.slice(0, 3).map(p => {
      const pTasks = tasks.filter(t => t.project === (p.name || p.title));
      const done = pTasks.filter(t => ["completed", "done"].includes(String(t.status || "").toLowerCase())).length;
      const pct = pTasks.length ? Math.round((done / pTasks.length) * 100) : (p.progress || 0);
      return {
        name: p.name || p.title || "Project",
        due: p.deadline ? `Due ${new Date(p.deadline).toLocaleDateString()}` : "No deadline",
        members: `${(p.members || []).length || 1} Members`,
        priority: p.priority || "Medium",
        tasks: `${done}/${pTasks.length} Done`,
        progress: pct
      };
    });
  }, [projects, tasks]);

  const dashboardTrendData = useMemo(() => {
    return [
      { week: "W1", score: 65 }, { week: "W2", score: 72 }, { week: "W3", score: 78 }, { week: "W4", score: efficiency || 85 },
    ];
  }, [efficiency]);

  const recentActivity = useMemo(() => {
    return tasks.slice(0, 4).map(t => {
      const assigneeName = typeof t.assignedTo === "object" ? t.assignedTo.name : (t.assignedTo || "Unassigned");
      return {
        task: t.title,
        assignee: assigneeName,
        initial: String(assigneeName || "U").split(" ").map(n => n[0]).join("").slice(0, 2),
        priority: t.priority || "Medium",
        status: t.status,
        date: (t.updatedAt || t.createdAt || "").slice(5, 10) || "Today"
      };
    });
  }, [tasks]);

  return (
    <AppLayout userRole="teamlead">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Lead Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your team, track progress, and drive results.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-gray-200 h-10 gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-gray-500" />
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Button>
            <Button onClick={() => setIsAssignModalOpen(true)} className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] h-10 gap-2 text-sm font-medium px-5">
              <Plus className="h-4 w-4" /> Assign Task
            </Button>
          </div>
        </div>

        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader><DialogTitle>Assign New Task</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input placeholder="Enter task name..." value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={newTask.assignee} onValueChange={val => setNewTask({ ...newTask, assignee: val })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {teamMembers.map(m => <SelectItem key={m.id || m._id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={val => setNewTask({ ...newTask, priority: val })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="rounded-xl" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAssignTask} className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8]">Assign Task</Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Team Size", value: totalTeamMembers, sub: "Total", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Tasks", value: activeTasksCount, sub: "Live", icon: Clock, color: "text-[#088395]", bg: "bg-teal-50" },
            { label: "Completed Tasks", value: completedTasksCount, sub: "Done", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Efficiency", value: `${efficiency}%`, sub: "Performance", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} mb-3 inline-flex`}><stat.icon className="h-5 w-5" /></div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{stat.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-800">Team Task Activity</CardTitle>
              <div className="flex bg-gray-50 p-1 rounded-lg">
                <button onClick={() => setActivityView("week")} className={`text-[10px] font-bold px-3 py-1.5 rounded-md ${activityView === "week" ? "bg-white shadow-sm text-gray-800" : "text-gray-400"}`}>Week</button>
                <button onClick={() => setActivityView("month")} className={`text-[10px] font-bold px-3 py-1.5 rounded-md ${activityView === "month" ? "bg-white shadow-sm text-gray-800" : "text-gray-400"}`}>Month</button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityView === "week" ? activityData : activityDataMonth} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="completed" fill="#162E93" radius={[4, 4, 0, 0]} name="Completed" barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader><CardTitle className="text-base font-bold text-gray-800">Task Distribution</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                      {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-gray-800">{tasks.length}</span>
                  <span className="text-[10px] font-medium text-gray-400">Total Tasks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-gray-800">My Team</CardTitle>
              <button onClick={() => navigate("/teamlead/team")} className="text-[11px] font-bold text-gray-400 hover:text-[#162E93]">View All &gt;</button>
            </CardHeader>
            <CardContent className="space-y-5">
              {teamPerformanceData.map((member, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${member.color} flex items-center justify-center text-white font-bold text-sm`}>{member.initial}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{member.name}</h4>
                    <p className="text-[11px] text-gray-400 truncate">{member.role}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 w-32">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold text-gray-800">{member.tasks}</span>
                      <span className="text-[10px] font-bold text-[#162E93]">{member.perf}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#162E93] rounded-full" style={{ width: member.perf }} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold text-gray-800">Active Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {dashboardProjectsData.map((project, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div><h4 className="text-sm font-bold text-gray-800">{project.name}</h4><p className="text-[10px] text-gray-400 mt-0.5">{project.due} • {project.members}</p></div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${project.priority === "High" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>{project.priority}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#162E93] rounded-full" style={{ width: `${project.progress}%` }} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-bold text-gray-800">Recent Task Activity</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-50"><th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task</th><th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignee</th><th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</th><th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentActivity.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4"><span className="text-xs font-bold text-gray-700">{item.task}</span></td>
                        <td className="px-6 py-4 flex items-center gap-2"><div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">{item.initial}</div><span className="text-xs font-medium text-gray-600">{item.assignee}</span></td>
                        <td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.priority === "High" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>{item.priority}</span></td>
                        <td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === "Completed" ? "bg-green-100 text-green-600" : "bg-indigo-50 text-indigo-600"}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base font-bold text-gray-800">Team Performance Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[50, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Line type="monotone" dataKey="score" stroke="#162E93" strokeWidth={3} dot={{ r: 4, fill: '#162E93', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
