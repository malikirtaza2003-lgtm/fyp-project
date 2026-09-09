import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { CheckSquare, Clock, AlertTriangle, Play, Pause, RotateCcw, Square, Timer, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { Progress } from "../components/ui/progress";
import { showToast } from "../utils/toast";
import { StatCard } from "../components/stat-card";
import { fetchAttendance, fetchTasks, updateTask } from "../utils/api";
import { getCurrentUser } from "../utils/auth";
const TF_LABEL = { day: "Per Day", week: "Weekly", month: "Monthly" };
function getHoursTile(attendance, filter, user) {
  const userRecords = attendance.filter(r => (r.user === user?.id || r.user === user?._id || r.employee === user?.name));
  
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecord = userRecords.find(r => r.date === todayStr);
  const totalHours = userRecords.reduce((acc, r) => acc + (parseFloat(r.workingHours) || 0), 0);
  
  const todayHrs = parseFloat(todayRecord?.workingHours) || 0;
  
  const stats = {
    day: { 
      value: `${todayHrs.toFixed(1)}h`, 
      desc: "Hours logged today", 
      trend: todayHrs >= 8 ? "Goal met" : "Below goal", 
      positive: todayHrs >= 8, 
      required: "8.0h", 
      completed: `${todayHrs.toFixed(1)}h`, 
      pct: Math.min(100, Math.round(todayHrs / 8 * 100)) 
    },
    week: { 
      value: `${totalHours.toFixed(1)}h`, 
      desc: "Total hours this week", 
      trend: totalHours >= 40 ? "Great progress" : "Keep going", 
      positive: true, 
      required: "40.0h", 
      completed: `${totalHours.toFixed(1)}h`, 
      pct: Math.min(100, Math.round(totalHours / 40 * 100)) 
    },
    month: { 
      value: `${totalHours.toFixed(1)}h`, 
      desc: "Total hours recorded", 
      trend: "Based on records", 
      positive: true, 
      required: "160.0h", 
      completed: `${totalHours.toFixed(1)}h`, 
      pct: Math.min(100, Math.round(totalHours / 160 * 100)) 
    }
  };
  
  return stats[filter] || stats.week;
}

function getHoursChart(attendance, filter, user) {
  const userRecords = attendance.filter(r => (r.user === user?.id || r.user === user?._id || r.employee === user?.name));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  
  // Map records to days of week for the current week
  return days.map(day => {
    // This is a simplified mapping for the UI
    const dayRecords = userRecords.filter(r => {
      const d = new Date(r.date);
      const dName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      return dName === day;
    });
    const hrs = dayRecords.reduce((acc, r) => acc + (parseFloat(r.workingHours) || 0), 0);
    return { name: day, hours: hrs || 0 };
  });
}

function getPerfChart(tasks, filter) {
  const completed = tasks.filter(t => t.status === "completed").length;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return days.map((day, i) => ({
    name: day,
    completed: i < 3 ? Math.floor(completed / 3) : 0, // mock distribution of real total
    score: tasks.length > 0 ? (completed / tasks.length * 100) : 0
  }));
}

function mapTask(task) {
  const normalizedStatus = String(task.status ?? "pending").toLowerCase();
  const mappedStatus = normalizedStatus === "in-progress" || normalizedStatus === "in progress" || normalizedStatus === "active"
    ? "active"
    : normalizedStatus === "paused"
      ? "paused"
      : normalizedStatus === "completed" || normalizedStatus === "done"
        ? "completed"
        : "pending";
  const deadline = String(task.deadline ?? "").trim();
  return {
    id: task.id ?? task._id ?? Date.now(),
    title: task.title ?? "Untitled task",
    project: task.project ?? "Personal",
    priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Low",
    deadline: deadline ? deadline.slice(0, 10) : task.dueDate ?? new Date().toISOString().split("T")[0],
    assignedBy: typeof task.assignedBy === "string" ? task.assignedBy : task.assignedBy?.name ?? "Manager",
    progress: Number.isFinite(Number(task.progress)) ? Number(task.progress) : mappedStatus === "completed" ? 100 : mappedStatus === "active" ? 50 : 0,
    status: mappedStatus,
  };
}
function FilterPills({ active, onChange }) {
  return <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg border border-gray-200">
      {["day", "week", "month"].map((f) => <button
    key={f}
    onClick={() => onChange(f)}
    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap ${active === f ? "bg-[#162E93] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white"}`}
  >
          {TF_LABEL[f]}
        </button>)}
    </div>;
}
const TT = {
  contentStyle: {
    borderRadius: 12,
    border: "none",
    boxShadow: "0 4px 24px rgba(0,0,0,.10)",
    fontSize: 12
  }
};
function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [hoursFilter, setHoursFilter] = useState("week");
  const [perfFilter, setPerfFilter] = useState("week");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [taskData, attendanceData] = await Promise.all([
          fetchTasks(),
          fetchAttendance()
        ]);
        if (mounted) {
          setTasks(taskData.map(mapTask));
          setAttendance(attendanceData);
        }
      } catch {
        // Keep the fallback tasks if the backend is unavailable.
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleStatusUpdate = (taskId, nextStatus) => {
    let backendStatus = nextStatus;
    if (nextStatus === "active") backendStatus = "in-progress";

    updateTask(taskId, { status: backendStatus })
      .then((updatedTask) => {
        setTasks((prev) => prev.map((entry) => (entry.id === taskId ? mapTask(updatedTask) : entry)));
        showToast(`Task marked as ${nextStatus}`, "success");
      })
      .catch((error) => {
        showToast(error.message || "Unable to update task", "error");
      });
  };
  const HOURS_DESC = {
    day: "Hour-by-hour breakdown for today",
    week: "Daily hours logged this week",
    month: "Weekly hour totals this month"
  };
  const PERF_DESC = {
    day: "Task completions and score per hour today",
    week: "Daily task completion trend this week",
    month: "Weekly performance summary this month"
  };

  const assignedCount = tasks.length;
  const activeCount = tasks.filter((task) => task.status === "active").length;
  const pendingCount = tasks.filter((task) => task.status === "pending").length;
  const overdueCount = tasks.filter((task) => task.status !== "completed" && new Date(`${task.deadline}T00:00:00`) < new Date(new Date().toISOString().split("T")[0] + "T00:00:00")).length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const completionProgress = useMemo(() => completionRate, [completionRate]);
  const user = useMemo(() => getCurrentUser(), []);
  const hoursTile = useMemo(() => getHoursTile(attendance, hoursFilter, user), [attendance, hoursFilter, user]);
  const hoursChart = useMemo(() => getHoursChart(attendance, hoursFilter, user), [attendance, hoursFilter, user]);
  const perfChart = useMemo(() => getPerfChart(tasks, perfFilter), [tasks, perfFilter]);
  return <AppLayout userRole="employee">
      <div className="space-y-6">

        {
    /* ── Header ────────────────────────────────────────────────── */
  }
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1>My Dashboard</h1>
            <p className="text-muted-foreground">Track your tasks and productivity.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl border-gray-200 gap-1.5 h-9">
              <Calendar className="h-4 w-4 text-gray-500" />
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Button>
          </div>
        </div>

        {
    /* ── Stat cards row ────────────────────────────────────────── */
  }
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Assigned Tasks" value={assignedCount} icon={CheckSquare} description="Total assigned to you" />
          <StatCard title="Active Tasks" value={activeCount} icon={Play} description="Currently in progress" />
          <StatCard title="Pending Tasks" value={pendingCount} icon={Clock} description="Not started yet" />
          <StatCard
    title="Overdue Tasks"
    value={overdueCount}
    icon={AlertTriangle}
    description="Requires attention"
    trend={{ value: "1 task", positive: false }}
  />
        </div>

        {
    /* ── Working Hours tile + Task Completion Rate ─────────────── */
  }
        <div className="grid gap-4 md:grid-cols-2">

          {
    /* Working Hours tile – with Per Day / Weekly / Monthly filter */
  }
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#162E93]/10 flex items-center justify-center">
                  <Timer className="h-4 w-4 text-[#162E93]" />
                </div>
                <CardTitle className="text-sm font-medium text-gray-700">
                  Total Working Hours
                </CardTitle>
              </div>
              {
    /* ← Time filter pills */
  }
              <FilterPills active={hoursFilter} onChange={setHoursFilter} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 leading-tight">
                {hoursTile.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{hoursTile.desc}</p>
              <p className={`text-xs mt-0.5 font-medium flex items-center gap-1 ${hoursTile.positive ? "text-[#01B01B]" : "text-red-500"}`}>
                {hoursTile.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {hoursTile.trend}
              </p>

              {
    /* Required vs Completed comparison */
  }
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Required</span>
                  <span className="font-bold text-gray-700">{hoursTile.required}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">Completed</span>
                  <span className="font-bold text-[#162E93]">{hoursTile.completed}</span>
                </div>
                {
    /* Progress bar */
  }
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div
    className="h-full rounded-full bg-[#162E93] transition-all duration-500"
    style={{ width: `${hoursTile.pct}%` }}
  />
                </div>
                <p className="text-[10px] text-gray-400 text-right">{hoursTile.pct}% of required hours</p>
              </div>
            </CardContent>
          </Card>

          {
    /* Task Completion Rate — unchanged */
  }
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Updated from your live task list</p>
            </CardContent>
          </Card>
        </div>

        {
    /* ── Charts ───────────────────────────────────────────────── */
  }
        <div className="grid gap-4 md:grid-cols-2">

          {
    /* Working Hours Chart – shares hoursFilter with the tile above */
  }
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Working Hours</CardTitle>
                  <CardDescription className="mt-0.5">{HOURS_DESC[hoursFilter]}</CardDescription>
                </div>
                {
    /* ← Same filter drives both tile value and this chart */
  }
                <FilterPills active={hoursFilter} onChange={setHoursFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={hoursChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#162E93" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#162E93" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...TT} formatter={(v) => [`${v}h`, "Hours"]} />
                  <Area
    type="monotone"
    dataKey="hours"
    stroke="#162E93"
    strokeWidth={2.5}
    fill="url(#hoursGrad)"
    dot={{ r: 3, fill: "#162E93", strokeWidth: 0 }}
    activeDot={{ r: 5 }}
  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {
    /* Performance Overview Chart – its own perfFilter */
  }
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription className="mt-0.5">{PERF_DESC[perfFilter]}</CardDescription>
                </div>
                {
    /* ← Independent filter for performance */
  }
                <FilterPills active={perfFilter} onChange={setPerfFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={perfChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#01B01B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#01B01B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
    {...TT}
    formatter={(v, name) => [
      name === "completed" ? `${v} tasks` : `${v}%`,
      name === "completed" ? "Tasks Completed" : "Score"
    ]}
  />
                  <Area
    type="monotone"
    dataKey="completed"
    stroke="#01B01B"
    strokeWidth={2.5}
    fill="url(#perfGrad)"
    dot={{ r: 3, fill: "#01B01B", strokeWidth: 0 }}
    activeDot={{ r: 5 }}
    name="completed"
  />
                  <Area
    type="monotone"
    dataKey="score"
    stroke="#088395"
    strokeWidth={2}
    fill="none"
    dot={false}
    name="score"
    strokeDasharray="4 3"
  />
                </AreaChart>
              </ResponsiveContainer>

              {
    /* Mini legend */
  }
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-5 h-0.5 rounded bg-[#01B01B] inline-block" />
                  Tasks Completed
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-5 h-px border-t-2 border-dashed border-[#088395] inline-block" />
                  Performance Score
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {
    /* ── My Tasks ──────────────────────────────────────────────── */
  }
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>Your assigned tasks and their progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => <div key={task.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}>
                          {task.priority}
                        </Badge>
                        <Badge variant={task.status === "active" ? "default" : "outline"}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Project: {task.project} • Assigned by: {typeof task.assignedBy === "object" ? (task.assignedBy.name ?? "—") : (task.assignedBy || "—")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Deadline: {task.deadline}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap flex-shrink-0">
                      {task.status === 'pending' && (
                        <Button size="sm" onClick={() => handleStatusUpdate(task.id, 'active')} className="bg-[#162E93] hover:bg-[#1a36a8]">
                          <Play className="h-4 w-4 mr-2" /> Start
                        </Button>
                      )}
                      {task.status === 'active' && (
                        <>
                          <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700" onClick={() => handleStatusUpdate(task.id, 'paused')}>
                            <Pause className="h-4 w-4 mr-2" /> Pause
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(task.id, 'completed')}>
                            <CheckSquare className="h-4 w-4 mr-2" /> Complete
                          </Button>
                        </>
                      )}
                      {task.status === 'paused' && (
                        <>
                          <Button size="sm" onClick={() => handleStatusUpdate(task.id, 'active')} className="bg-[#162E93] hover:bg-[#1a36a8]">
                            <RotateCcw className="h-4 w-4 mr-2" /> Resume
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(task.id, 'completed')}>
                            <CheckSquare className="h-4 w-4 mr-2" /> Complete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} />
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>;
}
export {
  EmployeeDashboard as default
};
