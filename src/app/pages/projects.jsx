import { useState, useRef, useEffect } from "react";
import { getCurrentRole, getCurrentUser } from "../utils/auth";
import { AppLayout } from "../components/app-layout";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  Plus,
  Users,
  Calendar,
  BarChart3,
  Search,
  X,
  CheckCircle2,
  Circle,
  Clock,
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  TrendingUp,
  Target,
  Activity,
  Zap,
  ChevronRight,
  Flag,
  ChevronDown,
  Trash2,
  Mic,
  MoreVertical,
  Edit,
  BarChart2,
  Image as ImageIcon,
  FileText,
  Share2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { showToast } from "../utils/toast";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";
import { createProject as createProjectApi, deleteProject as deleteProjectApi, fetchProjects, fetchUsers, updateProject as updateProjectApi } from "../utils/api";

const EMOJIS = ["😀", "😂", "❤️", "👍", "👏", "🎉", "🙌", "🔥", "💯", "✅", "😎", "🤔", "👀", "💪", "🚀", "⭐", "✨", "🙏", "😅", "😍", "👋", "🎊", "🤝", "💡", "📌"];
const autoReplies = [
  "Sounds good, I'll check that!",
  "Great progress! Keep it up \u{1F680}",
  "Let me know if you need help.",
  "On it! Will update soon.",
  "Thanks for the heads-up!",
  "Roger that, syncing now."
];
const RECENT_MEDIA = [
  { name: "Q1_Report.pdf", type: "PDF", size: "2.4 MB", date: "Apr 29", emoji: "\u{1F4C4}" },
  { name: "Design_Mockup.fig", type: "Figma", size: "8.1 MB", date: "Apr 28", emoji: "\u{1F3A8}" },
  { name: "Sprint_Plan.xlsx", type: "Excel", size: "1.2 MB", date: "Apr 27", emoji: "\u{1F4CA}" },
  { name: "Team_Photo.jpg", type: "Image", size: "3.8 MB", date: "Apr 26", emoji: "\u{1F5BC}\uFE0F" },
  { name: "API_Docs.pdf", type: "PDF", size: "5.6 MB", date: "Apr 25", emoji: "\u{1F4C4}" }
];
const initialProjects = [];
function priorityColor(p) {
  if (p === "High") return "bg-red-100 text-red-700 border border-red-200";
  if (p === "Medium") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-green-100 text-green-700 border border-green-200";
}
function priorityDot(p) {
  if (p === "High") return "bg-red-500";
  if (p === "Medium") return "bg-amber-500";
  return "bg-green-500";
}
function taskIcon(status) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />;
  if (status === "in-progress") return <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />;
  return <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />;
}
function fmtDate(d) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function nowTime() {
  return (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
const TODAY = /* @__PURE__ */ new Date();
function inThisWeek(d) {
  const dt = new Date(d);
  const diff = (dt.getTime() - TODAY.getTime()) / 864e5;
  return diff >= 0 && diff <= 7;
}
function inNextWeek(d) {
  const dt = new Date(d);
  const diff = (dt.getTime() - TODAY.getTime()) / 864e5;
  return diff > 7 && diff <= 14;
}
function inThisMonth(d) {
  const dt = new Date(d);
  return dt.getFullYear() === TODAY.getFullYear() && dt.getMonth() === TODAY.getMonth();
}
function inNextMonth(d) {
  const dt = new Date(d);
  const next = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 1);
  return dt.getFullYear() === next.getFullYear() && dt.getMonth() === next.getMonth();
}
function perfData(project) {
  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  if (tasks.length === 0) {
    return [
      { week: "W1", tasks: 0, completed: 0 },
      { week: "W2", tasks: 0, completed: 0 },
      { week: "W3", tasks: 0, completed: 0 },
      { week: "W4", tasks: 0, completed: 0 },
      { week: "W5", tasks: 0, completed: 0 }
    ];
  }

  // Real calculation based on task creation date or deadline
  const now = new Date();
  const weeks = ["W5", "W4", "W3", "W2", "W1"]; // Last 5 weeks
  
  return weeks.map((w, i) => {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - (i * 7));
    const weekStart = new Date(weekAgo);
    weekStart.setDate(weekStart.getDate() - 7);

    const weekTasks = tasks.filter(t => {
      const date = new Date(t.createdAt || t.assignDate || now);
      return date >= weekStart && date <= weekAgo;
    });

    const completed = weekTasks.filter(t => {
      const s = String(t.status).toLowerCase();
      return s === "done" || s === "completed";
    }).length;

    return { week: w, tasks: weekTasks.length, completed };
  }).reverse();
}
function TickIcon({ status }) {
  if (status === "sent") {
    return <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="inline-block ml-1 flex-shrink-0">
        <path d="M1 5l4 4 8-8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>;
  }
  if (status === "delivered") {
    return <svg width="18" height="10" viewBox="0 0 18 10" fill="none" className="inline-block ml-1 flex-shrink-0">
        <path d="M1 5l4 4 8-8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 5l4 4 8-8" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>;
  }
  return <svg width="18" height="10" viewBox="0 0 18 10" fill="none" className="inline-block ml-1 flex-shrink-0">
      <path d="M1 5l4 4 8-8" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5l4 4 8-8" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>;
}
function AddEditProjectModal({ open, onClose, onSave, mode = "create", initialData, memberOptions, teamLeadOptions }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    client: "",
    teamLead: "",
    priority: "Medium",
    assignDate: "",
    deadline: ""
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (open && initialData) {
      setForm({
        title: initialData.title || "",
        description: initialData.description || "",
        client: initialData.client || "",
        teamLead: initialData.teamLead || "",
        priority: initialData.priority || "Medium",
        assignDate: initialData.assignDate || "",
        deadline: initialData.deadline || ""
      });
      setSelectedMembers(initialData.members || []);
    } else if (open && mode === "create") {
      setForm({ title: "", description: "", client: "", teamLead: "", priority: "Medium", assignDate: "", deadline: "" });
      setSelectedMembers([]);
    }
  }, [open, mode, initialData]);
  const change = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const toggleMember = (name) => setSelectedMembers((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  const availableMembers = memberOptions ?? [];
  const filteredEmployees = availableMembers.filter(
    (e) => e.toLowerCase().includes(memberSearch.toLowerCase()) && !selectedMembers.includes(e)
  );
  const handleSave = () => {
    if (!form.title.trim()) {
      showToast("Project title is required.", "error");
      return;
    }
    onSave({ ...form, selectedMemberNames: selectedMembers });
    onClose();
  };
  return <Dialog open={open} onOpenChange={(v) => {
    if (!v) onClose();
  }}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Project Title <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. CRM System Upgrade" value={form.title} onChange={(e) => change("title", e.target.value)} className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea placeholder="Brief project overview…" rows={3} value={form.description} onChange={(e) => change("description", e.target.value)} className="rounded-xl border-gray-200 focus-visible:ring-[#162E93] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Client</Label>
              <Input placeholder="Client name" value={form.client} onChange={(e) => change("client", e.target.value)} className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Team Lead Name</Label>
              <Input
    list="project-teamlead-options"
    placeholder="e.g. Jane Smith"
    value={form.teamLead}
    onChange={(e) => change("teamLead", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              <datalist id="project-teamlead-options">
                {(teamLeadOptions ?? []).map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Priority</Label>
            <div className="flex gap-2">
              {["High", "Medium", "Low"].map((p) => <button
    key={p}
    onClick={() => change("priority", p)}
    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.priority === p ? p === "High" ? "bg-red-100 border-red-400 text-red-700" : p === "Medium" ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-green-100 border-green-400 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
  >
                  <Flag className="h-3.5 w-3.5 inline mr-1" />{p}
                </button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Assign Date</Label>
              <Input type="date" value={form.assignDate} onChange={(e) => change("assignDate", e.target.value)} className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Deadline</Label>
              <Input type="date" value={form.deadline} onChange={(e) => change("deadline", e.target.value)} className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]" />
            </div>
          </div>
          <div className="space-y-2.5 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#162E93]" />
              <Label className="text-sm font-semibold text-gray-700">Add Members</Label>
              {selectedMembers.length > 0 && <span className="ml-auto text-xs text-[#162E93] font-semibold bg-[#162E93]/8 px-2 py-0.5 rounded-lg">
                  {selectedMembers.length} selected
                </span>}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
    value={memberSearch}
    onChange={(e) => setMemberSearch(e.target.value)}
    placeholder="Search employees…"
    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
  />
            </div>
            {selectedMembers.length > 0 && <div className="flex flex-wrap gap-1.5 p-3 bg-[#162E93]/4 rounded-xl border border-[#162E93]/10 min-h-[44px]">
                {selectedMembers.map((m) => <span key={m} className="flex items-center gap-1 px-2 py-1 bg-[#162E93] text-white rounded-lg text-xs font-medium">
                    {m}
                    <button onClick={() => toggleMember(m)} className="hover:bg-white/20 rounded p-0.5 transition-colors flex-shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </span>)}
              </div>}
            {memberSearch && filteredEmployees.length > 0 && <div className="border border-gray-100 rounded-xl max-h-36 overflow-y-auto bg-white shadow-sm">
                {filteredEmployees.map((emp) => <button
    key={emp}
    onClick={() => {
      toggleMember(emp);
      setMemberSearch("");
    }}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-[#162E93]/5 transition-colors text-left"
  >
                    <div className="w-6 h-6 rounded-lg bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold text-[#162E93]">{emp.split(" ").map((w) => w[0]).join("")}</span>
                    </div>
                    {emp}
                  </button>)}
              </div>}
            {memberSearch && filteredEmployees.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No matching employees found.</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={onClose}><X className="h-4 w-4 mr-2" />Cancel</Button>
            <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white" onClick={handleSave}>
              {mode === "create" ? <Plus className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {mode === "create" ? "Create Project" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
function ViewDetailsModal({ project, onClose }) {
  const pct = Math.round(project.completedTasks / Math.max(project.totalTasks, 1) * 100);
  return <Dialog open onOpenChange={(v) => {
    if (!v) onClose();
  }}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">{project.title}</DialogTitle>
              <p className="text-sm text-gray-500 mt-0.5">Client: <span className="font-medium text-gray-700">{project.client || "\u2014"}</span></p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${priorityColor(project.priority)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityDot(project.priority)}`} />{project.priority} Priority
            </span>
          </div>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 leading-relaxed">{project.description || "No description provided."}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
    { label: "Team Lead", value: project.teamLead, icon: <Users className="h-4 w-4 text-[#162E93]" /> },
    { label: "Active Members", value: `${project.activeMembers} members`, icon: <Users className="h-4 w-4 text-[#088395]" /> },
    { label: "Assign Date", value: fmtDate(project.assignDate), icon: <Calendar className="h-4 w-4 text-gray-400" /> },
    { label: "Deadline", value: fmtDate(project.deadline), icon: <Calendar className="h-4 w-4 text-red-400" /> },
    { label: "Total Tasks", value: `${project.completedTasks} / ${project.totalTasks}`, icon: <BarChart3 className="h-4 w-4 text-gray-400" /> },
    { label: "Progress", value: `${pct}%`, icon: <Activity className="h-4 w-4 text-green-500" /> }
  ].map((item) => <div key={item.label} className="flex items-start gap-2.5 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                </div>
              </div>)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-semibold text-gray-900">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2.5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Team Members</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {project.members.map((m, i) => <Avatar key={i} className="h-9 w-9 rounded-xl border-2 border-white shadow-sm">
                  <AvatarFallback className="rounded-xl bg-[#162E93]/10 text-[#162E93] text-xs font-bold">{m}</AvatarFallback>
                </Avatar>)}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Task Breakdown</p>
            <div className="space-y-2">
              {project.tasks.map((task) => <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
                  {taskIcon(task.status)}
                  <span className={`flex-1 text-sm ${task.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>{task.title}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{task.assignee}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${task.status === "done" ? "bg-green-100 text-green-700" : task.status === "in-progress" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                    {task.status === "in-progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
function ManageModal({ project, onClose, onChatUpdate }) {
  const [tab, setTab] = useState("performance");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(project.chat ?? []);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [activeMsgMenu, setActiveMsgMenu] = useState(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [recentMediaOpen, setRecentMediaOpen] = useState(false);
  const scrollRef = useRef(null);
  const recordRef = useRef(null);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      recordRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } else {
      if (recordRef.current) clearInterval(recordRef.current);
      setRecordSeconds(0);
    }
    return () => { if (recordRef.current) clearInterval(recordRef.current); };
  }, [isRecording]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);
  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    const user = getCurrentUser();
    const msgId = Date.now();
    const newMsg = {
      id: msgId,
      sender: user?.name || "You",
      avatar: user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ME",
      content: text,
      time: nowTime(),
      isSelf: true,
      tickStatus: "sent"
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    onChatUpdate(project.id, updated);
    setChatInput("");
    setEmojiPickerOpen(false);
    
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, tickStatus: "delivered" } : m));
    }, 800);
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, tickStatus: "seen" } : m));
    }, 1800);
  };

  const stopRecording = () => {
    setIsRecording(false);
    const user = getCurrentUser();
    const newMsg = {
      id: Date.now(),
      sender: user?.name || "You",
      avatar: user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ME",
      content: `🎤 Voice message (${Math.floor(recordSeconds / 60)}:${(recordSeconds % 60).toString().padStart(2, "0")})`,
      time: nowTime(),
      isSelf: true,
      tickStatus: "sent"
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    onChatUpdate(project.id, updated);
  };

  const addReaction = (msgId, emoji) => {
    const updated = messages.map(m => {
      if (m.id !== msgId) return m;
      const reactions = m.reactions || [];
      const existing = reactions.find(r => r.emoji === emoji);
      const newReactions = existing 
        ? reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
        : [...reactions, { emoji, count: 1 }];
      return { ...m, reactions: newReactions };
    });
    setMessages(updated);
    onChatUpdate(project.id, updated);
    setActiveMsgMenu(null);
  };

  const handleSendPoll = () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.filter(o => o.trim());
    if (!q || opts.length < 2) {
      showToast("Question and at least 2 options are required", "error");
      return;
    }
    const user = getCurrentUser();
    const pollContent = `📊 **Poll**: ${q}\n${opts.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
    const newMsg = {
      id: Date.now(),
      sender: user?.name || "You",
      avatar: user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ME",
      content: pollContent,
      time: nowTime(),
      isSelf: true,
      tickStatus: "sent"
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    onChatUpdate(project.id, updated);
    setPollOpen(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    showToast("Poll sent!", "success");
  };

  const handleFileSelected = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const user = getCurrentUser();
    const emoji = type === "media" ? "📸" : "📄";
    const newMsg = {
      id: Date.now(),
      sender: user?.name || "You",
      avatar: user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ME",
      content: `${emoji} ${file.name}`,
      time: nowTime(),
      isSelf: true,
      tickStatus: "sent"
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    onChatUpdate(project.id, updated);
    showToast(`${file.name} sent!`, "success");
    e.target.value = "";
  };
  return <Dialog open onOpenChange={(v) => {
    if (!v) onClose();
  }}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col p-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4 text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{project.title}</h2>
              <p className="text-xs text-gray-500">Management Panel</p>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
    onClick={() => setTab("performance")}
    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "performance" ? "bg-white text-[#162E93] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
  >
              Performance
            </button>
            <button
    onClick={() => setTab("chat")}
    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === "chat" ? "bg-white text-[#162E93] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
  >
              Chat
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab === "performance" && <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
    { label: "Goal Completed", value: `${Math.round((project.completedTasks / Math.max(1, project.totalTasks)) * 100)}%`, icon: <Target className="h-4 w-4" />, color: "text-[#162E93] bg-[#162E93]/10" },
    { label: "Total Tasks", value: project.totalTasks, icon: <BarChart3 className="h-4 w-4" />, color: "text-[#088395] bg-[#088395]/10" },
    { label: "Accuracy", value: `${Math.min(100, Math.round((project.completedTasks / Math.max(1, project.totalTasks)) * 105))}%`, icon: <TrendingUp className="h-4 w-4" />, color: "text-green-600 bg-green-100" },
    { label: "Operational Hrs", value: `${project.totalTasks * 4}h`, icon: <Clock className="h-4 w-4" />, color: "text-amber-600 bg-amber-100" },
    { label: "Active Persons", value: project.members?.length || 0, icon: <Users className="h-4 w-4" />, color: "text-purple-600 bg-purple-100" },
    { label: "Tasks Done", value: project.completedTasks, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-100" }
  ].map((m) => <div key={m.label} className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${m.color}`}>{m.icon}</div>
                    <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                  </div>)}
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-800 mb-4">Weekly Task Performance</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={perfData(project)} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="tasks" name="Assigned" fill="#162E93" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#088395" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>}
          {tab === "chat" && <div className="flex flex-col" style={{ minHeight: "440px" }}>
              <div
    ref={scrollRef}
    className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/60"
    style={{ maxHeight: "380px" }}
  >
                {messages.map((msg) => <div
    key={msg.id}
    className={`flex items-end gap-2 ${msg.isSelf ? "flex-row-reverse" : "flex-row"}`}
  >
                    {!msg.isSelf && <Avatar className="h-8 w-8 rounded-xl flex-shrink-0">
                        <AvatarFallback className="rounded-xl bg-gray-200 text-gray-700 text-xs font-bold">
                          {msg.avatar}
                        </AvatarFallback>
                      </Avatar>}
                    <div className={`max-w-[68%] flex flex-col gap-0.5 ${msg.isSelf ? "items-end" : "items-start"}`}>
                      {!msg.isSelf && <p className="text-[11px] text-gray-500 px-1 font-medium">{msg.sender}</p>}
                      <div className={`group relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.isSelf ? "bg-[#162E93] text-white rounded-br-sm" : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-sm"}`}>
                        {msg.content}
                        <button 
                          onClick={() => setActiveMsgMenu(activeMsgMenu === msg.id ? null : msg.id)}
                          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10 ${msg.isSelf ? "-left-8" : "-right-8 text-gray-400"}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {activeMsgMenu === msg.id && (
                          <div className={`absolute z-10 bottom-full mb-2 p-1 bg-white rounded-xl shadow-xl border border-gray-100 flex gap-1 ${msg.isSelf ? "right-0" : "left-0"}`}>
                            {["👍", "❤️", "😂", "😮"].map(e => (
                              <button key={e} onClick={() => addReaction(msg.id, e)} className="hover:scale-125 transition-transform p-1">
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.reactions?.length > 0 && (
                        <div className={`flex gap-1 mt-1 ${msg.isSelf ? "justify-end" : "justify-start"}`}>
                          {msg.reactions.map((r, ri) => (
                            <span key={ri} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white border border-gray-100 shadow-sm text-[10px]">
                              {r.emoji} {r.count}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={`flex items-center gap-0.5 px-1 ${msg.isSelf ? "flex-row-reverse" : "flex-row"}`}>
                        <p className="text-[10px] text-gray-400">{msg.time}</p>
                        {msg.isSelf && msg.tickStatus && <TickIcon status={msg.tickStatus} />}
                      </div>
                    </div>
                  </div>)}
              </div>
              <div className="border-t border-gray-100 p-4 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachMenuOpen(!attachMenuOpen);
                        setEmojiPickerOpen(false);
                      }}
                      className={`p-2 rounded-xl transition-colors ${attachMenuOpen ? "bg-[#162E93] text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    {attachMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1 z-50">
                        <button 
                          onClick={() => { mediaInputRef.current?.click(); setAttachMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          <ImageIcon className="h-4 w-4 text-[#088395]" />
                          <div className="text-left">
                            <p className="font-semibold text-xs">Media</p>
                            <p className="text-[10px] text-gray-400">Photos & Videos</p>
                          </div>
                        </button>
                        <button 
                          onClick={() => { docInputRef.current?.click(); setAttachMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div className="text-left">
                            <p className="font-semibold text-xs">Document</p>
                            <p className="text-[10px] text-gray-400">PDF / Doc / Sheet</p>
                          </div>
                        </button>
                        <div className="my-1 border-t border-gray-50" />
                        <button 
                          onClick={() => { setPollOpen(true); setAttachMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          <BarChart2 className="h-4 w-4 text-[#162E93]" />
                          <div className="text-left">
                            <p className="font-semibold text-xs">Poll</p>
                            <p className="text-[10px] text-gray-400">Create a poll</p>
                          </div>
                        </button>
                        <button 
                          onClick={() => { setRecentMediaOpen(true); setAttachMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          <Clock className="h-4 w-4 text-amber-500" />
                          <div className="text-left">
                            <p className="font-semibold text-xs">Recent Media</p>
                            <p className="text-[10px] text-gray-400">Recently shared</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  <input type="file" ref={mediaInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileSelected(e, "media")} />
                  <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" onChange={(e) => handleFileSelected(e, "document")} />

                  <Input
                    placeholder="Type a message…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-[#162E93]"
                  />
                  <button 
                    onClick={() => {
                      if (isRecording) stopRecording();
                      else setIsRecording(true);
                    }}
                    className={`p-2 rounded-xl transition-colors ${isRecording ? "bg-red-50 text-red-500 animate-pulse" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"}`}
                  >
                    <Mic className="h-5 w-5" />
                  </button>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEmojiPickerOpen(!emojiPickerOpen);
                        setAttachMenuOpen(false);
                      }}
                      className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {emojiPickerOpen && (
                      <div className="absolute bottom-full right-0 mb-2 p-2 bg-white rounded-xl shadow-2xl border border-gray-100 grid grid-cols-5 gap-1 w-48 max-h-48 overflow-y-auto z-50">
                        {EMOJIS.map(e => (
                          <button key={e} onClick={() => { setChatInput(p => p + e); setEmojiPickerOpen(false); }} className="hover:bg-gray-50 p-1.5 rounded-lg text-lg">
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={sendMessage}
                    className="w-10 h-10 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] flex items-center justify-center transition-colors shadow-sm"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </div>}
        </div>

        {/* Poll Modal */}
        <Dialog open={pollOpen} onOpenChange={setPollOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-[#162E93]" />Create a Poll
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Question</Label>
                <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Ask a question…" className="rounded-xl h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Options</Label>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={opt} onChange={(e) => setPollOptions(p => p.map((o, j) => j === i ? e.target.value : o))} placeholder={`Option ${i+1}`} className="rounded-xl h-9" />
                    {pollOptions.length > 2 && <button onClick={() => setPollOptions(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="h-4 w-4" /></button>}
                  </div>
                ))}
                {pollOptions.length < 5 && <button onClick={() => setPollOptions(p => [...p, ""])} className="text-[#162E93] text-sm hover:underline">+ Add Option</button>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setPollOpen(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8]" onClick={handleSendPoll}>Send Poll</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recent Media Modal */}
        <Dialog open={recentMediaOpen} onOpenChange={setRecentMediaOpen}>
          <DialogContent className="sm:max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#088395]" />Recent Media
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {RECENT_MEDIA.map((file, i) => (
                <button key={i} onClick={() => { showToast(`Opening ${file.name}...`, "info"); setRecentMediaOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all text-left">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl">{file.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{file.type} • {file.size}</p>
                  </div>
                  <Share2 className="h-4 w-4 text-gray-300" />
                </button>
              ))}
              <Button variant="outline" className="w-full rounded-xl mt-2" onClick={() => setRecentMediaOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>;
}
const DEADLINE_LABELS = {
  "all": "All Deadlines",
  "this-week": "This Week",
  "next-week": "Next Week",
  "this-month": "This Month",
  "next-month": "Next Month"
};
const PRIORITY_LABELS = {
  "all": "All Priorities",
  "High": "High Priority",
  "Medium": "Medium Priority",
  "Low": "Low Priority"
};

function initialsFromName(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function mapProject(project) {
  const id = project.id ?? project._id;
  if (!id) {
    return null;
  }

  const rawTasks = Array.isArray(project.tasks) ? project.tasks : [];
  const tasks = rawTasks.map(t => ({
    ...t,
    id: t.id ?? t._id,
    assignee: typeof t.assignee === "object" ? (t.assignee.name ?? "Someone") : (t.assignee ?? "Someone")
  }));

  const completedTasks = tasks.filter((task) => {
    const status = String(task.status ?? "").toLowerCase();
    return status === "done" || status === "completed";
  }).length;
  const totalTasks = tasks.length;
  const selectedMemberNames = Array.isArray(project.selectedMemberNames) ? project.selectedMemberNames : [];

  // Handle populated teamLead object
  const teamLeadVal = project.teamLead;
  const teamLeadName = typeof teamLeadVal === "object" ? (teamLeadVal.name ?? "") : (teamLeadVal ?? "");

  // Handle populated members array
  let members = [];
  if (Array.isArray(project.members) && project.members.length > 0) {
    members = project.members.map(m => typeof m === "object" ? (m.name ?? "") : m);
  } else {
    members = selectedMemberNames.map(initialsFromName);
  }

  return {
    ...project,
    id,
    title: project.title ?? project.name ?? "",
    description: project.description ?? "",
    client: project.client ?? "",
    teamLead: teamLeadName,
    priority: project.priority ?? "Medium",
    assignDate: project.assignDate ?? "",
    deadline: project.deadline ?? "",
    tasks,
    chat: Array.isArray(project.chat) ? project.chat : [],
    selectedMemberNames,
    members: members.map(initialsFromName), // Ensure initials for avatars
    rawMemberNames: members, // Keep full names for other uses
    activeMembers: Number(project.activeMembers ?? members.length ?? 0),
    totalTasks,
    completedTasks,
    goalCompleted: Number(
      project.goalCompleted ?? (totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0),
    ),
  };
}
function Projects() {
  const userRole = getCurrentRole();
  const [projects, setProjects] = useState(initialProjects);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewProject, setViewProject] = useState(null);
  const [manageProject, setManageProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const displayProjects = projects;

  const memberOptions = users
    .filter((user) => String(user.role ?? "").toLowerCase() !== "admin")
    .map((user) => user.name)
    .filter(Boolean);
  const teamLeadOptions = users
    .filter((user) => {
      const role = String(user.role ?? "").toLowerCase();
      return role === "teamlead" || role === "admin";
    })
    .map((user) => user.name)
    .filter(Boolean);

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      try {
        const [projectData, userData] = await Promise.all([fetchProjects(), fetchUsers()]);
        if (mounted) {
          const mappedProjects = projectData.map(mapProject).filter(Boolean);
          setProjects(mappedProjects);
          setUsers(userData ?? []);
        }
      } catch {
        if (mounted) {
          setProjects([]);
          setUsers([]);
        }
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const handleEditProject = async (data) => {
    if (!editProject) return;
    try {
      const savedProject = await updateProjectApi(editProject.id, {
        ...data,
        teamMembers: data.selectedMemberNames,
      });
      const mapped = mapProject(savedProject);
      if (mapped) {
        setProjects((prev) => prev.map(p => p.id === editProject.id ? mapped : p));
      }
      setEditOpen(false);
      setEditProject(null);
      showToast(`"${data.title}" has been updated.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to update project.", "error");
    }
  };

  const handleCreateProject = async (data) => {
    try {
      const savedProject = await createProjectApi({
        ...data,
        selectedMemberNames: data.selectedMemberNames,
        teamMembers: data.selectedMemberNames,
      });
      const mapped = mapProject(savedProject);
      if (mapped) {
        setProjects((prev) => [mapped, ...prev]);
      }
      setCreateOpen(false);
      showToast(`"${data.title}" has been created.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to create project.", "error");
    }
  };
  const handleChatUpdate = (id, msgs) => {
    setProjects((prev) => {
      const next = prev.map((p) => p.id === id ? { ...p, chat: msgs } : p);
      const updated = next.find((project) => project.id === id);
      if (updated) {
        updateProjectApi(id, { ...updated, chat: msgs }).catch(() => {});
      }
      return next;
    });

    if (manageProject?.id === id) {
      setManageProject((prev) => prev ? { ...prev, chat: msgs } : prev);
    }
  };
  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    try {
      await deleteProjectApi(deleteProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
      showToast(`"${deleteProject.title}" has been deleted.`, "success");
      setDeleteProject(null);
    } catch (error) {
      showToast(error.message || "Unable to delete project.", "error");
    }
  };
  const filtered = displayProjects.filter((p) => {
    const matchSearch = !searchQuery.trim() || p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDeadline = deadlineFilter === "all" ? true : deadlineFilter === "this-week" ? inThisWeek(p.deadline) : deadlineFilter === "next-week" ? inNextWeek(p.deadline) : deadlineFilter === "this-month" ? inThisMonth(p.deadline) : inNextMonth(p.deadline);
    const matchPriority = priorityFilter === "all" || p.priority === priorityFilter;
    return matchSearch && matchDeadline && matchPriority;
  });
  const hasActiveFilters = deadlineFilter !== "all" || priorityFilter !== "all" || !!searchQuery.trim();
  return <AppLayout userRole={userRole}>
      <div className="space-y-6">

        {
    /* ── Header ── */
  }
        <div className="flex items-center justify-between">
          <div>
            <h1>Projects</h1>
            <p className="text-muted-foreground">Manage your projects</p>
          </div>
          {userRole === "admin" && <Button
    className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2"
    onClick={() => setCreateOpen(true)}
  >
              <Plus className="h-4 w-4" />
              New Project
            </Button>}
        </div>

        {
    /* ── Search ── */
  }
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
    placeholder="Search by project title…"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 rounded-xl border-gray-200 bg-white"
  />
          {searchQuery && <button
    onClick={() => setSearchQuery("")}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
  >
              <X className="h-4 w-4" />
            </button>}
        </div>

        {
    /* ── Filter Dropdowns ── */
  }
        <div className="flex items-center gap-3 flex-wrap">

          {
    /* Deadline Dropdown */
  }
          <div className="relative">
            <button
    onClick={() => {
      setDeadlineOpen((o) => !o);
      setPriorityOpen(false);
    }}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${deadlineFilter !== "all" ? "bg-[#162E93] text-white border-[#162E93] shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:border-[#162E93]/40 hover:text-[#162E93]"}`}
  >
              <Calendar className="h-3.5 w-3.5" />
              {DEADLINE_LABELS[deadlineFilter]}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${deadlineOpen ? "rotate-180" : ""}`} />
            </button>

            {deadlineOpen && <>
                <div className="fixed inset-0 z-10" onClick={() => setDeadlineOpen(false)} />
                <div className="absolute top-full mt-1.5 left-0 z-20 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden min-w-[170px]">
                  {["all", "this-week", "next-week", "this-month", "next-month"].map((opt) => <button
    key={opt}
    onClick={() => {
      setDeadlineFilter(opt);
      setDeadlineOpen(false);
    }}
    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 ${deadlineFilter === opt ? "text-[#162E93] font-semibold bg-[#162E93]/5" : "text-gray-700"}`}
  >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${deadlineFilter === opt ? "bg-[#162E93]" : "bg-transparent"}`} />
                      {DEADLINE_LABELS[opt]}
                    </button>)}
                </div>
              </>}
          </div>

          {
    /* Priority Dropdown */
  }
          <div className="relative">
            <button
    onClick={() => {
      setPriorityOpen((o) => !o);
      setDeadlineOpen(false);
    }}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${priorityFilter === "High" ? "bg-red-600   text-white border-red-600   shadow-sm" : priorityFilter === "Medium" ? "bg-amber-500 text-white border-amber-500 shadow-sm" : priorityFilter === "Low" ? "bg-green-600 text-white border-green-600 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:border-[#162E93]/40 hover:text-[#162E93]"}`}
  >
              <Flag className="h-3.5 w-3.5" />
              {PRIORITY_LABELS[priorityFilter]}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${priorityOpen ? "rotate-180" : ""}`} />
            </button>

            {priorityOpen && <>
                <div className="fixed inset-0 z-10" onClick={() => setPriorityOpen(false)} />
                <div className="absolute top-full mt-1.5 left-0 z-20 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden min-w-[170px]">
                  {["all", "High", "Medium", "Low"].map((opt) => <button
    key={opt}
    onClick={() => {
      setPriorityFilter(opt);
      setPriorityOpen(false);
    }}
    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 ${priorityFilter === opt ? "font-semibold bg-gray-50" : "text-gray-700"}`}
  >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt === "High" ? "bg-red-500" : opt === "Medium" ? "bg-amber-500" : opt === "Low" ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className={opt === "High" ? "text-red-700" : opt === "Medium" ? "text-amber-700" : opt === "Low" ? "text-green-700" : "text-gray-600"}>
                        {PRIORITY_LABELS[opt]}
                      </span>
                    </button>)}
                </div>
              </>}
          </div>

          {
    /* Result count */
  }
          <span className="text-xs text-gray-400">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          </span>

          {
    /* Clear all filters */
  }
          {hasActiveFilters && <button
    onClick={() => {
      setDeadlineFilter("all");
      setPriorityFilter("all");
      setSearchQuery("");
    }}
    className="text-xs text-[#162E93] hover:underline flex items-center gap-1"
  >
              <X className="h-3 w-3" /> Clear filters
            </button>}
        </div>

        {
    /* ── Project Cards ── */
  }
        {filtered.length === 0 ? <div className="text-center py-20 text-gray-400">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No projects match your current filters.</p>
            <button
    onClick={() => {
      setSearchQuery("");
      setDeadlineFilter("all");
      setPriorityFilter("all");
    }}
    className="text-[#162E93] text-sm mt-2 hover:underline"
  >
              Clear filters
            </button>
          </div> : <div className="grid gap-5 md:grid-cols-2">
            {filtered.map((project) => {
    const pct = Math.round(project.completedTasks / Math.max(project.totalTasks, 1) * 100);
    return <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  {
      /* Priority accent bar */
    }
                  <div className={`h-1 w-full ${project.priority === "High" ? "bg-red-500" : project.priority === "Medium" ? "bg-amber-500" : "bg-green-500"}`} />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{project.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 text-sm">{project.description}</CardDescription>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${priorityColor(project.priority)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot(project.priority)}`} />
                        {project.priority}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">Lead:</span>
                        <span className="font-medium text-gray-800 text-xs truncate">{project.teamLead || "\u2014"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">Due:</span>
                        <span className="font-medium text-gray-800 text-xs">{fmtDate(project.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span className="text-xs">Tasks:</span>
                        <span className="font-medium text-gray-800 text-xs">{project.completedTasks}/{project.totalTasks}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">Client:</span>
                        <span className="font-medium text-gray-800 text-xs truncate">{project.client || "\u2014"}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-semibold text-gray-800">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {project.members.slice(0, 5).map((m, i) => <Avatar key={i} className="h-7 w-7 rounded-lg border-2 border-white -ml-1 first:ml-0">
                            <AvatarFallback className="rounded-lg bg-[#1A1953]/10 text-[#1A1953] text-[10px] font-bold">{m}</AvatarFallback>
                          </Avatar>)}
                        {project.members.length > 5 && <span className="ml-1 text-xs text-gray-400">+{project.members.length - 5}</span>}
                      </div>
                      <span className="text-xs text-gray-400">{project.activeMembers} active</span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-3 border-t border-gray-50">
                    <Button
      variant="outline"
      className="flex-1 rounded-xl border-gray-200 hover:border-[#162E93] hover:text-[#162E93] text-sm transition-colors gap-1.5"
      onClick={() => setViewProject(project)}
    >
                      <ChevronRight className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                    {userRole === "admin" && <>
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl border-gray-200 hover:border-[#162E93] hover:text-[#162E93] text-sm transition-colors gap-1.5"
                          onClick={() => { setEditProject(project); setEditOpen(true); }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
      className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white text-sm gap-1.5"
      onClick={() => setManageProject(project)}
    >
                          <Activity className="h-3.5 w-3.5" />
                          Manage
                        </Button>
                        <Button
      variant="outline"
      className="rounded-xl border-gray-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 px-2.5 transition-colors"
      onClick={() => setDeleteProject(project)}
      title="Delete Project"
    >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>}
                  </CardFooter>
                </Card>;
  })}
          </div>}
      </div>

      {
    /* ── Modals ── */
  }
      <AddEditProjectModal
    open={createOpen}
    onClose={() => setCreateOpen(false)}
    onSave={handleCreateProject}
    mode="create"
    memberOptions={memberOptions}
    teamLeadOptions={teamLeadOptions}
  />
      <AddEditProjectModal
    open={editOpen}
    onClose={() => { setEditOpen(false); setEditProject(null); }}
    onSave={handleEditProject}
    mode="edit"
    initialData={editProject}
    memberOptions={memberOptions}
    teamLeadOptions={teamLeadOptions}
  />
      {viewProject && <ViewDetailsModal project={viewProject} onClose={() => setViewProject(null)} />}
      {manageProject && <ManageModal
    project={manageProject}
    onClose={() => setManageProject(null)}
    onChatUpdate={handleChatUpdate}
  />}
      <DeleteConfirmModal
    open={!!deleteProject}
    title="Delete Project"
    itemName={deleteProject?.title}
    onConfirm={handleDeleteProject}
    onCancel={() => setDeleteProject(null)}
  />
    </AppLayout>;
}
export {
  Projects as default
};
