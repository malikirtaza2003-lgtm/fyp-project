import { useEffect, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Search, X, Calendar, User, Briefcase, ClipboardList, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getCurrentRole } from "../utils/auth";
import { showToast } from "../utils/toast";
import { createTask as createTaskApi, deleteTask as deleteTaskApi, fetchDepartments, fetchProjects, fetchTasks, fetchUsers, updateTask as updateTaskApi } from "../utils/api";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";
const initialTasks = [];
const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["Active", "Pending", "Completed"];
function priorityBadge(p) {
  const base = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold";
  if (p === "High") return `${base} bg-red-100 text-red-700 border border-red-200`;
  if (p === "Medium") return `${base} bg-amber-100 text-amber-700 border border-amber-200`;
  return `${base} bg-green-100 text-green-700 border border-green-200`;
}
function priorityDot(p) {
  if (p === "High") return "bg-red-500";
  if (p === "Medium") return "bg-amber-500";
  return "bg-green-500";
}
function statusBadge(s) {
  const base = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold";
  if (s === "Active") return `${base} bg-blue-100 text-blue-700 border border-blue-200`;
  if (s === "Completed") return `${base} bg-green-100 text-green-700 border border-green-200`;
  return `${base} bg-gray-100 text-gray-600 border border-gray-200`;
}
function fmtDate(d) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function getDeptForEmployee(name, users) {
  return users.find((user) => user.name === name)?.department ?? "";
}

function mapTask(task) {
  const id = task._id ?? task.id;

  if (!id) {
    return null;
  }

  const assignedToValue = task.assignedTo;
  const assignedByValue = task.assignedBy;

  return {
    id,
    _id: id,
    title: task.title ?? "",
    description: task.description ?? "",
    priority: task.priority ?? "Medium",
    project: task.project ?? "",
    assignedTo: typeof assignedToValue === "object" ? (assignedToValue.name ?? "") : (assignedToValue ?? ""),
    department: task.department ?? "",
    assignedBy: typeof assignedByValue === "object" ? (assignedByValue.name ?? "") : (assignedByValue ?? ""),
    assignedToId: task.assignedToId ?? (typeof assignedToValue === "object" ? assignedToValue._id || assignedToValue.id : assignedToValue) ?? null,
    assignedById: task.assignedById ?? (typeof assignedByValue === "object" ? assignedByValue._id || assignedByValue.id : assignedByValue) ?? null,
    dueDate: task.deadline ?? task.dueDate ?? "",
    status: task.status ?? "Pending",
    progress: task.progress ?? 0,
  };
}
const emptyForm = {
  title: "",
  description: "",
  priority: "Medium",
  project: "",
  assignedTo: "",
  department: "",
  assignedBy: "",
  dueDate: "",
  status: "Pending"
};
function TaskFormModal({ open, onClose, onSave, initialData, mode, users, departments, projects }) {
  const [form, setForm] = useState(
    initialData ? { ...initialData } : { ...emptyForm }
  );
  const handleOpenChange = (val) => {
    if (!val) {
      onClose();
      return;
    }
    setForm(initialData ? { ...initialData } : { ...emptyForm });
  };
  const change = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "assignedTo") {
        next.department = getDeptForEmployee(value, users);
      }
      return next;
    });
  };
  const handleSave = () => {
    if (!form.title.trim()) {
      showToast("Task title is required.", "error");
      return;
    }
    onSave(form);
  };
  const title = mode === "create" ? "Create New Task" : `Edit Task`;
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {
    /* Title */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Task Title <span className="text-red-500">*</span></Label>
            <Input
    placeholder="e.g. Build login page"
    value={form.title}
    onChange={(e) => change("title", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
          </div>

          {
    /* Description */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Description</Label>
            <Textarea
    placeholder="Describe what needs to be done…"
    rows={3}
    value={form.description}
    onChange={(e) => change("description", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93] resize-none"
  />
          </div>

          {
    /* Priority (full-width now that Status is removed) */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Priority</Label>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => <button
    key={p}
    type="button"
    onClick={() => change("priority", p)}
    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${form.priority === p ? p === "High" ? "bg-red-100 border-red-400 text-red-700" : p === "Medium" ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-green-100 border-green-400 text-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
  >
                  {p}
                </button>)}
            </div>
          </div>

          {
    /* Project + Due Date */
  }
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Project</Label>
              <select
    value={form.project}
    onChange={(e) => change("project", e.target.value)}
    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
  >
                <option value="">Select project</option>
                {projects.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Deadline</Label>
              <Input
    type="date"
    value={form.dueDate}
    onChange={(e) => change("dueDate", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
            </div>
          </div>

          {
    /* Assigned To + Department */
  }
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Assigned To</Label>
              <Input
    list="task-assignee-options"
    placeholder="e.g. Ali Khan"
    value={form.assignedTo}
    onChange={(e) => change("assignedTo", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              <datalist id="task-assignee-options">
                {users.map((user) => (
                  <option key={user.id ?? user._id ?? user.email} value={user.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Department</Label>
              <Input
    list="task-department-options"
    value={form.department}
    onChange={(e) => change("department", e.target.value)}
    placeholder="e.g. Engineering"
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              <datalist id="task-department-options">
                {departments.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>
          </div>

          {
    /* Actions */
  }
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white" onClick={handleSave}>
              {mode === "create" ? <><Plus className="h-4 w-4 mr-2" />Create Task</> : <><Edit className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
function ViewTaskModal({ task, onClose }) {
  const progress = task.status === "Completed" ? 100 : task.status === "Active" ? 55 : 15;
  const progressColor = task.status === "Completed" ? "bg-green-500" : task.status === "Active" ? "bg-[#162E93]" : "bg-amber-400";
  return <Dialog open onOpenChange={(v) => {
    if (!v) onClose();
  }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl">
        {
    /* ── Header ── */
  }
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#088395] mb-1">Task Details</p>
              <DialogTitle className="text-xl font-bold text-gray-900 leading-snug">{task.title}</DialogTitle>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={priorityBadge(task.priority)}>
                <span className={`w-1.5 h-1.5 rounded-full ${priorityDot(task.priority)}`} />
                {task.priority} Priority
              </span>
              <span className={statusBadge(task.status)}>{task.status}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          {
    /* ── Description ── */
  }
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Description</p>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">
                {task.description || "No description provided for this task."}
              </p>
            </div>
          </div>

          {
    /* ── Details Grid ── */
  }
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Task Information</p>
            <div className="grid grid-cols-2 gap-3">
              {
    /* Project */
  }
              <div className="flex items-start gap-3 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#162E93]/8 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-4 w-4 text-[#162E93]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Project</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{task.project || "\u2014"}</p>
                </div>
              </div>

              {
    /* Assigned To */
  }
              <div className="flex items-start gap-3 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Assigned To</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{task.assignedTo || "\u2014"}</p>
                </div>
              </div>

              {
    /* Department */
  }
              <div className="flex items-start gap-3 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Department</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{task.department || "\u2014"}</p>
                </div>
              </div>

              {
    /* Deadline */
  }
              <div className="flex items-start gap-3 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Deadline</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{fmtDate(task.dueDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {
    /* ── Progress ── */
  }
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Progress</p>
            <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {task.status === "Completed" ? <CheckCircle className="h-4 w-4 text-green-500" /> : task.status === "Active" ? <Clock className="h-4 w-4 text-[#162E93]" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                  <span className="text-sm font-medium text-gray-700">
                    {task.status === "Completed" ? "Task completed" : task.status === "Active" ? "In progress" : "Not started yet"}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
    className={`h-full rounded-full transition-all ${progressColor}`}
    style={{ width: `${progress}%` }}
  />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Start</span>
                <span>Complete</span>
              </div>
            </div>
          </div>

          {
    /* ── Footer close button ── */
  }
          <div className="pt-1">
            <Button
    variant="outline"
    className="w-full rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
    onClick={onClose}
  >
              <X className="h-4 w-4 mr-2" />Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}

function RowActions({ task, onView, onEdit, onDelete }) {
  return <div className="flex gap-1">
      <button
    onClick={onView}
    title="View Details"
    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#162E93]/10 hover:text-[#162E93] text-gray-500 transition-colors"
  >
        <Eye className="h-4 w-4" />
      </button>
      <button
    onClick={onEdit}
    title="Edit Task"
    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 text-gray-500 transition-colors"
  >
        <Edit className="h-4 w-4" />
      </button>
      <button
    onClick={onDelete}
    title="Delete Task"
    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors"
  >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>;
}
function TaskTable({ tasks, userRole, showDept = true, onView, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <div className="text-center py-12 text-gray-400">
        <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
        <p className="text-sm">No tasks found.</p>
      </div>;
  }
  return <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80">
            <TableHead className="font-semibold text-gray-700 min-w-[180px]">Task</TableHead>
            <TableHead className="font-semibold text-gray-700">Priority</TableHead>
            <TableHead className="font-semibold text-gray-700">Project</TableHead>
            <TableHead className="font-semibold text-gray-700">Assigned To</TableHead>
            {showDept && <TableHead className="font-semibold text-gray-700">Department</TableHead>}
            <TableHead className="font-semibold text-gray-700">Assigned By</TableHead>
            <TableHead className="font-semibold text-gray-700">Deadline</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            {userRole === "admin" && <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => <TableRow key={task.id} className="hover:bg-gray-50/60 transition-colors">
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className={priorityBadge(task.priority)}>
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityDot(task.priority)}`} />
                  {task.priority}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-700">{task.project || "\u2014"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#162E93]">
                      {task.assignedTo.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-800 font-medium">{task.assignedTo || "\u2014"}</span>
                </div>
              </TableCell>
              {showDept && <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                    {task.department || "\u2014"}
                  </span>
                </TableCell>}
              <TableCell className="text-sm text-gray-600">{task.assignedBy || "\u2014"}</TableCell>
              <TableCell className="text-sm text-gray-600 whitespace-nowrap">{fmtDate(task.dueDate)}</TableCell>
              <TableCell>
                <span className={statusBadge(task.status)}>{task.status}</span>
              </TableCell>
              {userRole === "admin" && <TableCell>
                  <div className="flex justify-center">
                    <RowActions
    task={task}
    onView={() => onView(task)}
    onEdit={() => onEdit(task)}
    onDelete={() => onDelete(task)}
  />
                  </div>
                </TableCell>}
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
}
function Tasks() {
  const userRole = getCurrentRole();
  const [tasks, setTasks] = useState(initialTasks);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const displayTasks = tasks;
  const assigneeOptions = users.filter((user) => String(user.role ?? "").toLowerCase() !== "admin");
  const projectOptions = projects.filter(Boolean);
  const departmentOptions = departments.filter(Boolean);

  const resolveUser = (value) => {
    if (!value) return null;
    return (
      assigneeOptions.find((user) => (user._id === value || user.id === value)) ||
      assigneeOptions.find((user) => user.email === value) ||
      assigneeOptions.find((user) => user.name === value)
    );
  };

  useEffect(() => {
    let mounted = true;

    async function loadTasks() {
      try {
        const [taskData, userData, projectData, departmentData] = await Promise.all([
          fetchTasks(),
          fetchUsers(),
          fetchProjects(),
          fetchDepartments(),
        ]);
        if (mounted) {
          const mappedTasks = taskData.map(mapTask).filter(Boolean);
          setTasks(mappedTasks);
          setUsers(userData ?? []);
          setProjects((projectData ?? []).map((project) => project.title ?? project.name ?? "").filter(Boolean));
          setDepartments((departmentData ?? []).map((dept) => dept.name ?? "").filter(Boolean));
        }
      } catch {
        if (mounted) {
          setTasks([]);
          setUsers([]);
          setProjects([]);
          setDepartments([]);
        }
      }
    }

    loadTasks();

    return () => {
      mounted = false;
    };
  }, []);
  const filtered = displayTasks.filter(
    (t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) || t.assignedBy.toLowerCase().includes(searchQuery.toLowerCase()) || t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const byStatus = (s) => filtered.filter((t) => t.status === s);
  const handleCreate = async (data) => {
    try {
      const assignee = resolveUser(data.assignedTo);

      if (!assignee) {
        showToast("Please select a valid assignee.", "error");
        return;
      }

      const savedTask = await createTaskApi({
        ...data,
        assignedTo: assignee.id || assignee._id,
        department: assignee.department || data.department,
        deadline: data.dueDate,
      });
      const mapped = mapTask(savedTask);
      if (mapped) {
        setTasks((prev) => [mapped, ...prev]);
      }
      setCreateOpen(false);
      showToast(`"${data.title}" has been created.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to create task.", "error");
    }
  };
  const handleEdit = async (data) => {
    if (!editTask) return;
    try {
      const assignee = resolveUser(data.assignedTo);

      if (!assignee) {
        showToast("Please select a valid assignee.", "error");
        return;
      }

      const targetId = String(editTask._id || editTask.id || "");
      if (!targetId || targetId === "undefined" || targetId === "null") {
        showToast("Task ID is missing or invalid.", "error");
        return;
      }

      // Explicitly define the update payload to avoid sending extra fields like 'id' or '_id'
      const updateData = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        project: data.project,
        department: assignee.department || data.department,
        assignedTo: String(assignee._id || assignee.id),
        deadline: data.dueDate,
        status: data.status,
        progress: data.progress,
      };

      const savedTask = await updateTaskApi(targetId, updateData);
      const mapped = mapTask(savedTask);
      if (mapped) {
        setTasks((prev) => prev.map((t) => (String(t._id || t.id) === targetId) ? mapped : t));
      }
      setEditTask(null);
      showToast(`"${data.title}" has been updated.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to update task.", "error");
    }
  };
  const handleDelete = async () => {
    if (!deleteTask) return;
    try {
      const targetId = deleteTask._id || deleteTask.id;
      await deleteTaskApi(targetId);
      setTasks((prev) => prev.filter((t) => (t._id !== targetId && t.id !== targetId)));
      showToast(`"${deleteTask.title}" has been deleted.`, "success");
      setDeleteTask(null);
    } catch (error) {
      showToast(error.message || "Unable to delete task.", "error");
    }
  };
  const tableProps = {
    userRole,
    onView: (t) => setViewTask(t),
    onEdit: (t) => setEditTask(t),
    onDelete: (t) => setDeleteTask(t)
  };
  return <AppLayout userRole={userRole}>
      <div className="space-y-6">

        {
    /* ── Header ── */
  }
        <div className="flex items-center justify-between">
          <div>
            <h1>Task Management</h1>
            <p className="text-muted-foreground">Manage and track all tasks</p>
          </div>
          {userRole === "admin" && <Button
    className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2"
    onClick={() => setCreateOpen(true)}
  >
              <Plus className="h-4 w-4" />
              New Task
            </Button>}
        </div>

        {
    /* ── Search ── */
  }
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
    placeholder="Search tasks, employees, departments…"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 rounded-xl border-gray-200 bg-white"
  />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>}
        </div>

        {
    /* ── Tabs ── */
  }
        <Tabs defaultValue="all">
          <TabsList className="rounded-xl">
            <TabsTrigger value="all">All Tasks ({filtered.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({byStatus("Active").length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({byStatus("Pending").length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({byStatus("Completed").length})</TabsTrigger>
          </TabsList>

          {
    /* All Tasks */
  }
          <TabsContent value="all" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>All Tasks</CardTitle>
                <CardDescription>Complete list of tasks with employee and assignment details</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <TaskTable tasks={filtered} showDept {...tableProps} />
              </CardContent>
            </Card>
          </TabsContent>

          {
    /* Active */
  }
          <TabsContent value="active" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Tasks currently in progress</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <TaskTable tasks={byStatus("Active")} showDept {...tableProps} />
              </CardContent>
            </Card>
          </TabsContent>

          {
    /* Pending */
  }
          <TabsContent value="pending" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Pending Tasks</CardTitle>
                <CardDescription>Tasks awaiting action or assignment</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <TaskTable tasks={byStatus("Pending")} showDept {...tableProps} />
              </CardContent>
            </Card>
          </TabsContent>

          {
    /* Completed */
  }
          <TabsContent value="completed" className="mt-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Completed Tasks</CardTitle>
                <CardDescription>Successfully finished tasks</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <TaskTable tasks={byStatus("Completed")} showDept {...tableProps} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {
    /* ── Modals ── */
  }
      {
    /* Create */
  }
      <TaskFormModal
    open={createOpen}
    onClose={() => setCreateOpen(false)}
    onSave={handleCreate}
    initialData={null}
    mode="create"
    users={assigneeOptions}
    departments={departmentOptions}
    projects={projectOptions}
  />

      {
    /* Edit */
  }
      {editTask && <TaskFormModal
    open={!!editTask}
    onClose={() => setEditTask(null)}
    onSave={handleEdit}
    initialData={editTask}
    mode="edit"
    users={assigneeOptions}
    departments={departmentOptions}
    projects={projectOptions}
  />}

      {
    /* View */
  }
      {viewTask && <ViewTaskModal task={viewTask} onClose={() => setViewTask(null)} />}

      {
    /* Delete */
  }
      {/* Delete */}
      <DeleteConfirmModal
        open={!!deleteTask}
        onCancel={() => setDeleteTask(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        itemName={deleteTask?.title}
      />
    </AppLayout>;
}
export {
  Tasks as default
};
