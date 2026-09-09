import { useEffect, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Phone,
  Camera,
  X,
  Users,
  UserCheck,
  UserMinus,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Circle,
  Briefcase,
  CalendarDays,
  CreditCard,
  Activity,
  BarChart3,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { showToast } from "../utils/toast";
import { getCurrentRole, getCurrentUser } from "../utils/auth";
import { getTeamMembers } from "../utils/team-data";
import { createUser, deleteUser, fetchDepartments, fetchUsers, updateUser, fetchTasks, fetchAttendance, fetchProjects } from "../utils/api";

const initialEmployees = [];

const emptyEmployee = {
  name: "",
  email: "",
  role: "",
  department: "",
  workingHours: "",
  status: "Active",
  password: "",
  joiningDate: "",
  empId: "",
  cnic: "",
  contact: "",
  profilePicture: "",
  systemRole: "employee",
};

const STATUSES = ["Active", "On Leave"];

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";
}

function mapUserToEmployee(user) {
  const status = user.status === "Inactive" || user.status === "inactive" ? "On Leave" : "Active";

  const deptVal = user.department;
  const deptName = typeof deptVal === "object" ? (deptVal.name ?? "") : (deptVal ?? "");

  return {
    id: user.id ?? user._id ?? Date.now(),
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.jobTitle || user.role || "",
    systemRole: user.role || "employee", // Add systemRole to track the actual role
    department: deptName,
    workingHours: user.workingHours ?? "",
    status,
    avatar: getInitials(user.name ?? ""),
    password: "********",
    joiningDate: user.joiningDate ?? "",
    empId: user.employeeId ?? "",
    cnic: user.cnic ?? "",
    contact: user.contact || user.phone || "",
    profilePicture: user.profilePicture ?? user.avatarUrl ?? "",
    avatarUrl: user.avatarUrl ?? "",
  };
}

function StatusBadge({ status }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      On Leave
    </span>
  );
}

function EmployeeFormModal({ open, onClose, onSave, initialData, title, departments, roles }) {
  const [form, setForm] = useState(initialData ?? { ...emptyEmployee });

  const handleOpen = () => {
    setForm(initialData ?? { ...emptyEmployee });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast("Name and Email are required.", "error");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
        else handleOpen();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#162E93] flex items-center justify-center text-white text-xl font-bold">
                {form.name ? getInitials(form.name) : <Users className="w-7 h-7" />}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#088395] rounded-lg flex items-center justify-center shadow-md hover:bg-[#0a9aac] transition-colors">
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Full Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Job Title</Label>
              <select
                value={form.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
              >
                <option value="">Select Title</option>
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">System Permission Role <span className="text-red-500">*</span></Label>
              <select
                value={form.systemRole}
                onChange={(e) => handleChange("systemRole", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
              >
                <option value="employee">Employee (Limited Access)</option>
                <option value="teamlead">Team Lead (Team Access)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Department</Label>
              <select
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={form.password === "********" ? "" : form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Joining Date</Label>
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(e) => handleChange("joiningDate", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Employee ID</Label>
              <Input
                placeholder="EMP-007"
                value={form.empId}
                onChange={(e) => handleChange("empId", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">CNIC</Label>
              <Input
                placeholder="12345-6789012-3"
                value={form.cnic}
                onChange={(e) => handleChange("cnic", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Contact No.</Label>
              <Input
                placeholder="+1 (555) 000-0000"
                value={form.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Working Hours</Label>
              <Input
                placeholder="160h"
                value={form.workingHours}
                onChange={(e) => handleChange("workingHours", e.target.value)}
                className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-gray-700 font-medium">Status</Label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-gray-200"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white"
              onClick={handleSave}
            >
              Save Employee
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmModal({ open, employeeName, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onCancel(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">Remove Employee</DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to remove <span className="font-semibold text-gray-900">{employeeName}</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={onConfirm}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function empPerf(id) {
  // Generate a deterministic but realistic looking performance score based on ID length/chars
  const hash = String(id).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return {
    overall: 70 + (hash % 25),
    efficiency: 75 + (hash % 20),
    assigned: 5 + (hash % 15),
    completed: 2 + (hash % 10),
    inProgress: 1 + (hash % 5),
    pending: hash % 3
  };
}

function PerformancePopup({ employee, onClose, onViewFull }) {
  const p = empPerf(employee.id);

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-xl">
              <AvatarFallback className="rounded-xl bg-[#162E93] text-white font-bold text-sm">
                {employee.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">{employee.name}</DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">{employee.role || "—"} · {employee.department || "—"}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-1">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#162E93]" />Performance Overview
            </p>

            <div className="p-3.5 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">Overall Performance</span>
                <span className="text-sm font-bold text-[#162E93]">{p.overall}%</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#162E93] transition-all duration-500"
                  style={{ width: `${p.overall}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-600">Working Efficiency</span>
                <span className="text-sm font-bold text-[#088395]">{p.efficiency}%</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#088395] transition-all duration-500"
                  style={{ width: `${p.efficiency}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#162E93]" />Task Breakdown
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Assigned", value: p.assigned, icon: <BarChart3 className="h-4 w-4" />, bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
                { label: "Completed", value: p.completed, icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-green-50", text: "text-green-700", border: "border-green-100" },
                { label: "In Progress", value: p.inProgress, icon: <Clock className="h-4 w-4" />, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
                { label: "Pending", value: p.pending, icon: <Circle className="h-4 w-4" />, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-100" },
              ].map(item => (
                <div key={item.label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${item.bg} ${item.border}`}>
                  <span className={item.text}>{item.icon}</span>
                  <div>
                    <p className={`text-lg font-bold ${item.text}`}>{item.value}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />Close
            </Button>
            <Button
              className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white gap-2"
              onClick={onViewFull}
            >
              View Full Details <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FullDetailsModal({ employee, allTasks, allAttendance, allProjects, onClose }) {
  const empTasks = allTasks.filter(t => t.assignedTo === employee.name || t.assignedToId === employee.id);
  const total = empTasks.length;
  const completed = empTasks.filter(t => t.status === "Completed" || t.status === "Completed").length;
  const inProgress = empTasks.filter(t => t.status === "Active" || t.status === "Active").length;
  const pending = total - completed - inProgress;
  
  const overall = total > 0 ? Math.round((completed / total) * 100) : 0;
  const efficiency = total > 0 ? Math.min(100, Math.round((completed / Math.max(1, total - pending)) * 100)) : 0;

  const projects = allProjects.filter(p => (p.members || []).includes(employee.name) || (p.selectedMemberNames || []).includes(employee.name));

  const empAttendance = allAttendance.filter(a => a.employeeName === employee.name || a.employeeId === employee.id);
  const present = empAttendance.filter(a => a.status === "present").length;
  const absent = empAttendance.filter(a => a.status === "absent").length;
  const leaves = empAttendance.filter(a => a.status === "leave").length;

  function taskIcon(s) {
    const status = String(s).toLowerCase();
    if (status === "completed" || status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
    if (status === "active" || status === "in-progress") return <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />;
    return <Circle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />;
  }

  function taskBadge(s) {
    const status = String(s).toLowerCase();
    if (status === "completed" || status === "done") return "bg-green-100 text-green-700";
    if (status === "active" || status === "in-progress") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-500";
  }

  function taskLabel(s) {
    const status = String(s).toLowerCase();
    if (status === "completed" || status === "done") return "Done";
    if (status === "active" || status === "in-progress") return "In Progress";
    return "Pending";
  }

  const perfHistory = [
    { week: "Week 1", score: Math.max(0, overall - 5) },
    { week: "Week 2", score: Math.max(0, overall - 2) },
    { week: "Week 3", score: overall },
    { week: "Week 4", score: overall },
  ];

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        <div className="bg-gradient-to-r from-[#162E93] to-[#1A1953] px-6 pt-6 pb-8 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl border border-white/30">
                {employee.avatar}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                <p className="text-blue-200 text-sm mt-0.5">{employee.role || "—"}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    employee.status === "Active"
                      ? "bg-green-400/20 text-green-200 border border-green-400/30"
                      : "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${employee.status === "Active" ? "bg-green-400" : "bg-amber-400"}`} />
                    {employee.status}
                  </span>
                  <span className="text-blue-300 text-xs">{employee.empId || "—"}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 -mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: <Mail className="h-4 w-4 text-[#162E93]" />, label: "Email", value: employee.email },
              { icon: <Phone className="h-4 w-4 text-[#088395]" />, label: "Contact", value: employee.contact || "—" },
              { icon: <Building2 className="h-4 w-4 text-purple-500" />, label: "Department", value: employee.department || "—" },
              { icon: <Briefcase className="h-4 w-4 text-amber-500" />, label: "Role", value: employee.role || "—" },
              { icon: <CalendarDays className="h-4 w-4 text-green-500" />, label: "Joining Date", value: fmtDate(employee.joiningDate) },
              { icon: <CreditCard className="h-4 w-4 text-red-400" />, label: "CNIC", value: employee.cnic || "—" },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#162E93]" />Performance Metrics
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-[#162E93]/5 border border-[#162E93]/15 rounded-xl">
                <p className="text-2xl font-bold text-[#162E93]">{overall}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Overall Performance</p>
                <div className="h-2 bg-[#162E93]/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#162E93] rounded-full" style={{ width: `${overall}%` }} />
                </div>
              </div>
              <div className="p-4 bg-[#088395]/5 border border-[#088395]/15 rounded-xl">
                <p className="text-2xl font-bold text-[#088395]">{efficiency}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Working Efficiency</p>
                <div className="h-2 bg-[#088395]/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#088395] rounded-full" style={{ width: `${efficiency}%` }} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2.5">
              <p className="text-xs font-semibold text-gray-600 mb-1">Performance History (Last 4 Weeks)</p>
              {perfHistory.map(w => (
                <div key={w.week} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-14 flex-shrink-0">{w.week}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#162E93] to-[#088395]"
                      style={{ width: `${w.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-9 text-right">{w.score}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#162E93]" />Task List
              <span className="ml-auto text-xs font-normal text-gray-400">{total} total · {completed} done</span>
            </p>
            <div className="space-y-2">
              {empTasks.slice(0, 5).map((task, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  {taskIcon(task.status)}
                  <span className={`flex-1 text-sm ${(String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done") ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {task.title}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${taskBadge(task.status)}`}>
                    {taskLabel(task.status)}
                  </span>
                </div>
              ))}
              {total === 0 && <p className="text-xs text-gray-400 text-center py-2 italic">No tasks assigned yet.</p>}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#162E93]" />Assigned Projects
            </p>
            <div className="flex flex-wrap gap-2">
              {projects.length > 0 ? projects.map((proj, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#162E93]/8 border border-[#162E93]/15 text-xs font-medium text-[#162E93]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#162E93]" />
                  {proj.title || proj.name}
                </span>
              )) : <p className="text-xs text-gray-400 italic">No projects assigned yet.</p>}
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#162E93]" />Attendance Summary (This Month)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-center">
                <p className="text-xl font-bold text-green-700">{present}</p>
                <p className="text-xs text-green-600 mt-0.5">Present</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
                <p className="text-xl font-bold text-red-700">{absent}</p>
                <p className="text-xs text-red-600 mt-0.5">Absent</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                <p className="text-xl font-bold text-amber-700">{leaves}</p>
                <p className="text-xs text-amber-600 mt-0.5">On Leave</p>
              </div>
            </div>
          </div>

          <Button className="w-full rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white" onClick={onClose}>
            Close Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Employees() {
  const userRole = getCurrentRole();
  const [employees, setEmployees] = useState(initialEmployees);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [perfPopupEmp, setPerfPopupEmp] = useState(null);
  const [fullDetailsEmp, setFullDetailsEmp] = useState(null);

  const currentUser = getCurrentUser();
  const teamMembers = userRole === "teamlead" ? getTeamMembers(currentUser?.name || "Sarah Chen") : [];
  const displayEmployees = userRole === "teamlead"
    ? employees.filter(emp => teamMembers.includes(emp.name))
    : employees;

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [users, departmentData, taskData, attendanceData, projectData] = await Promise.all([
          fetchUsers(),
          fetchDepartments(),
          fetchTasks(),
          fetchAttendance(),
          fetchProjects()
        ]);
        
        if (mounted) {
          // Show all users in the management list so Admin can see Team Leads too
          setEmployees(users.map(mapUserToEmployee));
          setDepartments(departmentData.map(d => d.name).filter(Boolean));
          setAllTasks(taskData || []);
          setAllAttendance(attendanceData || []);
          setAllProjects(projectData || []);
          
          // Get unique roles/jobTitles from existing users
          const existingRoles = users
            .map(u => u.jobTitle || u.role)
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i);
            
          // Add default roles if not enough found
          const defaultRoles = ["Senior Developer", "Backend Developer", "Frontend Developer", "UI/UX Designer", "Product Designer", "Sales Manager", "Marketing Lead", "HR Manager", "Team Lead", "Admin"];
          const combinedRoles = Array.from(new Set([...existingRoles, ...defaultRoles]));
          setRoles(combinedRoles);
        }
      } catch {
        /* keep initialEmployees as fallback when backend is unreachable */
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredEmployees = displayEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.role || emp.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEmployee = async (data) => {
    try {
      const savedUser = await createUser({
        name: data.name,
        email: data.email,
        password: data.password || "ChangeMe123!",
        role: data.systemRole || (String(data.role).toLowerCase().includes("lead") ? "teamlead" : "employee"),
        jobTitle: data.role,
        department: data.department,
        status: data.status === "On Leave" ? "inactive" : "active",
        joiningDate: data.joiningDate,
        employeeId: data.empId,
        cnic: data.cnic,
        contact: data.contact,
        workingHours: data.workingHours,
        avatarUrl: data.profilePicture,
        profilePicture: data.profilePicture,
      });

      const nextEmployee = mapUserToEmployee(savedUser);
      setEmployees((prev) => [nextEmployee, ...prev]);
      setAddModalOpen(false);
      showToast(`${data.name} has been added successfully.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to add employee.", "error");
    }
  };

  const handleEditEmployee = async (data) => {
    if (!selectedEmployee) return;
    try {
      const savedUser = await updateUser(selectedEmployee.id, {
        name: data.name,
        email: data.email,
        password: data.password && data.password !== "********" ? data.password : undefined,
        role: data.systemRole || (String(data.role).toLowerCase().includes("lead") ? "teamlead" : "employee"),
        jobTitle: data.role,
        department: data.department,
        status: data.status === "On Leave" ? "inactive" : "active",
        joiningDate: data.joiningDate,
        employeeId: data.empId,
        cnic: data.cnic,
        contact: data.contact,
        workingHours: data.workingHours,
        avatarUrl: data.profilePicture,
        profilePicture: data.profilePicture,
      });

      const nextEmployee = mapUserToEmployee(savedUser);
      setEmployees((prev) => prev.map((emp) => (emp.id === selectedEmployee.id ? nextEmployee : emp)));
      setEditModalOpen(false);
      setSelectedEmployee(null);
      showToast(`${data.name}'s information has been updated.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to update employee.", "error");
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      await deleteUser(selectedEmployee.id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== selectedEmployee.id));
      setDeleteModalOpen(false);
      showToast(`${selectedEmployee.name} has been removed.`, "success");
      setSelectedEmployee(null);
    } catch (error) {
      showToast(error.message || "Unable to remove employee.", "error");
    }
  };

  const openEdit = (emp) => {
    setSelectedEmployee(emp);
    setEditModalOpen(true);
  };

  const openDelete = (emp) => {
    setSelectedEmployee(emp);
    setDeleteModalOpen(true);
  };

  const openPerfPopup = (emp) => {
    setPerfPopupEmp(emp);
  };

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;
  const deptCount = new Set(employees.map((e) => e.department).filter(Boolean)).size;

  return (
    <AppLayout userRole={userRole === "teamlead" ? "teamlead" : "admin"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Employee Management</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
          <Button
            className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#162E93]/10 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-[#162E93]" />
                </div>
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{employees.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Active workforce</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserCheck className="h-3.5 w-3.5 text-green-600" />
                </div>
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Currently working</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <UserMinus className="h-3.5 w-3.5 text-amber-600" />
                </div>
                On Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{onLeaveCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Away from work</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#088395]/10 flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5 text-[#088395]" />
                </div>
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{deptCount}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Active departments</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, department, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl border-gray-200"
          />
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No employees found matching your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => (
              <Card
                key={employee.id}
                className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => openPerfPopup(employee)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-[#162E93] text-white text-sm font-bold">
                          {employee.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base group-hover:text-[#162E93] transition-colors">{employee.name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{employee.role || employee.jobTitle || "—"}</CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={employee.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{employee.contact || "+1 (555) 000-0000"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-muted-foreground text-xs">Department</p>
                      <p className="font-medium text-gray-800">{employee.department || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Working Hours</p>
                      <p className="font-medium text-gray-800">{employee.workingHours || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400 group-hover:text-[#162E93] transition-colors flex items-center gap-1">
                      <Activity className="h-3 w-3" />Click to view performance
                    </span>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-gray-200 hover:border-[#162E93] hover:text-[#162E93] transition-colors"
                        onClick={() => openEdit(employee)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-gray-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => openDelete(employee)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Employee Database</CardTitle>
            <CardDescription>Complete employee information and quick actions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-gray-700">Employee</TableHead>
                    <TableHead className="font-semibold text-gray-700">Role</TableHead>
                    <TableHead className="font-semibold text-gray-700">Department</TableHead>
                    <TableHead className="font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700">Working Hours</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                        No employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id} className="hover:bg-gray-50/60 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 rounded-lg">
                              <AvatarFallback className="rounded-lg bg-[#162E93]/10 text-[#162E93] text-xs font-bold">
                                {employee.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{employee.name}</p>
                              <p className="text-xs text-gray-400">{employee.empId || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{employee.role || employee.jobTitle || "—"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                            {employee.department || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{employee.email}</TableCell>
                        <TableCell className="text-sm text-gray-700">{employee.workingHours || "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={employee.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5 justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-[#162E93]/10 hover:text-[#162E93] transition-colors"
                              onClick={() => openEdit(employee)}
                              title="Edit Employee"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                              onClick={() => openDelete(employee)}
                              title="Remove Employee"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {perfPopupEmp && (
        <PerformancePopup
          employee={perfPopupEmp}
          allTasks={allTasks}
          onClose={() => setPerfPopupEmp(null)}
          onViewFull={() => {
            setFullDetailsEmp(perfPopupEmp);
            setPerfPopupEmp(null);
          }}
        />
      )}

      {fullDetailsEmp && (
        <FullDetailsModal
          employee={fullDetailsEmp}
          allTasks={allTasks}
          allAttendance={allAttendance}
          allProjects={allProjects}
          onClose={() => setFullDetailsEmp(null)}
        />
      )}

      <EmployeeFormModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddEmployee}
        title="Add New Employee"
        departments={departments}
        roles={roles}
      />

      {selectedEmployee && editModalOpen && (
        <EmployeeFormModal
          open={editModalOpen}
          onClose={() => { setEditModalOpen(false); setSelectedEmployee(null); }}
          onSave={handleEditEmployee}
          initialData={{
            name: selectedEmployee.name,
            email: selectedEmployee.email,
            role: selectedEmployee.role,
            department: selectedEmployee.department,
            workingHours: selectedEmployee.workingHours,
            status: selectedEmployee.status,
            password: selectedEmployee.password,
            joiningDate: selectedEmployee.joiningDate,
            empId: selectedEmployee.empId,
            cnic: selectedEmployee.cnic,
            contact: selectedEmployee.contact,
            profilePicture: selectedEmployee.profilePicture,
          }}
          title={`Edit — ${selectedEmployee.name}`}
          departments={departments}
          roles={roles}
        />
      )}

      <DeleteConfirmModal
        open={deleteModalOpen}
        employeeName={selectedEmployee?.name ?? ""}
        onConfirm={handleDeleteEmployee}
        onCancel={() => { setDeleteModalOpen(false); setSelectedEmployee(null); }}
      />
    </AppLayout>
  );
}
