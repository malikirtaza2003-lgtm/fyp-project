import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  Filter, 
  UserPlus, 
  CheckCircle2,
  Users
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { fetchUsers } from "../utils/api";

const initialRadarData = [
  { subject: 'Quality', A: 85, fullMark: 100 },
  { subject: 'Timeliness', A: 90, fullMark: 100 },
  { subject: 'Collaboration', A: 80, fullMark: 100 },
  { subject: 'Performance', A: 95, fullMark: 100 },
  { subject: 'Productivity', A: 88, fullMark: 100 },
];

const weeklyHoursData = [
  { name: 'Alex', hours: 38 },
  { name: 'Maria', hours: 42 },
  { name: 'David', hours: 36 },
  { name: 'Priya', hours: 40 },
  { name: 'Tom', hours: 35 },
  { name: 'Lisa', hours: 39 },
];

const teamDataMock = [
  { 
    id: 1, 
    name: "Alex Johnson", 
    role: "Frontend Developer", 
    status: "Online", 
    email: "alex@company.com", 
    phone: "+1 555-0101", 
    hours: "38h this week",
    tasks: 8,
    done: 6,
    score: 92,
    initial: "AJ",
    color: "bg-blue-600",
    radar: [
      { subject: 'Quality', A: 92 },
      { subject: 'Timeliness', A: 88 },
      { subject: 'Collaboration', A: 95 },
      { subject: 'Performance', A: 90 },
      { subject: 'Productivity', A: 85 },
    ]
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    role: "UI/UX Designer", 
    status: "Online", 
    email: "maria@company.com", 
    phone: "+1 555-0102", 
    hours: "36h this week",
    tasks: 5,
    done: 4,
    score: 88,
    initial: "MS",
    color: "bg-indigo-600",
    radar: initialRadarData
  },
  { 
    id: 3, 
    name: "David Kim", 
    role: "Backend Developer", 
    status: "Away", 
    email: "david@company.com", 
    phone: "+1 555-0103", 
    hours: "34h this week",
    tasks: 10,
    done: 7,
    score: 85,
    initial: "DK",
    color: "bg-blue-500",
    radar: [
      { subject: 'Quality', A: 85 },
      { subject: 'Timeliness', A: 80 },
      { subject: 'Collaboration', A: 75 },
      { subject: 'Performance', A: 90 },
      { subject: 'Productivity', A: 95 },
    ]
  },
  { 
    id: 4, 
    name: "Priya Patel", 
    role: "QA Engineer", 
    status: "Online", 
    email: "priya@company.com", 
    phone: "+1 555-0104", 
    hours: "40h this week",
    tasks: 6,
    done: 5,
    score: 94,
    initial: "PP",
    color: "bg-indigo-500",
    radar: [
      { subject: 'Quality', A: 95 },
      { subject: 'Timeliness', A: 92 },
      { subject: 'Collaboration', A: 88 },
      { subject: 'Performance', A: 94 },
      { subject: 'Productivity', A: 90 },
    ]
  },
  { 
    id: 5, 
    name: "Tom Wilson", 
    role: "DevOps Engineer", 
    status: "Offline", 
    email: "tom@company.com", 
    phone: "+1 555-0105", 
    hours: "32h this week",
    tasks: 4,
    done: 2,
    score: 72,
    initial: "TW",
    color: "bg-blue-700",
    radar: [
      { subject: 'Quality', A: 70 },
      { subject: 'Timeliness', A: 75 },
      { subject: 'Collaboration', A: 85 },
      { subject: 'Performance', A: 72 },
      { subject: 'Productivity', A: 68 },
    ]
  },
  { 
    id: 6, 
    name: "Lisa Chen", 
    role: "Product Manager", 
    status: "Online", 
    email: "lisa@company.com", 
    phone: "+1 555-0106", 
    hours: "39h this week",
    tasks: 7,
    done: 6,
    score: 95,
    initial: "LC",
    color: "bg-indigo-700",
    radar: [
      { subject: 'Quality', A: 90 },
      { subject: 'Timeliness', A: 95 },
      { subject: 'Collaboration', A: 98 },
      { subject: 'Performance', A: 92 },
      { subject: 'Productivity', A: 88 },
    ]
  },
];

export default function TeamLeadTeam() {
  const [members, setMembers] = useState(teamDataMock);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchUsers()
      .then((users) => {
        if (!mounted) return;
        const employees = users
          .filter((user) => String(user.role ?? "").toLowerCase() === "employee")
          .map((user, idx) => ({
            id: user.id || user._id || idx + 10,
            name: user.name,
            role: user.jobTitle || "Employee",
            status: idx % 3 === 0 ? "Online" : idx % 3 === 1 ? "Away" : "Offline",
            email: user.email || "user@company.com",
            phone: user.phone || "+1 555-0100",
            hours: "35h this week",
            tasks: 8,
            done: 5,
            score: 85,
            initial: user.name.split(" ").map(n => n[0]).join("").toUpperCase(),
            color: "bg-blue-600",
            radar: initialRadarData
          }));
        if (employees.length > 0) {
          setMembers(employees);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: members.length,
      online: members.filter(m => m.status === "Online").length,
      activeTasks: members.reduce((acc, m) => acc + (m.tasks || 0), 0),
      avgPerf: Math.round(members.reduce((acc, m) => acc + (m.score || 0), 0) / members.length)
    };
  }, [members]);

  return (
    <AppLayout userRole="teamlead">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor your team members' performance and status.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-gray-200 h-10 gap-2 text-sm font-medium">
              <Eye className="h-4 w-4 text-gray-400" />
              View Only Access
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500">
              <Users className="h-4 w-4 text-[#162E93]" />
              {stats.total} Members
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Members", value: stats.total, color: "text-gray-900" },
            { label: "Online Now", value: stats.online, color: "text-green-600" },
            { label: "Tasks Active", value: stats.activeTasks, color: "text-[#088395]" },
            { label: "Avg. Performance", value: `${stats.avgPerf}%`, color: "text-red-500" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl bg-white/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search team members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-100 bg-white shadow-sm focus:ring-[#162E93]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            {["All", "Online", "Away", "Offline"].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f 
                    ? "bg-[#162E93] text-white shadow-md" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* Members List Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map(m => (
                <Card 
                  key={m.id} 
                  onClick={() => setSelectedMember(m)}
                  className={`border-2 transition-all cursor-pointer group hover:shadow-lg ${
                    selectedMember?.id === m.id ? "border-[#162E93] ring-1 ring-[#162E93]/20 bg-blue-50/10" : "border-transparent bg-white"
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                          {m.initial}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">{m.name}</h3>
                          <p className="text-[10px] text-gray-400 font-medium">{m.role}</p>
                        </div>
                      </div>
                      <button className="p-1.5 rounded-lg text-gray-300 hover:text-[#162E93] hover:bg-[#162E93]/5 transition-all">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Task Progress</span>
                        <span className="text-[9px] font-bold text-gray-800">{m.done}/{m.tasks}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#162E93] rounded-full transition-all duration-500" 
                          style={{ width: `${(m.done/m.tasks)*100}%` }} 
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-2.5 w-2.5 ${i < (m.score > 90 ? 5 : 4) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.status === "Away" && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">1 overdue</span>}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          m.status === "Online" ? "bg-green-50 text-green-600" : m.status === "Away" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-400"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Weekly Hours Summary */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-800 uppercase tracking-widest">Weekly Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyHoursData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                        dy={5}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="hours" fill="#088395" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50 flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Star className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-800">Tip</p>
                    <p className="text-[11px] text-amber-700/80 leading-relaxed mt-0.5">Click on a team member card to view their detailed performance profile and radar chart.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Selected Member Detail Sidebar */}
          <div className="sticky top-6">
            {selectedMember ? (
              <>
                <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-8 text-center border-b border-gray-50 bg-gray-50/30">
                    <div className={`w-20 h-20 rounded-3xl ${selectedMember.color} mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white`}>
                      {selectedMember.initial}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mt-4">{selectedMember.name}</h3>
                    <p className="text-sm font-medium text-gray-500 mt-1">{selectedMember.role}</p>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold ring-1 ring-green-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {selectedMember.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#162E93]/10 group-hover:text-[#162E93] transition-all">
                        <Mail className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#162E93]/10 group-hover:text-[#162E93] transition-all">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{selectedMember.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#162E93]/10 group-hover:text-[#162E93] transition-all">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{selectedMember.hours}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-6">
                      <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100/50">
                        <p className="text-lg font-bold text-gray-900">{selectedMember.tasks}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tasks</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100/50">
                        <p className="text-lg font-bold text-gray-900">{selectedMember.done}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Done</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100/50">
                        <p className="text-lg font-bold text-[#162E93]">{selectedMember.score}%</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Score</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Chart Section - Separate Card */}
              <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white mt-4">
                <CardHeader className="pb-0 pt-6 px-6">
                  <CardTitle className="text-xs font-bold text-gray-800 uppercase tracking-widest">Performance Radar</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[250px] w-full bg-gray-50/50 rounded-3xl p-2 border border-dashed border-gray-200">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={selectedMember.radar || initialRadarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                        <Radar
                          name={selectedMember.name}
                          dataKey="A"
                          stroke="#162E93"
                          fill="#162E93"
                          fillOpacity={0.2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-4 italic font-medium">
                    Analysis based on active tasks and productivity metrics
                  </p>
                </CardContent>
              </Card>
            </>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Member Selected</h3>
                <p className="text-xs text-gray-300 mt-2">Select a team member to view their detailed performance radar and activity stats.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
