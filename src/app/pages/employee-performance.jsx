import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Trophy, Target, Clock, TrendingUp } from "lucide-react";
import { fetchProjects, fetchTasks } from "../utils/api";
const PF_LABEL = { day: "Per Day", week: "Weekly", month: "Monthly" };
const HOURS_TILE = {
  day: { value: "7.5h", desc: "Hours logged today", subtext: "Required: 8h/day" },
  week: { value: "38.5h", desc: "Total hours this week", subtext: "Required: 40h/week" },
  month: { value: "153.5h", desc: "Total hours this month", subtext: "Required: 160h/month" }
};
const HOURS_CHART = {
  day: [
    { name: "9 AM", hours: 1 },
    { name: "10 AM", hours: 1 },
    { name: "11 AM", hours: 0.5 },
    { name: "12 PM", hours: 0 },
    { name: "1 PM", hours: 1 },
    { name: "2 PM", hours: 1 },
    { name: "3 PM", hours: 1 },
    { name: "4 PM", hours: 1 },
    { name: "5 PM", hours: 1 }
  ],
  week: [
    { name: "Mon", hours: 8 },
    { name: "Tue", hours: 7.5 },
    { name: "Wed", hours: 9 },
    { name: "Thu", hours: 8 },
    { name: "Fri", hours: 6 },
    { name: "Sat", hours: 0 },
    { name: "Sun", hours: 0 }
  ],
  month: [
    { name: "Week 1", hours: 38.5 },
    { name: "Week 2", hours: 40 },
    { name: "Week 3", hours: 36 },
    { name: "Week 4", hours: 39 }
  ]
};
const TASKS_CHART = {
  day: [
    { name: "9 AM", tasksCompleted: 1 },
    { name: "10 AM", tasksCompleted: 3 },
    { name: "11 AM", tasksCompleted: 2 },
    { name: "12 PM", tasksCompleted: 0 },
    { name: "1 PM", tasksCompleted: 2 },
    { name: "2 PM", tasksCompleted: 4 },
    { name: "3 PM", tasksCompleted: 3 },
    { name: "4 PM", tasksCompleted: 2 },
    { name: "5 PM", tasksCompleted: 1 }
  ],
  week: [
    { name: "Mon", tasksCompleted: 12 },
    { name: "Tue", tasksCompleted: 10 },
    { name: "Wed", tasksCompleted: 15 },
    { name: "Thu", tasksCompleted: 11 },
    { name: "Fri", tasksCompleted: 8 },
    { name: "Sat", tasksCompleted: 0 },
    { name: "Sun", tasksCompleted: 0 }
  ],
  month: [
    { name: "Jan", tasksCompleted: 12 },
    { name: "Feb", tasksCompleted: 15 },
    { name: "Mar", tasksCompleted: 18 },
    { name: "Apr", tasksCompleted: 14 }
  ]
};
function FilterPills({ active, onChange }) {
  return <div className="flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg border border-gray-200">
      {["day", "week", "month"].map((f) => <button
    key={f}
    onClick={() => onChange(f)}
    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap ${active === f ? "bg-[#162E93] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white"}`}
  >
          {PF_LABEL[f]}
        </button>)}
    </div>;
}
const TT = {
  contentStyle: { borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.10)", fontSize: 12 }
};
const skillsData = [
  { skill: "React Development", proficiency: 85 },
  { skill: "UI/UX Design", proficiency: 75 },
  { skill: "Project Management", proficiency: 70 },
  { skill: "Communication", proficiency: 90 }
];
function EmployeePerformance() {
  const [perfFilter, setPerfFilter] = useState("month");
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    Promise.all([fetchTasks(), fetchProjects()])
      .then(([tasksData, projectData]) => {
        setTasks(tasksData);
        setProjects(projectData);
      })
      .catch(() => {});
  }, []);
  const hoursTile = HOURS_TILE[perfFilter];
  const hoursChart = HOURS_CHART[perfFilter];
  const tasksChart = TASKS_CHART[perfFilter];
  const stats = useMemo(() => {
    const completed = tasks.filter((task) => String(task.status ?? "").toLowerCase() === "completed").length;
    const total = tasks.length;
    const avgRating = total ? (3 + (completed / total) * 2).toFixed(1) : "0.0";
    return {
      totalTasksCompleted: completed || 59,
      averageRating: Number(avgRating) || 4.2,
      projectsCompleted: projects.length || 3,
    };
  }, [projects.length, tasks]);
  return <AppLayout userRole="employee">
      <div className="space-y-6">
        <div>
          <h1>My Performance</h1>
          <p className="text-muted-foreground">Track your performance metrics and achievements</p>
        </div>

        {
    /* ── Stat tiles ──────────────────────────────────────────────── */
  }
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-success">{stats.totalTasksCompleted}</span>
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">This year</p>
            </CardContent>
          </Card>

          {
    /* Working Hours tile — with Per Day / Weekly / Monthly filter */
  }
          <Card className="md:col-span-1">
            <CardHeader className="pb-1">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm leading-snug">Working Hours</CardTitle>
                <FilterPills active={perfFilter} onChange={setPerfFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{hoursTile.value}</span>
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{hoursTile.desc}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{hoursTile.subtext}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-secondary">{stats.averageRating}/5</span>
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Performance score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Projects Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.projectsCompleted}</span>
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">This year</p>
            </CardContent>
          </Card>
        </div>

        {
    /* ── Charts ──────────────────────────────────────────────────── */
  }
        <div className="grid gap-6 md:grid-cols-2">

          {
    /* Task Completion — same filter drives the chart */
  }
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <CardTitle>Task Completion</CardTitle>
                <FilterPills active={perfFilter} onChange={setPerfFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tasksChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...TT} formatter={(v) => [`${v} tasks`, "Completed"]} />
                  <Bar dataKey="tasksCompleted" fill="#162E93" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {
    /* Working Hours Trend — same filter */
  }
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <CardTitle>Working Hours Trend</CardTitle>
                <FilterPills active={perfFilter} onChange={setPerfFilter} />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={hoursChart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="perfHoursGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#088395" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#088395" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip {...TT} formatter={(v) => [`${v}h`, "Hours"]} />
                  <Area
    type="monotone"
    dataKey="hours"
    stroke="#088395"
    strokeWidth={2.5}
    fill="url(#perfHoursGrad)"
    dot={{ r: 3, fill: "#088395", strokeWidth: 0 }}
    activeDot={{ r: 5 }}
  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {
    /* ── Skills Assessment ───────────────────────────────────────── */
  }
        <Card>
          <CardHeader>
            <CardTitle>Skills Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {skillsData.map((skill, index) => <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-sm text-muted-foreground">{skill.proficiency}%</span>
                  </div>
                  <Progress value={skill.proficiency} className="h-2" />
                </div>)}
            </div>
          </CardContent>
        </Card>

        {
    /* ── Recent Achievements ────────────────────────────────────── */
  }
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Top Performer of the Month</h4>
                  <p className="text-sm text-muted-foreground">Completed 18 tasks in March 2026</p>
                  <Badge className="bg-success text-white mt-2">March 2026</Badge>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Project Milestone</h4>
                  <p className="text-sm text-muted-foreground">Successfully completed API Development project</p>
                  <Badge className="bg-primary text-white mt-2">March 2026</Badge>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Consistent Performer</h4>
                  <p className="text-sm text-muted-foreground">Maintained 95% attendance rate</p>
                  <Badge className="bg-secondary text-white mt-2">Q1 2026</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>;
}
export {
  EmployeePerformance as default
};
