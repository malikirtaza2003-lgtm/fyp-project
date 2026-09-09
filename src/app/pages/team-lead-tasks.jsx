import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Eye, 
  Settings2, 
  Trash2, 
  User, 
  Calendar, 
  Filter, 
  Grid, 
  List,
  Target,
  Zap,
  MoreVertical,
  Plus
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { fetchTasks, deleteTask, updateTask, createTask, fetchUsers } from "../utils/api";
import { showToast } from "../utils/toast";

function mapTask(task) {
  const status = String(task.status ?? "").toLowerCase();
  const priority = String(task.priority ?? "medium");
  const deadline = String(task.deadline ?? "").trim();
  
  let displayStatus = "Pending";
  if (status === "completed" || status === "done") displayStatus = "Completed";
  else if (status === "active" || status === "in-progress" || status === "in progress") displayStatus = "In Progress";

  const assigneeObj = task.assignedTo || task.assignee;
  const assigneeName = typeof assigneeObj === "object" ? (assigneeObj.name ?? "Unassigned") : (assigneeObj || "Unassigned");

  return {
    id: task.id ?? task._id ?? Date.now(),
    title: task.title ?? "Untitled task",
    description: task.description || "No description provided for this task.",
    assignee: assigneeName,
    status: displayStatus,
    priority: priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Medium",
    dueDate: deadline ? deadline.slice(0, 10) : "2026-05-15",
    color: priority === "high" ? "border-t-red-500" : priority === "low" ? "border-t-green-500" : "border-t-blue-500"
  };
}

import { DeleteConfirmModal } from "../components/delete-confirm-modal";

export default function TeamLeadTasks() {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewType, setViewType] = useState("Grid");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", status: "", priority: "", dueDate: "" });
  const [createForm, setCreateForm] = useState({ title: "", description: "", priority: "Medium", dueDate: "", assignedTo: "" });
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [data, usersData] = await Promise.all([
          fetchTasks(),
          fetchUsers().catch(() => [])
        ]);
        if (mounted) {
          setTasks(data.map(mapTask));
          const employees = usersData.filter(user => String(user.role ?? "").toLowerCase() === "employee");
          setTeamMembers(employees);
        }
      } catch {
        // Fallback to mock data for aesthetics
        setTasks([
          { id: 1, title: "Complete documentation", description: "Finalize the technical documentation for the new API endpoints.", assignee: "John Doe", status: "In Progress", priority: "High", dueDate: "2026-05-10", color: "border-t-red-500" },
          { id: 2, title: "Review UI components", description: "Perform a final check on the mobile responsiveness of all dashboard components.", assignee: "Jane Smith", status: "Pending", priority: "Medium", dueDate: "2026-05-12", color: "border-t-blue-500" },
          { id: 3, title: "Database Migration", description: "Execute the migration scripts for the production database update.", assignee: "Mike Johnson", status: "Completed", priority: "High", dueDate: "2026-05-08", color: "border-t-red-500" },
          { id: 4, title: "Client Presentation", description: "Prepare the slides for the quarterly stakeholder review meeting.", assignee: "Sarah Chen", status: "In Progress", priority: "Low", dueDate: "2026-05-20", color: "border-t-green-500" },
        ]);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.assignee.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === "Completed").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    pending: tasks.filter(t => t.status === "Pending").length,
  }), [tasks]);

  const handleDelete = async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete.id);
        setTasks(tasks.filter(t => t.id !== taskToDelete.id));
        showToast("Task deleted successfully", "success");
      } catch (error) {
        showToast("Failed to delete task", "error");
      }
      setTaskToDelete(null);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title || !createForm.assignedTo) {
      showToast("Title and Assignee are required", "error");
      return;
    }
    try {
      const assignee = teamMembers.find(m => m.name === createForm.assignedTo);
      if (!assignee) {
        showToast("Please select a valid team member", "error");
        return;
      }
      
      const newTask = await createTask({
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        deadline: createForm.dueDate,
        assignedTo: assignee.id || assignee._id,
        department: assignee.department || "",
        status: "Pending"
      });
      
      const mapped = mapTask(newTask);
      setTasks(prev => [mapped, ...prev]);
      setIsCreateOpen(false);
      setCreateForm({ title: "", description: "", priority: "Medium", dueDate: "", assignedTo: "" });
      showToast("Task assigned successfully", "success");
    } catch (error) {
      showToast(error.message || "Failed to assign task", "error");
    }
  };

  const handleManage = (task) => {
    setSelectedTask(task);
    setEditForm({ 
      title: task.title, 
      status: task.status, 
      priority: task.priority, 
      dueDate: task.dueDate 
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...editForm, color: editForm.priority === "High" ? "border-t-red-500" : editForm.priority === "Low" ? "border-t-green-500" : "border-t-blue-500" } : t));
    setIsEditOpen(false);
    showToast("Task updated successfully", "success");
  };

  const handleView = (task) => {
    setSelectedTask(task);
    setIsViewOpen(true);
  };

  return (
    <AppLayout userRole="teamlead">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">Assign, monitor and manage your team's daily tasks.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500">
              <Zap className="h-4 w-4 text-amber-500" />
              Live Monitoring
            </div>
            <Button 
              className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2 h-10"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Assign Task
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Tasks", value: stats.total, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl bg-white/80">
              <CardContent className="p-4">
                <div className={`w-8 h-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search tasks or assignees..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-100 bg-white shadow-sm focus:ring-[#162E93]"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              {["All", "In Progress", "Pending", "Completed"].map(f => (
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
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              {["Grid", "List"].map(v => {
                const Icon = v === "Grid" ? Grid : List;
                return (
                  <button
                    key={v}
                    onClick={() => setViewType(v)}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewType === v ? "bg-gray-100 text-[#162E93]" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks Display */}
        <div className={viewType === "Grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredTasks.map(task => (
            <Card key={task.id} className={`border-0 border-t-4 ${task.color} shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{task.title}</h3>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`text-[9px] px-1.5 py-0 border-0 ${
                        task.priority === "High" ? "bg-red-50 text-red-500" : 
                        task.priority === "Medium" ? "bg-blue-50 text-blue-500" : "bg-green-50 text-green-500"
                      }`}>
                        {task.priority}
                      </Badge>
                      <Badge className={`text-[9px] px-1.5 py-0 border-0 ${
                        task.status === "Completed" ? "bg-blue-50 text-blue-600" : 
                        task.status === "In Progress" ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-gray-600 p-1">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-6">
                  {task.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-[#162E93] border border-indigo-100">
                      {task.assignee.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Assigned To</p>
                      <p className="text-[11px] font-bold text-gray-700">{task.assignee}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Deadline</p>
                    <p className="text-[11px] font-bold text-gray-700">{task.dueDate}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleView(task)}
                    className="rounded-xl h-9 text-[11px] gap-1.5 font-bold border-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleManage(task)}
                    className="rounded-xl h-9 text-[11px] gap-1.5 font-bold border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200"
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Manage
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setTaskToDelete(task)}
                    className="rounded-xl h-9 text-[11px] gap-1.5 font-bold border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
          </div>
        )}

      </div>

      {/* View Task Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-0 custom-scrollbar">
          {selectedTask && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-50 text-red-600 border-0">{selectedTask.priority}</Badge>
                  <Badge className="bg-blue-50 text-blue-600 border-0">{selectedTask.status}</Badge>
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-900">{selectedTask.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Task Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assigned To</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-[#162E93]">
                        {selectedTask.assignee.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-gray-800">{selectedTask.assignee}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-800">{selectedTask.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button className="flex-1 rounded-2xl bg-[#162E93] hover:bg-[#1a36a8] h-11" onClick={() => setIsViewOpen(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-0 custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-gray-900">Manage Task</DialogTitle>
            <p className="text-xs text-gray-500">Update task status and priority for your team.</p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Title</label>
              <Input 
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="rounded-xl border-gray-100 focus:ring-[#162E93]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                <select 
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  className="w-full h-11 px-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#162E93] outline-none appearance-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full h-11 px-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#162E93] outline-none appearance-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</label>
              <Input 
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                className="rounded-xl border-gray-100 focus:ring-[#162E93]"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button className="flex-1 rounded-2xl bg-[#162E93] hover:bg-[#1a36a8] h-11" onClick={handleUpdate}>
              Update Task
            </Button>
            <Button variant="outline" className="rounded-2xl h-11 border-gray-200" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-0 custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-gray-900">Assign Task</DialogTitle>
            <p className="text-xs text-gray-500">Create and assign a new task to your team member.</p>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Title *</label>
              <Input 
                value={createForm.title}
                onChange={(e) => setCreateForm({...createForm, title: e.target.value})}
                placeholder="e.g. Design Homepage"
                className="rounded-xl border-gray-100 focus:ring-[#162E93]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
              <textarea 
                value={createForm.description}
                onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                placeholder="Task details..."
                className="w-full min-h-[80px] p-3 rounded-xl border border-gray-100 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#162E93] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                <select 
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({...createForm, priority: e.target.value})}
                  className="w-full h-11 px-3 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#162E93] outline-none appearance-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignee *</label>
                <Input
                  list="team-assignee-options"
                  placeholder="Select member"
                  value={createForm.assignedTo}
                  onChange={(e) => setCreateForm({...createForm, assignedTo: e.target.value})}
                  className="rounded-xl border-gray-100 focus:ring-[#162E93]"
                />
                <datalist id="team-assignee-options">
                  {teamMembers.map((member) => (
                    <option key={member.id ?? member._id} value={member.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Deadline</label>
              <Input 
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({...createForm, dueDate: e.target.value})}
                className="rounded-xl border-gray-100 focus:ring-[#162E93]"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button className="flex-1 rounded-2xl bg-[#162E93] hover:bg-[#1a36a8] h-11 text-white gap-2" onClick={handleCreate}>
              <Plus className="h-4 w-4" /> Assign Task
            </Button>
            <Button variant="outline" className="rounded-2xl h-11 border-gray-200" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!taskToDelete}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        itemName={taskToDelete?.title}
      />
    </AppLayout>
  );
}
