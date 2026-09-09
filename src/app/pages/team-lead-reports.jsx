import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  Star, 
  Trophy, 
  Target, 
  Zap, 
  Users,
  Award,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { fetchTasks } from "../utils/api";

const reportsData = [
  { week: "Week 1", tasksCompleted: 120, avgQuality: 85, teamScore: 88 },
  { week: "Week 2", tasksCompleted: 135, avgQuality: 87, teamScore: 90 },
  { week: "Week 3", tasksCompleted: 128, avgQuality: 86, teamScore: 89 },
  { week: "Week 4", tasksCompleted: 142, avgQuality: 88, teamScore: 92 },
];

const individualPerformance = [
  { 
    id: 1, 
    name: "Alex Johnson", 
    avatar: "AJ", 
    stars: 4, 
    overall: 89, 
    metrics: [
      { label: "Quality", value: 88, color: "bg-blue-600" },
      { label: "Timeliness", value: 92, color: "bg-teal-500" },
      { label: "Collab", value: 90, color: "bg-indigo-500" },
      { label: "Initiative", value: 85, color: "bg-blue-400" },
    ]
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    avatar: "MS", 
    stars: 5, 
    overall: 96, 
    metrics: [
      { label: "Quality", value: 98, color: "bg-blue-600" },
      { label: "Timeliness", value: 95, color: "bg-teal-500" },
      { label: "Collab", value: 97, color: "bg-indigo-500" },
      { label: "Initiative", value: 94, color: "bg-blue-400" },
    ]
  },
  { 
    id: 3, 
    name: "David Kim", 
    avatar: "DK", 
    stars: 4, 
    overall: 82, 
    metrics: [
      { label: "Quality", value: 82, color: "bg-blue-600" },
      { label: "Timeliness", value: 78, color: "bg-teal-500" },
      { label: "Collab", value: 86, color: "bg-indigo-500" },
      { label: "Initiative", value: 80, color: "bg-blue-400" },
    ]
  },
  { 
    id: 4, 
    name: "Priya Patel", 
    avatar: "PP", 
    stars: 5, 
    overall: 93, 
    metrics: [
      { label: "Quality", value: 95, color: "bg-blue-600" },
      { label: "Timeliness", value: 90, color: "bg-teal-500" },
      { label: "Collab", value: 92, color: "bg-indigo-500" },
      { label: "Initiative", value: 95, color: "bg-blue-400" },
    ]
  },
];

export default function TeamLeadReports() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks().then(setTasks).catch(() => {});
  }, []);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => String(task.status ?? "").toLowerCase() === "completed").length;
    const pending = total - completed;
    const quality = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, quality };
  }, [tasks]);

  const liveReportsData = useMemo(() => {
    if (tasks.length === 0) return reportsData;
    return reportsData.map((entry, index) => ({
      ...entry,
      tasksCompleted: Math.max(1, Math.round(metrics.completed / reportsData.length) + index),
      avgQuality: metrics.quality,
      teamScore: Math.min(100, metrics.quality + 3),
    }));
  }, [metrics.completed, metrics.quality, tasks.length]);

  return (
    <AppLayout userRole="teamlead">
      <div className="space-y-6">
        <div>
          <h1>Team Reports</h1>
          <p className="text-muted-foreground">View comprehensive team performance reports</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Avg Quality", value: `${metrics.quality}%`, bg: "bg-blue-100", text: "text-blue-700" },
            { label: "Team Score", value: `${Math.min(100, metrics.quality + 3)}%`, bg: "bg-green-100", text: "text-green-700" },
            { label: "Tasks This Month", value: String(metrics.total), bg: "bg-purple-100", text: "text-purple-700" },
            { label: "Efficiency", value: `${metrics.total ? Math.round((metrics.completed / metrics.total) * 100) : 0}%`, bg: "bg-amber-100", text: "text-amber-700" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={liveReportsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasksCompleted" fill="#162E93" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quality & Team Score</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={liveReportsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[80, 95]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgQuality" stroke="#162E93" strokeWidth={2} name="Quality" />
                  <Line type="monotone" dataKey="teamScore" stroke="#10B981" strokeWidth={2} name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Individual Performance Ratings Section */}
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Individual Performance Ratings</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Detailed metrics breakdown for each team member</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 shadow-sm">
                <Trophy className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="text-xs font-bold">Top: Maria Santos</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-10 mt-6">
              {individualPerformance.map((member) => (
                <div key={member.id} className="relative group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-100">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">{member.name}</h3>
                          {member.overall > 90 && <Award className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < member.stars ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#162E93]">{member.overall}%</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Overall Rating</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {member.metrics.map((metric, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{metric.label}</span>
                          <span className="text-[10px] font-bold text-gray-700">{metric.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${metric.color} rounded-full transition-all duration-1000`} 
                            style={{ width: `${metric.value}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Divider - hidden for last item */}
                  <div className="absolute -bottom-5 left-0 right-0 h-[1px] bg-gray-50 group-last:hidden" />
                </div>
              ))}
            </div>


          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
