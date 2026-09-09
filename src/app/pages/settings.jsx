import { useEffect, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import {
  Settings, Calendar, Clock, Globe, Bell, Shield, Users, Save,
  Plus, Trash2, Building2, CheckCircle2, Lock, Key, Activity,
  Tag, ListChecks, UserPlus, UserMinus, Edit2, ChevronRight,
  Eye, PenLine, AlertTriangle, LogIn, FileEdit, UserCheck,
  Upload, X, Check, Hash,
} from "lucide-react";
import { showToast } from "../utils/toast";
import { createUser, deleteUser, fetchDepartments, fetchSettings, fetchUsers, updateSettings, updateUser } from "../utils/api";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const initialHolidays = [];
const initialUsers = [];
const initialDepts = [];
const auditLogsData = [];

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="flex-shrink-0" />
    </div>
  );
}

function SaveFooter({ onSave, isDirty }) {
  return (
    <div className="flex items-center gap-4 pt-5 mt-4 border-t border-gray-100">
      <Button
        size="sm"
        onClick={onSave}
        className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2 px-5 h-9"
      >
        <Save className="h-4 w-4" />
        Save Changes
      </Button>
      {isDirty && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          Unsaved changes
        </span>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-base font-bold text-gray-900">{title}</p>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function SettingsPage() {

  const [activeTab, setActiveTab]           = useState("operations");
  const [dirtyTabs, setDirtyTabs]           = useState(new Set());
  const [pendingTab, setPendingTab]         = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [s, u, d] = await Promise.all([fetchSettings(), fetchUsers(), fetchDepartments()]);
        if (!mounted) return;
        if (s.operations) {
          setWorkDays(s.operations.workDays || []);
          setWorkStart(s.operations.workStart || "09:00");
          setWorkEnd(s.operations.workEnd || "17:00");
          setExpectedHrs(s.operations.expectedHours || "8");
        }
        if (s.holidays) setHolidays(s.holidays);
        if (s.permissions) setPermissions(s.permissions);
        if (s.notifications) setNotif(s.notifications);
        if (s.company) {
          setCompanyName(s.company.name || "SyncFlow Corp");
          setTimezone(s.company.timezone || "UTC-5 (Eastern Time)");
          setDateFormat(s.company.dateFormat || "MM/DD/YYYY");
        }
        if (s.security) setSecurity(s.security);
        setUsers(u.map(usr => ({
          id: usr.id || usr._id,
          name: typeof usr.name === "object" ? (usr.name.name ?? "—") : (usr.name || "—"),
          email: usr.email,
          role: usr.role === "teamlead" ? "Team Lead" : usr.role === "admin" ? "Admin" : "Employee",
          dept: typeof usr.department === "object" ? (usr.department.name ?? "—") : (usr.department || "—"),
          status: usr.status === "active" ? "Active" : "Inactive"
        })));
        setDepts(d.map(dep => ({
          id: dep.id || dep._id,
          name: typeof dep.name === "object" ? (dep.name.name ?? "—") : (dep.name || "—"),
          lead: typeof dep.lead === "object" ? (dep.lead.name ?? "—") : (dep.leadName || dep.lead || "—"),
          members: dep.memberCount || dep.members || 0,
          status: "Active"
        })));
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const markDirty = () =>
    setDirtyTabs(p => new Set([...p, activeTab]));

  const markClean = (tab) =>
    setDirtyTabs(p => { const s = new Set(p); s.delete(tab); return s; });

  const handleTabChange = (newTab) => {
    if (newTab !== activeTab && dirtyTabs.has(activeTab)) {
      setPendingTab(newTab);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleSaveSection = async () => {
    try {
      const s = await fetchSettings();
      const updated = {
        ...s,
        operations: { workDays, workStart, workEnd, expectedHours: expectedHrs },
        holidays,
        permissions,
        notifications: notif,
        company: { name: companyName, timezone, dateFormat },
        security
      };
      await updateSettings(updated);
      showToast("Changes saved successfully!", "success");
      markClean(activeTab);
    } catch (err) {
      showToast("Failed to save settings", "error");
    }
  };

  const handleUnsavedSave = () => {
    showToast("Changes saved successfully!", "success");
    markClean(activeTab);
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
    setShowUnsavedModal(false);
  };

  const handleUnsavedDiscard = () => {
    markClean(activeTab);
    if (pendingTab) setActiveTab(pendingTab);
    setPendingTab(null);
    setShowUnsavedModal(false);
  };

  const handleUnsavedCancel = () => {
    setPendingTab(null);
    setShowUnsavedModal(false);
  };

  const [workDays, setWorkDays]       = useState(["Monday","Tuesday","Wednesday","Thursday","Friday"]);
  const [workStart, setWorkStart]     = useState("09:00");
  const [workEnd, setWorkEnd]         = useState("17:00");
  const [expectedHrs, setExpectedHrs] = useState("8");

  const toggleWorkDay = (day) => {
    setWorkDays(p => p.includes(day) ? p.filter(d => d !== day) : [...p, day]);
    markDirty();
  };

  const [holidays, setHolidays]           = useState(initialHolidays);
  const [newHoliday, setNewHoliday]       = useState({ name: "", date: "", type: "National" });
  const [addingHoliday, setAddingHoliday] = useState(false);

  const handleAddHoliday = () => {
    if (newHoliday.name && newHoliday.date) {
      setHolidays(p => [...p, { id: p.length + 1, ...newHoliday }]);
      setNewHoliday({ name: "", date: "", type: "National" });
      setAddingHoliday(false);
      markDirty();
    }
  };
  const [auditLogs, setAuditLogs]           = useState(auditLogsData);
  const [users, setUsers]                   = useState(initialUsers);
  const [userFilter, setUserFilter]         = useState("All");
  const [newUser, setNewUser]               = useState({ name: "", email: "", dept: "Engineering", role: "Employee" });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modal, setModal]                   = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editingDept, setEditingDept] = useState(null);

  const handleAddUser = async () => {
    if (newUser.name && newUser.email) {
      try {
        const payload = {
          name: newUser.name,
          email: newUser.email,
          password: "Password123!", // Default password
          role: newUser.role === "Team Lead" ? "teamlead" : newUser.role.toLowerCase(),
          department: newUser.dept
        };
        const saved = await createUser(payload);
        const mapped = {
          id: saved.id || saved._id,
          name: typeof saved.name === "object" ? (saved.name.name ?? "—") : (saved.name || "—"),
          email: saved.email,
          role: saved.role === "teamlead" ? "Team Lead" : saved.role === "admin" ? "Admin" : "Employee",
          dept: typeof saved.department === "object" ? (saved.department.name ?? "—") : (saved.department || "—"),
          status: saved.status === "active" ? "Active" : "Inactive"
        };
        setUsers(p => [...p, mapped]);
        setNewUser({ name: "", email: "", dept: "Engineering", role: "Employee" });
        setModal(null);
        showToast(`${newUser.role} added successfully!`, "success");
      } catch (err) {
        showToast(err.message || "Failed to add user", "error");
      }
    }
  };

  const handleRemoveUser = async () => {
    if (selectedUserId) {
      try {
        await deleteUser(selectedUserId);
        setUsers(p => p.filter(u => u.id !== selectedUserId));
        setSelectedUserId(null);
        setModal(null);
        showToast("User removed.", "success");
      } catch (err) {
        showToast("Failed to remove user", "error");
      }
    }
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role === "Team Lead" ? "teamlead" : editingUser.role.toLowerCase(),
        department: editingUser.dept
      };
      const saved = await updateUser(editingUser.id, payload);
      setUsers(p => p.map(u => u.id === editingUser.id
        ? {
            ...u,
            name: typeof saved.name === "object" ? (saved.name.name ?? "—") : (saved.name || "—"),
            email: saved.email,
            role: saved.role === "teamlead" ? "Team Lead" : saved.role === "admin" ? "Admin" : "Employee",
            dept: typeof saved.department === "object" ? (saved.department.name ?? "—") : (saved.department || "—")
          }
        : u
      ));
      setModal(null);
      setEditingUser(null);
      showToast("User updated successfully!", "success");
    } catch (err) {
      showToast("Failed to update user", "error");
    }
  };

  const handleSaveEditDept = async () => {
    if (!editingDept) return;
    try {
      const saved = await updateDepartment(editingDept.id, {
        name: editingDept.name,
        lead: editingDept.lead,
      });
      setDepts(p => p.map(d => d.id === editingDept.id ? {
        ...d,
        name: saved.name,
        lead: saved.leadName || saved.lead || "—",
        members: saved.memberCount || saved.members || 0
      } : d));
      setModal(null);
      setEditingDept(null);
      showToast("Department updated successfully!", "success");
    } catch (err) {
      showToast("Failed to update department", "error");
    }
  };

  const [depts, setDepts]   = useState(initialDepts);
  const [newDept, setNewDept] = useState({ name: "", lead: "", members: 0 });

  const handleAddDept = async () => {
    if (newDept.name) {
      try {
        const saved = await createDepartment({
          name: newDept.name,
          lead: newDept.lead
        });
        setDepts(p => [...p, {
          id: saved.id || saved._id,
          name: saved.name,
          lead: saved.leadName || saved.lead || "—",
          members: saved.memberCount || saved.members || 0,
          status: "Active"
        }]);
        setNewDept({ name: "", lead: "", members: 0 });
        setModal(null);
        showToast("Department created!", "success");
      } catch (err) {
        showToast("Failed to create department", "error");
      }
    }
  };

  const [permissions, setPermissions] = useState({
    Admin:      { read: true,  write: true,  delete: true,  manage: true  },
    "Team Lead":{ read: true,  write: true,  delete: false, manage: false },
    Employee:   { read: true,  write: false, delete: false, manage: false },
  });

  const togglePerm = (role, perm) => {
    setPermissions(p => ({
      ...p,
      [role]: { ...p[role], [perm]: !p[role][perm] },
    }));
    markDirty();
  };

  const [priorities, setPriorities] = useState([
    { id: 1, label: "High",   color: "bg-red-500",   enabled: true },
    { id: 2, label: "Medium", color: "bg-amber-500", enabled: true },
    { id: 3, label: "Low",    color: "bg-green-500", enabled: true },
  ]);
  const [statuses, setStatuses] = useState([
    { id: 1, label: "To Do",       color: "bg-gray-400",  enabled: true },
    { id: 2, label: "In Progress", color: "bg-[#162E93]", enabled: true },
    { id: 3, label: "In Review",   color: "bg-amber-500", enabled: true },
    { id: 4, label: "Done",        color: "bg-green-500", enabled: true },
  ]);
  const [tags, setTags]   = useState(["Frontend","Backend","Design","Urgent","QA","Bug","Feature"]);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(p => [...p, newTag.trim()]);
      setNewTag("");
      markDirty();
    }
  };

  const [notif, setNotif] = useState({
    emailEnabled:    true,
    pushEnabled:     true,
    taskAssigned:    true,
    taskCompleted:   true,
    leaveApproval:   true,
    meetingReminder: true,
    newEmployee:     false,
    weeklyReport:    true,
  });

  const [companyName, setCompanyName] = useState("SyncFlow Corp");
  const [timezone, setTimezone]       = useState("UTC-5 (Eastern Time)");
  const [dateFormat, setDateFormat]   = useState("MM/DD/YYYY");

  const [security, setSecurity] = useState({
    twoFA:          true,
    sessionTimeout: true,
    ipAllowlist:    false,
    auditLogging:   true,
    passwordPolicy: true,
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  const isDirty = dirtyTabs.has(activeTab);

  return (
    <AppLayout userRole="admin">
      <div className="space-y-7 pb-12">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure your workspace, users, roles, and system preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-white border border-gray-100 rounded-xl p-1 shadow-sm h-auto flex flex-wrap gap-1">
            {[
              { value: "operations",    label: "Operations",          Icon: Clock      },
              { value: "holidays",      label: "Holidays",            Icon: Calendar   },
              { value: "users",         label: "User Management",     Icon: Users      },
              { value: "roles",         label: "Roles & Permissions", Icon: Shield     },
              { value: "departments",   label: "Departments",         Icon: Building2  },
              { value: "system",        label: "System Config",       Icon: Settings   },
              { value: "notifications", label: "Notifications",       Icon: Bell       },
              { value: "company",       label: "Company Profile",     Icon: Globe      },
              { value: "security",      label: "Security & Logs",     Icon: Lock       },
            ].map(({ value, label, Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="relative rounded-lg data-[state=active]:bg-[#162E93] data-[state=active]:text-white data-[state=active]:shadow-sm flex items-center gap-1.5 text-sm px-3 py-2"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {dirtyTabs.has(value) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 flex-shrink-0" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="operations">
            <div className="grid lg:grid-cols-2 gap-6">

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#162E93]" />
                    Operational Days
                  </CardTitle>
                  <CardDescription>Select the working days for your organisation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {weekDays.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleWorkDay(day)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          workDays.includes(day)
                            ? "border-[#162E93] bg-[#162E93]/5 text-[#162E93]"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          workDays.includes(day) ? "border-[#162E93] bg-[#162E93]" : "border-gray-300"
                        }`}>
                          {workDays.includes(day) && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        {day}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-[#162E93]/5 rounded-xl">
                    <p className="text-xs text-[#162E93] font-medium">
                      {workDays.length} working days per week selected
                    </p>
                  </div>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#088395]" />
                    Working Hours
                  </CardTitle>
                  <CardDescription>Define daily office hours and overtime policy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Office Start Time</Label>
                    <Input
                      type="time" value={workStart}
                      onChange={e => { setWorkStart(e.target.value); markDirty(); }}
                      className="rounded-xl border-gray-200 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Office End Time</Label>
                    <Input
                      type="time" value={workEnd}
                      onChange={e => { setWorkEnd(e.target.value); markDirty(); }}
                      className="rounded-xl border-gray-200 h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Expected Daily Working Hours</Label>
                    <div className="relative">
                      <Input
                        type="number" min={1} max={24} value={expectedHrs}
                        onChange={e => { setExpectedHrs(e.target.value); markDirty(); }}
                        className="rounded-xl border-gray-200 h-11 pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">hours</span>
                    </div>
                  </div>
                  <div className="p-4 bg-[#088395]/5 rounded-xl border border-[#088395]/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-[#088395]" />
                      <span className="text-sm font-semibold text-[#088395]">Current Schedule</span>
                    </div>
                    <p className="text-sm text-gray-700">{workStart} — {workEnd}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{expectedHrs}h/day · {workDays.length} days/week</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-3 block">Overtime Policy</Label>
                    <div className="space-y-3">
                      {["Allowed with approval","Not allowed","Mandatory for urgent tasks"].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio" name="overtime" className="text-[#162E93] w-4 h-4"
                            defaultChecked={opt === "Allowed with approval"}
                            onChange={() => markDirty()}
                          />
                          <span className="text-sm text-gray-600">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="holidays">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#162E93]" />
                      Public Holidays ({holidays.length})
                    </CardTitle>
                    <CardDescription className="mt-0.5">Manage national and company holidays</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-1.5"
                    onClick={() => setAddingHoliday(true)}
                  >
                    <Plus className="h-4 w-4" />Add Holiday
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {addingHoliday && (
                  <div className="mb-6 p-5 bg-[#162E93]/5 rounded-xl border border-[#162E93]/10">
                    <p className="text-sm font-semibold text-gray-800 mb-4">Add New Holiday</p>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1.5 block">Holiday Name</Label>
                        <Input
                          placeholder="e.g., Labor Day"
                          value={newHoliday.name}
                          onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                          className="rounded-xl border-gray-200 h-10 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1.5 block">Date</Label>
                        <Input
                          type="date"
                          value={newHoliday.date}
                          onChange={e => setNewHoliday({ ...newHoliday, date: e.target.value })}
                          className="rounded-xl border-gray-200 h-10 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1.5 block">Type</Label>
                        <select
                          value={newHoliday.type}
                          onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                          className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                        >
                          <option>National</option><option>Company</option><option>Regional</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="rounded-xl border-gray-200" onClick={() => setAddingHoliday(false)}>Cancel</Button>
                      <Button size="sm" className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8]" onClick={handleAddHoliday}>Add Holiday</Button>
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  {holidays.map(h => (
                    <div key={h.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-[#162E93]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{h.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{h.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <Badge className={`text-[10px] border-0 whitespace-nowrap ${
                          h.type === "National" ? "bg-[#162E93]/10 text-[#162E93]" :
                          h.type === "Company"  ? "bg-[#088395]/10 text-[#088395]" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {h.type}
                        </Badge>
                        <button
                          onClick={() => { setHolidays(p => p.filter(x => x.id !== h.id)); markDirty(); }}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#162E93]" />
                  User Management
                </CardTitle>
                <CardDescription>Add, remove, and manage employee and team lead accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {[
                    { label:"Add Employee",     Icon:UserPlus,  cls:"bg-[#162E93] hover:bg-[#1a36a8] text-white border border-[#162E93]",          action:() => { setNewUser({...newUser,role:"Employee"});  setModal("add-employee"); } },
                    { label:"Add Team Lead",    Icon:UserPlus,  cls:"bg-[#088395] hover:bg-[#0a9aab] text-white border border-[#088395]",          action:() => { setNewUser({...newUser,role:"Team Lead"}); setModal("add-teamlead"); } },
                    { label:"Remove Employee",  Icon:UserMinus, cls:"bg-white hover:bg-red-50 text-red-600 border border-red-200 shadow-sm",        action:() => { setUserFilter("Employee");  setModal("remove-user"); } },
                    { label:"Remove Team Lead", Icon:UserMinus, cls:"bg-white hover:bg-red-50 text-red-600 border border-red-200 shadow-sm",        action:() => { setUserFilter("Team Lead"); setModal("remove-user"); } },
                  ].map(b => (
                    <button
                      key={b.label} onClick={b.action}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${b.cls}`}
                    >
                      <b.Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {["All","Employee","Team Lead"].map(f => (
                    <button
                      key={f} onClick={() => setUserFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        userFilter === f ? "bg-[#162E93] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 ml-auto">
                    {users.filter(u => userFilter === "All" || u.role === userFilter).length} users
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Name</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Department</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Role</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.filter(u => userFilter === "All" || u.role === userFilter).map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-[#162E93]">
                                  {u.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <span className="font-medium text-gray-800 whitespace-nowrap">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{u.dept}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold whitespace-nowrap ${
                              u.role === "Team Lead" ? "bg-[#088395]/10 text-[#088395]" : "bg-[#162E93]/10 text-[#162E93]"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold ${
                              u.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingUser({ id: u.id, name: u.name, email: u.email, role: u.role, dept: u.dept, status: u.status, contact: "", workingHours: "8" });
                                  setModal("edit-user");
                                }}
                                className="p-1.5 hover:bg-[#162E93]/10 rounded-lg transition-colors"
                                title="Edit user"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-[#162E93]" />
                              </button>
                              <button
                                onClick={() => { setSelectedUserId(u.id); setModal("remove-user"); }}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#162E93]" />
                  Roles & Permissions
                </CardTitle>
                <CardDescription>Assign read, write, delete, and management access per role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 w-44">Role</th>
                        {["read","write","delete","manage"].map(p => (
                          <th key={p} className="text-center px-4 py-3.5 text-xs font-semibold text-gray-500 capitalize w-28">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {["Admin","Team Lead","Employee"].map((role, ri) => {
                        const colors = [
                          "text-[#162E93] bg-[#162E93]/10",
                          "text-[#088395] bg-[#088395]/10",
                          "text-green-700 bg-green-100",
                        ];
                        const perms = permissions[role];
                        return (
                          <tr key={role} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[ri]}`}>
                                  {ri===0?<Shield className="h-4 w-4"/>:ri===1?<UserCheck className="h-4 w-4"/>:<Users className="h-4 w-4"/>}
                                </div>
                                <span className="font-semibold text-gray-800">{role}</span>
                              </div>
                            </td>
                            {["read","write","delete","manage"].map(perm => (
                              <td key={perm} className="px-4 py-4 text-center">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => role !== "Admin" && togglePerm(role, perm)}
                                    disabled={role === "Admin"}
                                    className={`w-10 h-5 rounded-full transition-all relative ${
                                      perms[perm] ? "bg-[#162E93]" : "bg-gray-200"
                                    } ${role === "Admin" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                                  >
                                    <span
                                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                                      style={{ left: perms[perm] ? "22px" : "2px" }}
                                    />
                                  </button>
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Admin role has full access and cannot be restricted. Changes to Team Lead and Employee permissions take effect after saving.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Eye,      label: "Read",   desc: "View records and data"          },
                    { icon: PenLine,  label: "Write",  desc: "Create and update records"      },
                    { icon: Trash2,   label: "Delete", desc: "Permanently remove records"     },
                    { icon: Settings, label: "Manage", desc: "Manage users and system config" },
                  ].map(item => (
                    <div key={item.label} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <item.icon className="h-3.5 w-3.5 text-[#162E93]" />
                        <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#162E93]" />
                      Department & Team Setup
                    </CardTitle>
                    <CardDescription className="mt-0.5">
                      Create departments, assign team leads, and manage teams
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-1.5"
                    onClick={() => setModal("dept")}
                  >
                    <Plus className="h-4 w-4" />New Department
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {depts.map(d => (
                    <div key={d.id} className="p-5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#162E93]/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-[#162E93]" />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingDept({ id: d.id, name: d.name, lead: d.lead, members: d.members, status: d.status }); setModal("edit-dept"); }}
                            className="p-1.5 hover:bg-[#162E93]/10 rounded-lg transition-colors"
                            title="Edit department"
                          >
                            <Edit2 className="h-3.5 w-3.5 text-gray-400 hover:text-[#162E93]" />
                          </button>
                          <button
                            onClick={() => { setDepts(p => p.filter(x => x.id !== d.id)); markDirty(); }}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-base font-bold text-gray-900 mb-3">{d.name}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <UserCheck className="h-3.5 w-3.5 text-[#088395] flex-shrink-0" />
                          <span>Lead: <span className="font-semibold text-gray-700">{d.lead}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span>{d.members} members</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">
                          {d.status}
                        </span>
                        <button className="text-xs text-[#162E93] font-medium flex items-center gap-0.5 hover:underline">
                          Assign Lead <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setModal("dept")}
                    className="p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#162E93]/50 hover:bg-[#162E93]/3 transition-all flex flex-col items-center justify-center gap-3 min-h-[180px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">Add Department</p>
                  </button>
                </div>
                <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid lg:grid-cols-3 gap-6">

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Task Priority Levels
                  </CardTitle>
                  <CardDescription>Enable or disable task priority options</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {priorities.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${p.color}`} />
                          <span className="text-sm font-semibold text-gray-800">{p.label}</span>
                        </div>
                        <Switch
                          checked={p.enabled}
                          onCheckedChange={v => { setPriorities(prev => prev.map(x => x.id===p.id ? {...x,enabled:v} : x)); markDirty(); }}
                        />
                      </div>
                    ))}
                    <div className="p-3 bg-[#162E93]/5 rounded-xl border border-[#162E93]/10">
                      <p className="text-xs text-[#162E93] font-medium">
                        {priorities.filter(p => p.enabled).length} of {priorities.length} priorities active
                      </p>
                    </div>
                  </div>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-[#162E93]" />
                    Task Status Categories
                  </CardTitle>
                  <CardDescription>Configure task workflow stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statuses.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.color}`} />
                          <span className="text-sm font-semibold text-gray-800">{s.label}</span>
                        </div>
                        <Switch
                          checked={s.enabled}
                          onCheckedChange={v => { setStatuses(prev => prev.map(x => x.id===s.id ? {...x,enabled:v} : x)); markDirty(); }}
                        />
                      </div>
                    ))}
                    <div className="p-3 bg-[#088395]/5 rounded-xl border border-[#088395]/10">
                      <p className="text-xs text-[#088395] font-medium">
                        {statuses.filter(s => s.enabled).length} active workflow stages
                      </p>
                    </div>
                  </div>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-500" />
                    Labels & Tags
                  </CardTitle>
                  <CardDescription>Manage task labels and classification tags</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[80px] content-start">
                    {tags.map(t => (
                      <span key={t} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#162E93]/8 text-[#162E93] rounded-lg text-xs font-medium border border-[#162E93]/15">
                        <Hash className="h-3 w-3 flex-shrink-0" />{t}
                        <button
                          onClick={() => { setTags(p => p.filter(x => x !== t)); markDirty(); }}
                          className="hover:text-red-500 ml-0.5 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      placeholder="Add new tag…"
                      className="rounded-xl border-gray-200 h-10 text-sm flex-1"
                      onKeyDown={e => e.key === "Enter" && handleAddTag()}
                    />
                    <Button size="sm" onClick={handleAddTag} className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] h-10 px-3">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">{tags.length} tags · Press Enter or click + to add</p>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid lg:grid-cols-2 gap-6">

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#088395]" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>Enable or disable global notification delivery channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { key: "emailEnabled", label: "Email Notifications", desc: "Send notifications via email to all users", emoji: "📧" },
                      { key: "pushEnabled",  label: "Push Notifications",  desc: "Browser and mobile push alert notifications", emoji: "🔔" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-5 rounded-xl bg-gray-50 border border-gray-100 gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={notif[item.key]}
                          onCheckedChange={v => { setNotif(p => ({...p,[item.key]:v})); markDirty(); }}
                          className="flex-shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#162E93]" />
                    Event Notifications
                  </CardTitle>
                  <CardDescription>Control which system events trigger notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { key: "taskAssigned",    label: "Task Assigned",    desc: "When a new task is assigned to a user"     },
                      { key: "taskCompleted",   label: "Task Completed",   desc: "When a task is marked as completed"        },
                      { key: "leaveApproval",   label: "Leave Approval",   desc: "On leave request status changes"          },
                      { key: "meetingReminder", label: "Meeting Reminder", desc: "Before a scheduled meeting starts"        },
                      { key: "newEmployee",     label: "New Employee",     desc: "When a new employee account is created"   },
                      { key: "weeklyReport",    label: "Weekly Reports",   desc: "Automated weekly performance summaries"   },
                    ].map(item => (
                      <ToggleRow
                        key={item.key}
                        label={item.label}
                        desc={item.desc}
                        checked={notif[item.key]}
                        onChange={v => { setNotif(p => ({...p,[item.key]:v})); markDirty(); }}
                      />
                    ))}
                  </div>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="company">
            <div className="grid lg:grid-cols-2 gap-6">

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#162E93]" />
                    Company Information
                  </CardTitle>
                  <CardDescription>Basic company profile and contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#162E93] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xl">SF</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#162E93]/50 text-sm text-gray-500 hover:text-[#162E93] transition-all w-full">
                          <Upload className="h-4 w-4 flex-shrink-0" />
                          Upload Logo
                        </button>
                        <p className="text-[10px] text-gray-400 mt-1.5 text-center">PNG, JPG up to 2 MB</p>
                      </div>
                    </div>
                  </div>
                  {[
                    { label: "Company Name",  value: companyName,           setter: setCompanyName },
                    { label: "Workspace URL", value: "syncflow-corp",       setter: null           },
                    { label: "Company Email", value: "admin@syncflow.io",   setter: null           },
                    { label: "Support Email", value: "support@syncflow.io", setter: null           },
                  ].map(f => (
                    <div key={f.label}>
                      <Label className="text-sm text-gray-700 mb-2 block">{f.label}</Label>
                      <Input
                        defaultValue={f.value}
                        className="rounded-xl border-gray-200 h-11"
                        onChange={e => { if (f.setter) f.setter(e.target.value); markDirty(); }}
                      />
                    </div>
                  ))}
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#088395]" />
                    Regional Settings
                  </CardTitle>
                  <CardDescription>Timezone, date format, currency, and language</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Timezone</Label>
                    <select
                      value={timezone}
                      onChange={e => { setTimezone(e.target.value); markDirty(); }}
                      className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                    >
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC+0 (Greenwich Mean Time)</option>
                      <option>UTC+5:30 (India Standard Time)</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Date Format</Label>
                    <select
                      value={dateFormat}
                      onChange={e => { setDateFormat(e.target.value); markDirty(); }}
                      className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Currency</Label>
                    <select
                      onChange={() => markDirty()}
                      className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                    >
                      <option>USD — US Dollar</option>
                      <option>EUR — Euro</option>
                      <option>GBP — British Pound</option>
                      <option>PKR — Pakistani Rupee</option>
                      <option>INR — Indian Rupee</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-700 mb-2 block">Language</Label>
                    <select
                      onChange={() => markDirty()}
                      className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                    >
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Urdu</option>
                      <option>Arabic</option>
                    </select>
                  </div>
                  <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#162E93]" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>Manage authentication and access control policies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { key: "twoFA",          label: "Two-Factor Authentication (2FA)", desc: "Require 2FA for all admin accounts"        },
                        { key: "sessionTimeout", label: "Session Timeout",                 desc: "Auto-logout after 30 min of inactivity"   },
                        { key: "ipAllowlist",    label: "IP Allowlisting",                 desc: "Restrict access to approved IP addresses" },
                        { key: "auditLogging",   label: "Audit Logging",                   desc: "Log all admin actions for compliance"     },
                        { key: "passwordPolicy", label: "Password Complexity Policy",      desc: "Enforce strong password requirements"     },
                      ].map(s => (
                        <ToggleRow
                          key={s.key}
                          label={s.label}
                          desc={s.desc}
                          checked={security[s.key]}
                          onChange={v => { setSecurity(p => ({...p,[s.key]:v})); markDirty(); }}
                        />
                      ))}
                    </div>
                    <SaveFooter onSave={handleSaveSection} isDirty={isDirty} />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                      <Key className="h-4 w-4 text-[#088395]" />
                      Change Password
                    </CardTitle>
                    <CardDescription>Update your admin account password securely</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">Current Password</Label>
                      <Input
                        type="password" placeholder="••••••••" value={passwords.current}
                        onChange={e => { setPasswords(p => ({...p,current:e.target.value})); markDirty(); }}
                        className="rounded-xl border-gray-200 h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">New Password</Label>
                      <Input
                        type="password" placeholder="••••••••" value={passwords.next}
                        onChange={e => { setPasswords(p => ({...p,next:e.target.value})); markDirty(); }}
                        className="rounded-xl border-gray-200 h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-700 mb-2 block">Confirm New Password</Label>
                      <Input
                        type="password" placeholder="••••••••" value={passwords.confirm}
                        onChange={e => { setPasswords(p => ({...p,confirm:e.target.value})); markDirty(); }}
                        className="rounded-xl border-gray-200 h-11"
                      />
                    </div>
                    {passwords.next && passwords.confirm && (
                      <div className={`flex items-center gap-2 text-xs px-4 py-3 rounded-xl ${
                        passwords.next === passwords.confirm
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-red-50 text-red-600 border border-red-100"
                      }`}>
                        {passwords.next === passwords.confirm
                          ? <><Check className="h-3.5 w-3.5 flex-shrink-0" />Passwords match</>
                          : <><X className="h-3.5 w-3.5 flex-shrink-0" />Passwords do not match</>
                        }
                      </div>
                    )}
                    <Button
                      className="w-full rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2 h-11"
                      onClick={() => {
                        showToast("Password updated successfully!", "success");
                        setPasswords({ current: "", next: "", confirm: "" });
                        markClean(activeTab);
                      }}
                    >
                      <Lock className="h-4 w-4" />Update Password
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#162E93]" />
                        Audit Logs
                      </CardTitle>
                      <CardDescription className="mt-0.5">
                        Recent system activity and user action history
                      </CardDescription>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
                      {auditLogs.length} entries
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 w-40">User</th>
                          <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500">Action Performed</th>
                          <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 w-44">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {auditLogs.length > 0 ? auditLogs.map(log => {
                          const Icon = log.icon || Settings;
                          return (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${log.color || "text-gray-500 bg-gray-100"}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">{typeof log.user === "object" ? (log.user.name ?? "—") : (log.user || "—")}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-gray-600 leading-relaxed">{log.action}</td>
                              <td className="px-4 py-3.5 text-right">
                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{log.time}</span>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs">
                              No activity logs found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button className="text-xs text-[#162E93] font-medium hover:underline flex items-center gap-1">
                      View All Logs <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {(modal === "add-employee" || modal === "add-teamlead") && (
          <Modal
            title={modal === "add-teamlead" ? "Add Team Lead" : "Add Employee"}
            onClose={() => setModal(null)}
          >
            <div className="space-y-5">
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Full Name</Label>
                <Input
                  placeholder="e.g., John Smith"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="rounded-xl border-gray-200 h-11"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Email Address</Label>
                <Input
                  type="email"
                  placeholder="john@syncflow.io"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="rounded-xl border-gray-200 h-11"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Department</Label>
                <select
                  value={newUser.dept}
                  onChange={e => setNewUser({...newUser, dept: e.target.value})}
                  className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                >
                  {depts.map(d => <option key={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-gray-200 h-11" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] h-11 gap-2" onClick={handleAddUser}>
                  <UserPlus className="h-4 w-4" />
                  Add {modal === "add-teamlead" ? "Team Lead" : "Employee"}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {modal === "remove-user" && !selectedUserId && (
          <Modal title="Remove User" onClose={() => setModal(null)}>
            <p className="text-sm text-gray-500 mb-4">
              Select a {userFilter === "All" ? "user" : userFilter.toLowerCase()} to remove:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {users.filter(u => userFilter === "All" || u.role === userFilter).map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-200 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#162E93]">
                      {u.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.role} · {u.dept}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-xl h-11" onClick={() => setModal(null)}>
              Cancel
            </Button>
          </Modal>
        )}

        {modal === "remove-user" && selectedUserId && (() => {
          const u = users.find(x => x.id === selectedUserId);
          return u ? (
            <Modal title="Confirm Removal" onClose={() => { setModal(null); setSelectedUserId(null); }}>
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
                  <UserMinus className="h-7 w-7 text-red-500" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{u.role} · {u.dept}</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Are you sure you want to remove this user? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline" className="flex-1 rounded-xl h-11"
                    onClick={() => { setModal(null); setSelectedUserId(null); }}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 h-11" onClick={handleRemoveUser}>
                    Remove User
                  </Button>
                </div>
              </div>
            </Modal>
          ) : null;
        })()}

        {modal === "dept" && (
          <Modal title="Create New Department" onClose={() => setModal(null)}>
            <div className="space-y-5">
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Department Name</Label>
                <Input
                  placeholder="e.g., Product"
                  value={newDept.name}
                  onChange={e => setNewDept({...newDept, name: e.target.value})}
                  className="rounded-xl border-gray-200 h-11"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Assign Team Lead</Label>
                <select
                  value={newDept.lead}
                  onChange={e => setNewDept({...newDept, lead: e.target.value})}
                  className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white"
                >
                  <option value="">Select a Team Lead…</option>
                  {users.filter(u => u.role === "Team Lead").map(u => (
                    <option key={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Initial Team Size</Label>
                <Input
                  type="number" min={0} placeholder="0"
                  value={newDept.members || ""}
                  onChange={e => setNewDept({...newDept, members: Number(e.target.value)})}
                  className="rounded-xl border-gray-200 h-11"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-gray-200 h-11" onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] h-11 gap-2" onClick={handleAddDept}>
                  <Building2 className="h-4 w-4" />Create Department
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {modal === "edit-user" && editingUser && (
          <Modal title="Edit User" onClose={() => { setModal(null); setEditingUser(null); }}>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Full Name</Label>
                <Input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className="rounded-xl border-gray-200 h-11" placeholder="Full name" />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Email Address</Label>
                <Input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className="rounded-xl border-gray-200 h-11" placeholder="email@syncflow.io" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Role Assigned</Label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
                  >
                    <option>Employee</option>
                    <option>Team Lead</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Department</Label>
                  <select
                    value={editingUser.dept}
                    onChange={e => setEditingUser({ ...editingUser, dept: e.target.value })}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
                  >
                    {depts.map(d => <option key={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Contact Number</Label>
                  <Input
                    value={editingUser.contact}
                    onChange={e => setEditingUser({ ...editingUser, contact: e.target.value })}
                    placeholder="+1 234 567 8900"
                    className="rounded-xl border-gray-200 h-11"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-2 block">Working Hours / Day</Label>
                  <div className="relative">
                    <Input
                      type="number" min={1} max={24}
                      value={editingUser.workingHours}
                      onChange={e => setEditingUser({ ...editingUser, workingHours: e.target.value })}
                      placeholder="8"
                      className="rounded-xl border-gray-200 h-11 pr-14"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">hrs</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
                <div className="w-7 h-7 rounded-lg bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-[#162E93]">
                    {editingUser.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">{editingUser.name}</p>
                  <p>{editingUser.role} · {editingUser.dept}</p>
                </div>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-lg font-semibold flex-shrink-0 ${editingUser.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {editingUser.status}
                </span>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl border-gray-200 h-11" onClick={() => { setModal(null); setEditingUser(null); }}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] h-11 gap-2" onClick={handleSaveEditUser}>
                  <Save className="h-4 w-4" />Save Changes
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {modal === "edit-dept" && editingDept && (
          <Modal title="Edit Department" onClose={() => { setModal(null); setEditingDept(null); }}>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Department Name</Label>
                <Input
                  value={editingDept.name}
                  onChange={e => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="rounded-xl border-gray-200 h-11"
                  placeholder="e.g., Product"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Lead By</Label>
                <select
                  value={editingDept.lead}
                  onChange={e => setEditingDept({ ...editingDept, lead: e.target.value })}
                  className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
                >
                  <option value="">Select a Team Lead…</option>
                  {users.filter(u => u.role === "Team Lead").map(u => (
                    <option key={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm text-gray-700 mb-2 block">Number of Members</Label>
                <Input
                  type="number" min={0}
                  value={editingDept.members}
                  onChange={e => setEditingDept({ ...editingDept, members: Number(e.target.value) })}
                  className="rounded-xl border-gray-200 h-11"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Department Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">Currently: <strong>{editingDept.status}</strong></p>
                </div>
                <button
                  onClick={() => setEditingDept({ ...editingDept, status: editingDept.status === "Active" ? "Inactive" : "Active" })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    editingDept.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {editingDept.status}
                </button>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 rounded-xl border-gray-200 h-11" onClick={() => { setModal(null); setEditingDept(null); }}>
                  Cancel
                </Button>
                <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] h-11 gap-2" onClick={handleSaveEditDept}>
                  <Save className="h-4 w-4" />Update Department
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {showUnsavedModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-7">
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                  </div>
                </div>

                <h3 className="text-center font-bold text-gray-900 mb-2">Unsaved Changes</h3>
                <p className="text-center text-sm text-gray-500 leading-relaxed mb-7">
                  You have unsaved changes in this section.
                  Please save before leaving, or discard your changes.
                </p>

                <div className="space-y-3">
                  <Button
                    className="w-full h-11 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2"
                    onClick={handleUnsavedSave}
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    onClick={handleUnsavedDiscard}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-11 rounded-xl text-gray-500 hover:bg-gray-100"
                    onClick={handleUnsavedCancel}
                  >
                    Stay on Page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
