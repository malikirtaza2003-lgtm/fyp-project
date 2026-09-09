import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, UserCheck, CheckSquare, Clock, TrendingUp, Award, BarChart2, Zap } from "lucide-react";
import { fetchProjects, fetchTasks, fetchUsers } from "../utils/api";
const C = { blue: "#162E93", navy: "#1A1953", teal: "#088395", green: "#22C55E", amber: "#F59E0B", red: "#EF4444", purple: "#8B5CF6", sky: "#06B6D4", indigo: "#6366F1" };
const METRICS = {
  week: { te: 24, ae: 21, tt: 87, ct: 63, pt: 24, prod: 72, empSub: "+1 this week", taskSub: "+14 this week", prodSub: "+2% vs last week" },
  month: { te: 24, ae: 22, tt: 347, ct: 285, pt: 62, prod: 82, empSub: "+3 this month", taskSub: "+58 this month", prodSub: "+5% vs last month" },
  year: { te: 24, ae: 23, tt: 4128, ct: 3542, pt: 586, prod: 86, empSub: "+8 this year", taskSub: "+620 this year", prodSub: "+9% vs last year" }
};
const EMP_PERF = {
  week: [
    { label: "Mon", alice: 85, bob: 72, carol: 90, dan: 65, emma: 78 },
    { label: "Tue", alice: 88, bob: 75, carol: 87, dan: 70, emma: 82 },
    { label: "Wed", alice: 82, bob: 80, carol: 92, dan: 68, emma: 79 },
    { label: "Thu", alice: 90, bob: 78, carol: 88, dan: 72, emma: 85 },
    { label: "Fri", alice: 87, bob: 76, carol: 94, dan: 74, emma: 83 },
    { label: "Sat", alice: 70, bob: 60, carol: 75, dan: 55, emma: 65 },
    { label: "Sun", alice: 50, bob: 45, carol: 55, dan: 40, emma: 48 }
  ],
  month: [
    { label: "Week 1", alice: 84, bob: 74, carol: 91, dan: 67, emma: 79 },
    { label: "Week 2", alice: 87, bob: 77, carol: 89, dan: 70, emma: 82 },
    { label: "Week 3", alice: 89, bob: 75, carol: 93, dan: 72, emma: 84 },
    { label: "Week 4", alice: 92, bob: 79, carol: 95, dan: 74, emma: 87 }
  ],
  year: [
    { label: "Jan", alice: 80, bob: 68, carol: 85, dan: 60, emma: 74 },
    { label: "Feb", alice: 82, bob: 70, carol: 87, dan: 63, emma: 76 },
    { label: "Mar", alice: 85, bob: 73, carol: 89, dan: 65, emma: 79 },
    { label: "Apr", alice: 83, bob: 71, carol: 88, dan: 64, emma: 77 },
    { label: "May", alice: 87, bob: 75, carol: 91, dan: 68, emma: 81 },
    { label: "Jun", alice: 89, bob: 77, carol: 93, dan: 70, emma: 84 },
    { label: "Jul", alice: 86, bob: 74, carol: 90, dan: 67, emma: 82 },
    { label: "Aug", alice: 90, bob: 78, carol: 94, dan: 72, emma: 86 },
    { label: "Sep", alice: 88, bob: 76, carol: 92, dan: 70, emma: 83 },
    { label: "Oct", alice: 91, bob: 80, carol: 96, dan: 74, emma: 87 },
    { label: "Nov", alice: 89, bob: 78, carol: 93, dan: 72, emma: 85 },
    { label: "Dec", alice: 93, bob: 82, carol: 97, dan: 76, emma: 90 }
  ]
};
const TASK_TREND = {
  week: [
    { label: "Mon", completed: 12, pending: 5, overdue: 1 },
    { label: "Tue", completed: 14, pending: 4, overdue: 2 },
    { label: "Wed", completed: 18, pending: 3, overdue: 1 },
    { label: "Thu", completed: 15, pending: 6, overdue: 2 },
    { label: "Fri", completed: 20, pending: 4, overdue: 1 },
    { label: "Sat", completed: 8, pending: 2, overdue: 0 },
    { label: "Sun", completed: 5, pending: 1, overdue: 0 }
  ],
  month: [
    { label: "Week 1", completed: 62, pending: 18, overdue: 4 },
    { label: "Week 2", completed: 71, pending: 15, overdue: 5 },
    { label: "Week 3", completed: 78, pending: 14, overdue: 3 },
    { label: "Week 4", completed: 82, pending: 12, overdue: 3 }
  ],
  year: [
    { label: "Jan", completed: 245, pending: 58, overdue: 12 },
    { label: "Feb", completed: 268, pending: 52, overdue: 9 },
    { label: "Mar", completed: 290, pending: 48, overdue: 11 },
    { label: "Apr", completed: 275, pending: 54, overdue: 10 },
    { label: "May", completed: 310, pending: 44, overdue: 8 },
    { label: "Jun", completed: 325, pending: 40, overdue: 7 },
    { label: "Jul", completed: 305, pending: 46, overdue: 9 },
    { label: "Aug", completed: 340, pending: 38, overdue: 6 },
    { label: "Sep", completed: 318, pending: 42, overdue: 8 },
    { label: "Oct", completed: 355, pending: 35, overdue: 5 },
    { label: "Nov", completed: 342, pending: 37, overdue: 6 },
    { label: "Dec", completed: 369, pending: 30, overdue: 4 }
  ]
};
const DEPT = {
  week: [
    { dept: "Engineering", score: 88, productivity: 91, tasks: 95 },
    { dept: "Design", score: 84, productivity: 87, tasks: 89 },
    { dept: "Marketing", score: 79, productivity: 83, tasks: 85 },
    { dept: "HR", score: 82, productivity: 85, tasks: 88 },
    { dept: "Finance", score: 76, productivity: 80, tasks: 82 }
  ],
  month: [
    { dept: "Engineering", score: 92, productivity: 94, tasks: 96 },
    { dept: "Design", score: 88, productivity: 90, tasks: 92 },
    { dept: "Marketing", score: 85, productivity: 87, tasks: 89 },
    { dept: "HR", score: 86, productivity: 88, tasks: 90 },
    { dept: "Finance", score: 80, productivity: 83, tasks: 85 }
  ],
  year: [
    { dept: "Engineering", score: 94, productivity: 96, tasks: 97 },
    { dept: "Design", score: 90, productivity: 92, tasks: 94 },
    { dept: "Marketing", score: 87, productivity: 89, tasks: 91 },
    { dept: "HR", score: 88, productivity: 90, tasks: 92 },
    { dept: "Finance", score: 83, productivity: 85, tasks: 87 }
  ]
};
const LEADS = {
  week: [
    { name: "Sarah Chen", team: "Engineering A", rating: 94, productivity: 92, taskCompletion: 88, teamSize: 6 },
    { name: "James Liu", team: "Engineering B", rating: 88, productivity: 85, taskCompletion: 82, teamSize: 5 },
    { name: "Mia Patel", team: "Design", rating: 91, productivity: 89, taskCompletion: 86, teamSize: 4 },
    { name: "Carlos Rivera", team: "Marketing", rating: 85, productivity: 82, taskCompletion: 79, teamSize: 5 },
    { name: "Aisha Nkosi", team: "HR & Finance", rating: 87, productivity: 84, taskCompletion: 81, teamSize: 4 }
  ],
  month: [
    { name: "Sarah Chen", team: "Engineering A", rating: 96, productivity: 94, taskCompletion: 91, teamSize: 6 },
    { name: "James Liu", team: "Engineering B", rating: 90, productivity: 88, taskCompletion: 85, teamSize: 5 },
    { name: "Mia Patel", team: "Design", rating: 93, productivity: 91, taskCompletion: 89, teamSize: 4 },
    { name: "Carlos Rivera", team: "Marketing", rating: 87, productivity: 85, taskCompletion: 82, teamSize: 5 },
    { name: "Aisha Nkosi", team: "HR & Finance", rating: 89, productivity: 87, taskCompletion: 84, teamSize: 4 }
  ],
  year: [
    { name: "Sarah Chen", team: "Engineering A", rating: 97, productivity: 96, taskCompletion: 94, teamSize: 6 },
    { name: "James Liu", team: "Engineering B", rating: 92, productivity: 90, taskCompletion: 88, teamSize: 5 },
    { name: "Mia Patel", team: "Design", rating: 95, productivity: 93, taskCompletion: 91, teamSize: 4 },
    { name: "Carlos Rivera", team: "Marketing", rating: 89, productivity: 87, taskCompletion: 85, teamSize: 5 },
    { name: "Aisha Nkosi", team: "HR & Finance", rating: 91, productivity: 89, taskCompletion: 87, teamSize: 4 }
  ]
};
const CONTRIB = {
  week: [
    { label: "Mon", alice: 8, bob: 5, carol: 9, dan: 4 },
    { label: "Tue", alice: 10, bob: 7, carol: 11, dan: 5 },
    { label: "Wed", alice: 9, bob: 8, carol: 12, dan: 6 },
    { label: "Thu", alice: 11, bob: 6, carol: 10, dan: 5 },
    { label: "Fri", alice: 12, bob: 9, carol: 13, dan: 7 },
    { label: "Sat", alice: 5, bob: 3, carol: 6, dan: 2 },
    { label: "Sun", alice: 3, bob: 2, carol: 4, dan: 1 }
  ],
  month: [
    { label: "Wk 1", alice: 42, bob: 33, carol: 48, dan: 26 },
    { label: "Wk 2", alice: 47, bob: 36, carol: 52, dan: 29 },
    { label: "Wk 3", alice: 50, bob: 38, carol: 55, dan: 31 },
    { label: "Wk 4", alice: 54, bob: 41, carol: 59, dan: 33 }
  ],
  year: [
    { label: "Jan", alice: 165, bob: 128, carol: 188, dan: 105 },
    { label: "Feb", alice: 172, bob: 133, carol: 195, dan: 110 },
    { label: "Mar", alice: 180, bob: 140, carol: 204, dan: 116 },
    { label: "Apr", alice: 175, bob: 136, carol: 199, dan: 112 },
    { label: "May", alice: 188, bob: 145, carol: 212, dan: 120 },
    { label: "Jun", alice: 195, bob: 151, carol: 220, dan: 125 },
    { label: "Jul", alice: 182, bob: 142, carol: 208, dan: 118 },
    { label: "Aug", alice: 202, bob: 156, carol: 228, dan: 130 },
    { label: "Sep", alice: 190, bob: 148, carol: 215, dan: 122 },
    { label: "Oct", alice: 210, bob: 162, carol: 235, dan: 135 },
    { label: "Nov", alice: 198, bob: 154, carol: 222, dan: 128 },
    { label: "Dec", alice: 218, bob: 168, carol: 244, dan: 140 }
  ]
};
const ALL_MONTHLY = [
  { mo: "Jan 25", productivity: 74, tasks: 218, hrs: 152 },
  { mo: "Feb 25", productivity: 76, tasks: 235, hrs: 158 },
  { mo: "Mar 25", productivity: 79, tasks: 258, hrs: 163 },
  { mo: "Apr 25", productivity: 77, tasks: 244, hrs: 160 },
  { mo: "May 25", productivity: 82, tasks: 276, hrs: 168 },
  { mo: "Jun 25", productivity: 85, tasks: 292, hrs: 172 },
  { mo: "Jul 25", productivity: 80, tasks: 265, hrs: 165 },
  { mo: "Aug 25", productivity: 87, tasks: 308, hrs: 175 },
  { mo: "Sep 25", productivity: 84, tasks: 285, hrs: 170 },
  { mo: "Oct 25", productivity: 89, tasks: 325, hrs: 178 },
  { mo: "Nov 25", productivity: 86, tasks: 302, hrs: 173 },
  { mo: "Dec 25", productivity: 91, tasks: 340, hrs: 180 },
  { mo: "Jan 26", productivity: 88, tasks: 315, hrs: 176 },
  { mo: "Feb 26", productivity: 90, tasks: 330, hrs: 178 },
  { mo: "Mar 26", productivity: 92, tasks: 348, hrs: 182 },
  { mo: "Apr 26", productivity: 91, tasks: 342, hrs: 180 },
  { mo: "May 26", productivity: 93, tasks: 360, hrs: 185 },
  { mo: "Jun 26", productivity: 94, tasks: 375, hrs: 187 },
  { mo: "Jul 26", productivity: 92, tasks: 355, hrs: 183 },
  { mo: "Aug 26", productivity: 95, tasks: 388, hrs: 190 },
  { mo: "Sep 26", productivity: 93, tasks: 368, hrs: 185 },
  { mo: "Oct 26", productivity: 96, tasks: 400, hrs: 192 },
  { mo: "Nov 26", productivity: 94, tasks: 380, hrs: 188 },
  { mo: "Dec 26", productivity: 97, tasks: 415, hrs: 195 }
];
const CR_SLICE = { "2mo": 2, "6mo": 6, "8mo": 8, "1yr": 12, "2yr": 24 };
const TT = { contentStyle: { borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.10)", fontSize: 12 } };
function SectionHead({ title, desc }) {
  return <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-8 rounded-full bg-[#162E93] flex-shrink-0" />
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>;
}
function MCard({ icon, label, value, sub, bg, trend }) {
  return <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1.5 leading-tight">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-xs mt-1 font-medium flex items-center gap-0.5 ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-gray-500"}`}>
              {trend === "up" && "\u2191 "}{trend === "down" && "\u2193 "}{sub}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>;
}
function Analytics() {
  const [tr, setTr] = useState("month");
  const [ev, setEv] = useState("perf");
  const [cr, setCr] = useState("6mo");
  const [liveUsers, setLiveUsers] = useState([]);
  const [liveTasks, setLiveTasks] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);
  useEffect(() => {
    Promise.all([fetchUsers(), fetchTasks(), fetchProjects()])
      .then(([users, tasks, projects]) => {
        setLiveUsers(users);
        setLiveTasks(tasks);
        setLiveProjects(projects);
      })
      .catch(() => {});
  }, []);
  const fallbackMetrics = METRICS[tr];
  const m = liveTasks.length || liveUsers.length ? {
    ...fallbackMetrics,
    te: liveUsers.length || fallbackMetrics.te,
    ae: liveUsers.filter((user) => String(user.status ?? "").toLowerCase() !== "inactive").length || fallbackMetrics.ae,
    tt: liveTasks.length || fallbackMetrics.tt,
    ct: liveTasks.filter((task) => String(task.status ?? "").toLowerCase() === "completed").length || fallbackMetrics.ct,
    pt: liveTasks.filter((task) => String(task.status ?? "").toLowerCase() !== "completed").length || fallbackMetrics.pt,
    prod: liveTasks.length ? Math.round((liveTasks.filter((task) => String(task.status ?? "").toLowerCase() === "completed").length / liveTasks.length) * 100) : fallbackMetrics.prod,
    taskSub: `${liveProjects.length} projects`,
  } : fallbackMetrics;
  const ep = EMP_PERF[tr];
  const tt = TASK_TREND[tr];
  const dep = DEPT[tr];
  const ld = LEADS[tr];
  const con = CONTRIB[tr];
  const cd = useMemo(() => ALL_MONTHLY.slice(ALL_MONTHLY.length - CR_SLICE[cr]), [cr]);
  const pie = [
    { name: "Completed", value: m.ct, color: C.green },
    { name: "Pending", value: m.pt, color: C.amber },
    { name: "Overdue", value: Math.round(m.tt * 0.04), color: C.red }
  ];
  const TR_LABEL = { week: "This Week", month: "This Month", year: "This Year" };
  const CR_LABEL = { "2mo": "2 Months", "6mo": "6 Months", "8mo": "8 Months", "1yr": "1 Year", "2yr": "2 Years" };
  const DEPT_COLORS = [C.blue, C.teal, C.purple, C.sky, C.indigo];
  return <AppLayout userRole="admin">
      <div className="space-y-10 pb-10">

        {
    /* ── HEADER ─────────────────────────────────────────────────────────── */
  }
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-500 mt-1">Track team performance, productivity, and contribution metrics</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
            {["week", "month", "year"].map((r) => <button
    key={r}
    onClick={() => setTr(r)}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tr === r ? "bg-[#162E93] text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-white"}`}
  >
                {TR_LABEL[r]}
              </button>)}
          </div>
        </div>

        {
    /* ── SECTION 1: KEY METRICS ─────────────────────────────────────────── */
  }
        <section>
          <SectionHead title="Overall Performance Dashboard" desc={`Key metrics summary \xB7 ${TR_LABEL[tr]}`} />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <MCard icon={<Users className="h-5 w-5 text-white" />} label="Total Employees" value={m.te} sub={m.empSub} bg="bg-[#162E93]" trend="up" />
            <MCard icon={<UserCheck className="h-5 w-5 text-white" />} label="Active Employees" value={m.ae} sub={`${Math.round(m.ae / m.te * 100)}% active`} bg="bg-[#088395]" trend="neutral" />
            <MCard icon={<BarChart2 className="h-5 w-5 text-white" />} label="Total Tasks" value={m.tt.toLocaleString()} sub={m.taskSub} bg="bg-indigo-500" trend="up" />
            <MCard icon={<CheckSquare className="h-5 w-5 text-white" />} label="Completed Tasks" value={m.ct.toLocaleString()} sub={`${Math.round(m.ct / m.tt * 100)}% rate`} bg="bg-green-500" trend="up" />
            <MCard icon={<Clock className="h-5 w-5 text-white" />} label="Pending Tasks" value={m.pt.toLocaleString()} sub={`${Math.round(m.pt / m.tt * 100)}% of total`} bg="bg-amber-500" trend="down" />
            <MCard icon={<TrendingUp className="h-5 w-5 text-white" />} label="Overall Productivity" value={`${m.prod}%`} sub={m.prodSub} bg="bg-purple-500" trend="up" />
          </div>
        </section>

        {
    /* ── SECTION 2: EMPLOYEE PERFORMANCE ────────────────────────────────── */
  }
        <section>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <SectionHead title="Employee Performance Analysis" desc="Individual scores and task completion comparison" />
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
              {[["perf", "Performance Score"], ["tasks", "Task Completion"]].map(([k, l]) => <button
    key={k}
    onClick={() => setEv(k)}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${ev === k ? "bg-[#162E93] text-white shadow-sm" : "text-gray-500 hover:bg-white"}`}
  >
                  {l}
                </button>)}
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{ev === "perf" ? "Performance Ratings Over Time" : "Task Completion Trends"}</CardTitle>
                <CardDescription>Multi-employee comparison · {TR_LABEL[tr]}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {ev === "perf" ? <LineChart data={ep} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="alice" stroke={C.blue} strokeWidth={2.5} dot={false} name="Alice (Eng)" />
                      <Line type="monotone" dataKey="carol" stroke={C.teal} strokeWidth={2.5} dot={false} name="Carol (Design)" />
                      <Line type="monotone" dataKey="emma" stroke={C.purple} strokeWidth={2.5} dot={false} name="Emma (Mkt)" />
                      <Line type="monotone" dataKey="bob" stroke={C.amber} strokeWidth={2} dot={false} name="Bob (HR)" />
                      <Line type="monotone" dataKey="dan" stroke={C.sky} strokeWidth={2} dot={false} name="Dan (Finance)" />
                    </LineChart> : <BarChart data={tt} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                      <Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="completed" stackId="a" fill={C.green} name="Completed" />
                      <Bar dataKey="pending" stackId="a" fill={C.amber} name="Pending" />
                      <Bar dataKey="overdue" stackId="a" fill={C.red} name="Overdue" radius={[4, 4, 0, 0]} />
                    </BarChart>}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Task Distribution</CardTitle>
                <CardDescription>Current task status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.10)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5 mt-2">
                  {pie.map((d) => <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-sm text-gray-600">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{d.value.toLocaleString()}</span>
                        <span className="text-xs text-gray-400">{Math.round(d.value / m.tt * 100)}%</span>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {
    /* ── SECTION 3: TEAM LEAD PERFORMANCE ───────────────────────────────── */
  }
        <section>
          <SectionHead title="Team Leader Performance" desc="Ratings, productivity scores, and task completion rates per team lead" />
          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="lg:col-span-3 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performance Rating Comparison</CardTitle>
                <CardDescription>Team leader scores · {TR_LABEL[tr]}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ld.map((tl) => ({ name: tl.name.split(" ")[0], "Rating": tl.rating, "Productivity": tl.productivity, "Task Completion": tl.taskCompletion }))} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Rating" fill={C.blue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Productivity" fill={C.teal} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Task Completion" fill={C.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-3">
              {[...ld].sort((a, b) => b.rating - a.rating).map((tl, idx) => <Card key={tl.name} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-[#162E93]"}`}>
                        #{idx + 1}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#162E93]">{tl.name.split(" ").map((n) => n[0]).join("")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tl.name}</p>
                        <p className="text-xs text-gray-400">{tl.team} · {tl.teamSize} members</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold text-[#162E93]">{tl.rating}%</p>
                        <p className="text-[10px] text-gray-400">Rating</p>
                      </div>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      {[{ label: "Productivity", val: tl.productivity, color: "bg-[#088395]" }, { label: "Task Completion", val: tl.taskCompletion, color: "bg-purple-400" }].map((bar) => <div key={bar.label}>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                            <span className="truncate">{bar.label}</span>
                            <span className="font-semibold text-gray-600 ml-1">{bar.val}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bar.color}`} style={{ width: `${bar.val}%` }} />
                          </div>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {
    /* ── SECTION 4: DEPARTMENT PERFORMANCE ──────────────────────────────── */
  }
        <section>
          <SectionHead title="Department Performance Analysis" desc="Cross-department productivity, ratings, and task completion ratios" />
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Department Score Comparison</CardTitle>
                <CardDescription>Performance · Productivity · Task Completion · {TR_LABEL[tr]}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dep.map((d) => ({ name: d.dept.length > 7 ? d.dept.slice(0, 7) + "\u2026" : d.dept, "Performance": d.score, "Productivity": d.productivity, "Task Completion": d.tasks }))} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Performance" fill={C.blue} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Productivity" fill={C.teal} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Task Completion" fill={C.green} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Department Scorecards</CardTitle>
                <CardDescription>Detailed rating breakdown per department</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...dep].sort((a, b) => b.score - a.score).map((d, i) => <div key={d.dept}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                        <span className="text-sm font-medium text-gray-800">{d.dept}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Perf <span className="font-bold text-gray-700">{d.score}%</span></span>
                        <span>Prod <span className="font-bold text-gray-700">{d.productivity}%</span></span>
                        <span>Tasks <span className="font-bold text-gray-700">{d.tasks}%</span></span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.score}%`, background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                    </div>
                  </div>)}
                <div className="pt-2 p-3 bg-[#162E93]/5 rounded-xl border border-[#162E93]/10">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
    { label: "Avg Performance", val: Math.round(dep.reduce((s, d) => s + d.score, 0) / dep.length) },
    { label: "Avg Productivity", val: Math.round(dep.reduce((s, d) => s + d.productivity, 0) / dep.length) },
    { label: "Avg Task Rate", val: Math.round(dep.reduce((s, d) => s + d.tasks, 0) / dep.length) }
  ].map((a) => <div key={a.label}>
                        <p className="text-xl font-bold text-[#162E93]">{a.val}%</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{a.label}</p>
                      </div>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {
    /* ── SECTION 5: CONTRIBUTION ANALYSIS ───────────────────────────────── */
  }
        <section>
          <SectionHead title="Contribution Analysis" desc="Individual task contributions, weekly/monthly trends, and performance insights" />
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contribution Trends Over Time</CardTitle>
                <CardDescription>Task contributions per employee · {TR_LABEL[tr]}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={con} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                    <defs>
                      {[["alice", C.blue], ["carol", C.teal], ["bob", C.sky], ["dan", C.purple]].map(([id, col]) => <linearGradient key={id} id={`gc-${id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={col} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={col} stopOpacity={0.02} />
                        </linearGradient>)}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                    <Tooltip {...TT} /><Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="carol" stackId="1" stroke={C.teal} fill="url(#gc-carol)" name="Carol" />
                    <Area type="monotone" dataKey="alice" stackId="1" stroke={C.blue} fill="url(#gc-alice)" name="Alice" />
                    <Area type="monotone" dataKey="bob" stackId="1" stroke={C.sky} fill="url(#gc-bob)" name="Bob" />
                    <Area type="monotone" dataKey="dan" stackId="1" stroke={C.purple} fill="url(#gc-dan)" name="Dan" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />Top Contributors
                </CardTitle>
                <CardDescription>Ranked by total contributions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
    { name: "Carol Davis", dept: "Design", total: con.reduce((s, d) => s + d.carol, 0), color: C.teal },
    { name: "Alice Wang", dept: "Engineering", total: con.reduce((s, d) => s + d.alice, 0), color: C.blue },
    { name: "Bob Martinez", dept: "HR", total: con.reduce((s, d) => s + d.bob, 0), color: C.sky },
    { name: "Dan Foster", dept: "Finance", total: con.reduce((s, d) => s + d.dan, 0), color: C.purple }
  ].sort((a, b) => b.total - a.total).map((emp, i) => <div key={emp.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-200 text-gray-600" : "bg-orange-50 text-orange-600"}`}>
                      #{i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${emp.color}18` }}>
                      <span className="text-[10px] font-bold" style={{ color: emp.color }}>{emp.name.split(" ").map((n) => n[0]).join("")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.dept}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: emp.color }}>{emp.total}</p>
                      <p className="text-[10px] text-gray-400">tasks</p>
                    </div>
                  </div>)}
                <div className="mt-1 p-3 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />Top Performer Insight
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Carol leads with the highest task contribution this {tr === "week" ? "week" : tr === "month" ? "month" : "year"}. Consider recognising her achievements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {
    /* ── SECTION 6: CUSTOM TIME RANGE GRAPH ─────────────────────────────── */
  }
        <section>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <SectionHead title="Custom Time Range Analysis" desc="Flexible productivity and task trend over your selected period" />
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
              {["2mo", "6mo", "8mo", "1yr", "2yr"].map((r) => <button
    key={r}
    onClick={() => setCr(r)}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${cr === r ? "bg-[#162E93] text-white shadow-sm" : "text-gray-500 hover:bg-white"}`}
  >
                  Last {CR_LABEL[r]}
                </button>)}
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base">Performance Overview · Last {CR_LABEL[cr]}</CardTitle>
                  <CardDescription>Productivity score, tasks completed, and hours logged — {cd.length} months</CardDescription>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {[["Productivity %", C.blue], ["Tasks Completed", C.teal], ["Hours Logged", C.green]].map(([l, c]) => <span key={l} className="flex items-center gap-1.5">
                      <span className="w-4 h-0.5 rounded inline-block" style={{ background: c }} />
                      {l}
                    </span>)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={cd} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                  <defs>
                    {[["gBlue", C.blue], ["gTeal", C.teal], ["gGreen", C.green]].map(([id, col]) => <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={col} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={col} stopOpacity={0.02} />
                      </linearGradient>)}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mo" tick={{ fontSize: cd.length > 12 ? 9 : 11 }} interval={cd.length > 16 ? 1 : 0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,.10)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="productivity" stroke={C.blue} strokeWidth={2.5} fill="url(#gBlue)" name="Productivity (%)" />
                  <Area type="monotone" dataKey="tasks" stroke={C.teal} strokeWidth={2.5} fill="url(#gTeal)" name="Tasks Completed" />
                  <Area type="monotone" dataKey="hrs" stroke={C.green} strokeWidth={2} fill="url(#gGreen)" name="Hours Logged" />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-5 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                {[
    { label: "Avg Productivity", val: `${Math.round(cd.reduce((s, d) => s + d.productivity, 0) / cd.length)}%`, color: "text-[#162E93]" },
    { label: "Total Tasks", val: cd.reduce((s, d) => s + d.tasks, 0).toLocaleString(), color: "text-[#088395]" },
    { label: "Total Hours", val: `${cd.reduce((s, d) => s + d.hrs, 0).toLocaleString()}h`, color: "text-green-600" }
  ].map((s) => <div key={s.label} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </AppLayout>;
}
export {
  Analytics as default
};
