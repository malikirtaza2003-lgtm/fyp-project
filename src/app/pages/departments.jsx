import { useEffect, useState } from "react";
import { getCurrentRole } from "../utils/auth";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Progress } from "../components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import {
  Plus,
  Users,
  CheckSquare,
  Clock,
  Search,
  X,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Activity,
  ArrowLeft,
  Trash2,
  Building2,
  User,
  LayoutGrid,
  BarChart3,
  Target
} from "lucide-react";
import { showToast } from "../utils/toast";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";
import { getCurrentUser } from "../utils/auth";
import { createDepartment as createDepartmentApi, deleteDepartment as deleteDepartmentApi, fetchDepartments, fetchUsers } from "../utils/api";
const initialDepartments = [];
function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function completionRate(dept) {
  const total = dept.completedTasks + dept.pendingTasks;
  return total > 0 ? Math.round(dept.completedTasks / total * 100) : 0;
}

function mapDepartment(department) {
  const members = Array.isArray(department.members) ? department.members : [];
  const leadName = typeof department.lead === "object" && department.lead
    ? department.lead.name ?? ""
    : typeof department.lead === "string"
      ? department.lead
      : "";

  const memberNames = members
    .map((member) => (typeof member === "object" ? member.name : ""))
    .filter(Boolean);

  return {
    id: department.id ?? department._id ?? Date.now(),
    name: department.name ?? "",
    lead: leadName || "Unassigned",
    members: members.length,
    assignedProjects: Number(department.assignedProjects ?? 0),
    completedTasks: Number(department.completedTasks ?? 0),
    pendingTasks: Number(department.pendingTasks ?? 0),
    avatar: getInitials(leadName || department.name || "DP"),
    activeProjects: Number(department.activeProjects ?? 0),
    description:
      department.description ??
      `${department.name ?? "Department"} department managed by ${leadName || "TBD"}.`,
    memberRefs: memberNames,
    leadRef: leadName || "",
  };
}
function AddEditDeptModal({ open, onClose, onSave, mode = "create", initialData, memberOptions, leadOptions }) {
  const [form, setForm] = useState({ name: "", lead: "", assignedProjects: "" });
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (open && initialData) {
      setForm({
        name: initialData.name || "",
        lead: initialData.leadRef || initialData.lead || "",
        assignedProjects: String(initialData.assignedProjects || "0")
      });
      setSelectedMembers(initialData.memberRefs || []);
    } else if (open && mode === "create") {
      setForm({ name: "", lead: "", assignedProjects: "" });
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
    if (!form.name.trim()) {
      showToast("Department name is required.", "error");
      return;
    }
    onSave({
      name: form.name,
      lead: form.lead,
      members: selectedMembers.length || 0,
      membersList: selectedMembers,
      assignedProjects: parseInt(form.assignedProjects) || 0
    });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-8 bg-white space-y-8">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#162E93] to-[#1A1953] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#162E93]/20">
              {form.name ? form.name.charAt(0).toUpperCase() : "D"}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                {mode === "create" ? "Create New Department" : "Edit Department"}
              </DialogTitle>
              <p className="text-xs font-bold text-[#088395] uppercase tracking-wider">Configure Organizational Unit</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dept Name */}
          <div className="space-y-2">
            <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Department Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Human Resources"
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-[#162E93] font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Lead Selection */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Department Lead</Label>
              <select
                value={form.lead}
                onChange={(e) => change("lead", e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/20 appearance-none"
              >
                <option value="">Select Leader</option>
                {(leadOptions ?? []).map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            {/* Assigned Projects */}
            <div className="space-y-2">
              <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Assigned Projects</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={form.assignedProjects}
                onChange={(e) => change("assignedProjects", e.target.value)}
                className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus-visible:ring-[#162E93] font-semibold"
              />
            </div>
          </div>

          {/* Member Selection Section */}
          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-[#162E93]" /> Add Members
              </p>
              {selectedMembers.length > 0 && (
                <span className="text-[10px] font-black text-[#162E93] bg-[#162E93]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedMembers.length} selected
                </span>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Find employees..."
                className="pl-11 h-12 rounded-2xl border-gray-100 bg-gray-50/50"
              />
            </div>

            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 bg-gray-50/30 rounded-2xl border border-dashed border-gray-200">
                {selectedMembers.map((m) => (
                  <Badge key={m} className="bg-[#162E93] text-white hover:bg-[#162E93] border-none font-bold rounded-xl px-3 py-1.5 flex items-center gap-2 pr-1.5">
                    <span className="text-[10px]">{m}</span>
                    <button onClick={() => toggleMember(m)} className="p-0.5 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {memberSearch && filteredEmployees.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto p-2 space-y-1">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp}
                    onClick={() => { toggleMember(emp); setMemberSearch(""); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#162E93]/5 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400 group-hover:bg-[#162E93] group-hover:text-white transition-colors">
                      {emp.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{emp}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-gray-400 italic">
              Total member count will be updated automatically based on selection.
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex gap-4 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-2xl border-gray-100 font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-900 active:scale-95 transition-all"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 h-12 rounded-2xl bg-[#162E93] hover:shadow-lg hover:shadow-[#162E93]/20 text-white font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
              onClick={handleSave}
            >
              {mode === "create" ? "Initialize Department" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function ViewDetailsModal({ dept, onClose }) {
  const rate = completionRate(dept);
  const totalTasks = dept.completedTasks + dept.pendingTasks;
  
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 rounded-xl">
                <AvatarFallback className="rounded-xl bg-[#162E93]/10 text-[#162E93] font-bold text-lg">
                  {dept.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900">{dept.name}</DialogTitle>
                <p className="text-sm text-gray-500 mt-0.5">Led by <span className="font-medium text-gray-700">{dept.lead}</span></p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-700 border border-green-200 font-semibold rounded-full px-3 py-1 text-xs">
              Active
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 leading-relaxed">{dept.description || "No description provided for this department."}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Members", value: `${dept.members} staff`, icon: <Users className="h-4 w-4 text-[#162E93]" /> },
              { label: "Active Projects", value: dept.activeProjects, icon: <LayoutGrid className="h-4 w-4 text-[#088395]" /> },
              { label: "Total Tasks", value: totalTasks, icon: <BarChart3 className="h-4 w-4 text-gray-400" /> },
              { label: "Completed", value: dept.completedTasks, icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
              { label: "Pending", value: dept.pendingTasks, icon: <Clock className="h-4 w-4 text-orange-400" /> },
              { label: "Efficiency", value: `${rate}%`, icon: <Activity className="h-4 w-4 text-purple-500" /> }
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2.5 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Task Completion Progress</span>
              <span className="font-semibold text-gray-900">{rate}%</span>
            </div>
            <Progress value={rate} className="h-2.5" />
          </div>

          {dept.memberRefs && dept.memberRefs.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Department Team</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {dept.memberRefs.map((m, i) => (
                  <Avatar key={i} className="h-9 w-9 rounded-xl border-2 border-white shadow-sm">
                    <AvatarFallback className="rounded-xl bg-[#162E93]/10 text-[#162E93] text-xs font-bold">
                      {m.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <Button
              variant="outline"
              className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 px-6"
              onClick={onClose}
            >
              Close Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function ManageModal({ dept, onClose }) {
  const rate = completionRate(dept);
  const totalTasks = dept.completedTasks + dept.pendingTasks;
  const chartData = [
    { week: "W1", completed: Math.round(dept.completedTasks * 0.15), pending: Math.round(dept.pendingTasks * 0.2) },
    { week: "W2", completed: Math.round(dept.completedTasks * 0.25), pending: Math.round(dept.pendingTasks * 0.15) },
    { week: "W3", completed: Math.round(dept.completedTasks * 0.2), pending: Math.round(dept.pendingTasks * 0.25) },
    { week: "W4", completed: Math.round(dept.completedTasks * 0.3), pending: Math.round(dept.pendingTasks * 0.1) },
    { week: "W5", completed: Math.round(dept.completedTasks * 0.1), pending: Math.round(dept.pendingTasks * 0.3) }
  ];

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col p-0 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-4 w-4 text-gray-500" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{dept.name} Management</h2>
              <p className="text-xs text-gray-500">Organizational Oversight</p>
            </div>
          </div>
          <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border border-green-100 font-semibold rounded-full px-3 py-1 text-[10px]">
            ACTIVE
          </Badge>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Completion", value: `${rate}%`, icon: <Target className="h-4 w-4" />, color: "text-[#162E93] bg-[#162E93]/10" },
              { label: "Total Tasks", value: totalTasks, icon: <BarChart3 className="h-4 w-4" />, color: "text-[#088395] bg-[#088395]/10" },
              { label: "Efficiency", value: `${Math.round(rate * 0.95)}%`, icon: <TrendingUp className="h-4 w-4" />, color: "text-green-600 bg-green-100" },
              { label: "Projects", value: dept.assignedProjects, icon: <LayoutGrid className="h-4 w-4" />, color: "text-purple-600 bg-purple-100" },
              { label: "Team Size", value: dept.members, icon: <Users className="h-4 w-4" />, color: "text-blue-600 bg-blue-100" },
              { label: "Done Tasks", value: dept.completedTasks, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-100" }
            ].map((m) => (
              <div key={m.label} className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${m.color}`}>{m.icon}</div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{m.value}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-2 uppercase tracking-wider">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Weekly Task Performance</p>
              <div className="flex items-center gap-3 text-[10px] font-medium">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <span>Done</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#f97316]" />
                  <span>Pending</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 11, fill: "#94a3b8" }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#94a3b8" }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    padding: "10px"
                  }} 
                />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="pending" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Workload Progress */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800 px-1">Resource Distribution</p>
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-5">
              {[
                { label: "Task Execution", value: dept.completedTasks, color: "bg-green-500", pct: rate },
                { label: "Active Project Load", value: dept.activeProjects, color: "bg-[#162E93]", pct: Math.round(dept.activeProjects / Math.max(dept.assignedProjects, 1) * 100) },
                { label: "Team Bandwidth", value: dept.members, color: "bg-purple-500", pct: 75 }
              ].map((w) => (
                <div key={w.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">{w.label}</span>
                    <span className="text-gray-900 font-bold">{w.pct}%</span>
                  </div>
                  <Progress value={w.pct} className="h-2 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Departments() {
  const userRole = getCurrentRole();
  const [departments, setDepartments] = useState(initialDepartments);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewDept, setViewDept] = useState(null);
  const [manageDept, setManageDept] = useState(null);
  const [deleteDept, setDeleteDept] = useState(null);
  const currentUser = getCurrentUser();
  const teamLeadDept = userRole === "teamlead" ? currentUser?.department ?? "" : "";
  const displayDepartments = userRole === "teamlead" && teamLeadDept
    ? departments.filter((d) => d.name === teamLeadDept)
    : departments;

  const memberOptions = users
    .filter((user) => String(user.role ?? "").toLowerCase() !== "admin")
    .map((user) => user.name)
    .filter(Boolean);
  const leadOptions = users
    .filter((user) => {
      const role = String(user.role ?? "").toLowerCase();
      return role === "teamlead" || role === "admin";
    })
    .map((user) => user.name)
    .filter(Boolean);
  const [editOpen, setEditOpen] = useState(false);
  const [editDept, setEditDept] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDepartments() {
      try {
        const [departmentData, userData] = await Promise.all([fetchDepartments(), fetchUsers()]);
        if (mounted) {
          setDepartments(departmentData.map(mapDepartment));
          setUsers(userData ?? []);
        }
      } catch {
        if (mounted) {
          setDepartments([]);
          setUsers([]);
        }
      }
    }

    loadDepartments();

    return () => {
      mounted = false;
    };
  }, []);
  const handleEdit = async (data) => {
    if (!editDept) return;
    try {
      const saved = await updateDepartmentApi(editDept.id, {
        name: data.name,
        lead: data.lead || undefined,
        members: data.membersList ?? [],
      });
      const mapped = mapDepartment(saved);
      if (mapped) {
        setDepartments((prev) => prev.map(d => d.id === editDept.id ? mapped : d));
      }
      setEditOpen(false);
      setEditDept(null);
      showToast(`"${data.name}" department updated.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to update department.", "error");
    }
  };

  const handleCreate = (data) => {
    createDepartmentApi({
      name: data.name,
      lead: data.lead || undefined,
      members: data.membersList ?? [],
    })
      .then((saved) => {
        const mapped = mapDepartment(saved);
        setDepartments((prev) => [mapped, ...prev]);
        setCreateOpen(false);
        showToast(`"${data.name}" department created.`, "success");
      })
      .catch((error) => {
        showToast(error.message || "Unable to create department.", "error");
      });
  };
  const handleDeleteDept = () => {
    if (!deleteDept) return;
    deleteDepartmentApi(deleteDept.id)
      .then(() => {
        setDepartments((prev) => prev.filter((d) => d.id !== deleteDept.id));
        showToast(`"${deleteDept.name}" department deleted.`, "success");
        setDeleteDept(null);
      })
      .catch((error) => {
        showToast(error.message || "Unable to delete department.", "error");
      });
  };
  const filtered = displayDepartments.filter(
    (d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.lead.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const performanceData = departments.map((d) => ({
    name: d.name,
    completed: d.completedTasks,
    pending: d.pendingTasks
  }));
  return <AppLayout userRole={userRole}>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Departments</h1>
            <p className="text-sm text-muted-foreground">Manage organization departments</p>
          </div>
          {userRole === "admin" && (
            <Button
              className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2 h-10 px-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Department
            </Button>
          )}
        </div>

        {/* ── Search ── */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by department name or leader…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-gray-200 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Department Grid ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Departments ({filtered.length})
            </h2>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed">
              <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No departments match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((dept) => {
                const rate = completionRate(dept);
                return (
                  <Card key={dept.id} className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col">
                    <CardHeader className="pb-3 pt-5 px-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-sm">
                            <AvatarFallback className="rounded-xl bg-[#162E93]/10 text-[#162E93] font-bold text-lg">
                              {dept.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base font-bold text-gray-900">{dept.name}</CardTitle>
                            <p className="text-xs text-gray-500">Led by {dept.lead}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-100 font-semibold rounded-full px-2 py-0.5 text-[10px]">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 px-5 pb-5 flex-1">
                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col">
                          <p className="text-[10px] text-gray-400 font-medium uppercase">Members</p>
                          <p className="text-sm font-bold text-gray-900">{dept.members}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] text-gray-400 font-medium uppercase">Projects</p>
                          <p className="text-sm font-bold text-gray-900">{dept.assignedProjects}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[10px] text-gray-400 font-medium uppercase">Pending</p>
                          <p className="text-sm font-bold text-gray-900">{dept.pendingTasks}</p>
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-gray-500">Task Completion</span>
                          <span className="text-gray-900 font-bold">{rate}%</span>
                        </div>
                        <Progress value={rate} className="h-2 rounded-full" />
                        <p className="text-[10px] text-gray-400 mt-1">
                          {dept.completedTasks} completed, {dept.pendingTasks} pending
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 mt-auto">
                        <Button
                          variant="outline"
                          className="flex-1 h-9 rounded-xl border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-all"
                          onClick={() => setViewDept(dept)}
                        >
                          View Details
                        </Button>
                        {userRole === "admin" && (
                          <>
                            <Button
                              variant="outline"
                              className="flex-1 h-9 rounded-xl border-gray-200 text-[#162E93] font-semibold text-xs hover:bg-[#162E93]/5 transition-all"
                              onClick={() => setManageDept(dept)}
                            >
                              Manage
                            </Button>
                            <Button
                              variant="outline"
                              className="w-9 h-9 p-0 rounded-xl border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
                              onClick={() => setDeleteDept(dept)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Department Performance Chart ── */}
        <Card className="border border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Department Performance</CardTitle>
                <CardDescription className="text-xs text-gray-500">Task completion across departments</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                  <span className="text-gray-600">Pending</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={performanceData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} 
                  axisLine={false} 
                  tickLine={false} 
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: "#64748b" }} 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: "12px", 
                    border: "none", 
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    padding: "12px"
                  }} 
                />
                <Bar 
                  dataKey="completed" 
                  fill="#22C55E" 
                  name="Completed" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
                <Bar 
                  dataKey="pending" 
                  fill="#F97316" 
                  name="Pending" 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>


      </div>

      {
    /* ── Modals ── */
  }
      <AddEditDeptModal
    open={createOpen}
    onClose={() => setCreateOpen(false)}
    onSave={handleCreate}
    mode="create"
    memberOptions={memberOptions}
    leadOptions={leadOptions}
  />
      <AddEditDeptModal
    open={editOpen}
    onClose={() => { setEditOpen(false); setEditDept(null); }}
    onSave={handleEdit}
    mode="edit"
    initialData={editDept}
    memberOptions={memberOptions}
    leadOptions={leadOptions}
  />
      {viewDept && <ViewDetailsModal dept={viewDept} onClose={() => setViewDept(null)} />}
      {manageDept && <ManageModal dept={manageDept} onClose={() => setManageDept(null)} />}
      <DeleteConfirmModal
    open={!!deleteDept}
    title="Delete Department"
    itemName={deleteDept?.name}
    onConfirm={handleDeleteDept}
    onCancel={() => setDeleteDept(null)}
  />
    </AppLayout>;
}
export {
  Departments as default
};
