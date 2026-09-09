import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { 
  Plus, 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Calendar, 
  Target, 
  Activity, 
  TrendingUp,
  Filter,
  CheckSquare,
  Play,
  Pause,
  RotateCcw,
  Square,
  ClipboardList
} from "lucide-react";
import { createTask, deleteTask, fetchTasks, updateTask } from "../utils/api";
import { getCurrentUser } from "../utils/auth";
import { showToast } from "../utils/toast";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";

function StatusBadge({ status }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all";
  const st = String(status).toLowerCase();
  if (st === "completed" || st === "done") return <span className={`${base} bg-green-100 text-green-700 border-green-200`}><CheckCircle2 className="h-3 w-3" /> Completed</span>;
  if (st === "active" || st === "in-progress" || st === "in progress") return <span className={`${base} bg-[#162E93] text-white border-[#162E93]`}><Activity className="h-3 w-3" /> Active</span>;
  if (st === "paused") return <span className={`${base} bg-amber-100 text-amber-700 border-amber-200`}><Pause className="h-3 w-3" /> Paused</span>;
  return <span className={`${base} bg-gray-100 text-gray-700 border-gray-200`}><Clock className="h-3 w-3" /> Pending</span>;
}

function PriorityBadge({ priority }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight border";
  const p = String(priority).toLowerCase();
  if (p === "high") return <span className={`${base} bg-red-50 text-red-600 border-red-100`}>High</span>;
  if (p === "medium") return <span className={`${base} bg-amber-50 text-amber-600 border-amber-100`}>Medium</span>;
  return <span className={`${base} bg-blue-50 text-blue-600 border-blue-100`}>Low</span>;
}

function ViewTaskModal({ task, onClose }) {
  if (!task) return null;
  return (
    <Dialog open={!!task} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#162E93]/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-[#162E93]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
              <DialogDescription>Full task details and progress</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={task.status} />
            </div>
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Priority</p>
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
              {task.description || "No description provided for this task."}
            </p>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#162E93]/5 rounded-xl border border-[#162E93]/10">
            <div className="flex items-center gap-2 text-[#162E93]">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-bold">Deadline</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{task.dueDate}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase text-gray-400 tracking-wider">
              <span>Task Progress</span>
              <span className="text-[#162E93]">{task.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#162E93] rounded-full transition-all duration-700" 
                style={{ width: `${task.progress}%` }} 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function mapTask(task) {
  const status = String(task.status ?? "pending").toLowerCase();
  const deadline = String(task.deadline ?? "").trim();
  return {
    id: task.id ?? task._id ?? Date.now(),
    title: task.title ?? "Untitled task",
    description: task.description ?? "",
    project: task.project ?? "Personal",
    status: status === "active" || status === "in-progress" || status === "in progress"
      ? "active"
      : status === "paused"
        ? "paused"
        : status === "completed" || status === "done"
          ? "completed"
          : "pending",
    priority: task.priority ?? "medium",
    dueDate: deadline ? deadline.slice(0, 10) : task.dueDate ?? task.createdAt?.slice?.(0, 10) ?? new Date().toISOString().split("T")[0],
    progress: task.progress ?? (status === "completed" ? 100 : status === "active" ? 50 : 0)
  };
}

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewTask, setViewTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    let mounted = true;
    const user = getCurrentUser();

    async function loadTasks() {
      try {
        const data = await fetchTasks();
        if (!mounted) return;
        
        // Filter for current employee
        const userTasks = data.filter(t => 
          t.assignedTo === user?.name || t.assignedToId === user?.id || t.assignedToId === user?._id
        ).map(mapTask);
        
        setTasks(userTasks);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTasks();
    return () => { mounted = false; };
  }, []);

  const handleDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id)
        .then(() => {
          setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
          showToast("Task removed", "info");
          setTaskToDelete(null);
        })
        .catch(err => showToast(err.message || "Unable to delete", "error"));
    }
  };

  const handleStatusUpdate = (taskId, nextStatus) => {
    let backendStatus = nextStatus;
    if (nextStatus === "active") backendStatus = "in-progress";
    
    updateTask(taskId, { status: backendStatus })
      .then(updated => {
        setTasks(prev => prev.map(t => t.id === taskId ? mapTask(updated) : t));
        showToast(`Task marked as ${nextStatus}`, "success");
      })
      .catch(err => showToast(err.message || "Failed to update", "error"));
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.project.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "Active", value: tasks.filter(t => t.status === "active").length, icon: Activity, color: "text-[#162E93]", bg: "bg-[#162E93]/10" },
    { label: "Completed", value: tasks.filter(t => t.status === "completed").length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Pending", value: tasks.filter(t => t.status === "pending").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Completion", value: `${tasks.length ? Math.round((tasks.filter(t => t.status === "completed").length / tasks.length) * 100) : 0}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <AppLayout userRole="employee">
      <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-500 mt-1">Manage and track your daily work assignments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#162E93]/10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-xl overflow-hidden group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="ghost" className="text-[10px] font-bold text-gray-400">STATUS</Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 leading-none">{s.value}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-gray-300">
              <CheckSquare className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or add a new task.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">{task.title}</CardTitle>
                  <CardDescription className="text-xs font-medium text-gray-400">
                    {task.project} Project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {task.dueDate}
                    </div>
                    <span>{task.progress}% Done</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${task.status === 'completed' ? 'bg-green-500' : 'bg-[#162E93]'}`}
                      style={{ width: `${task.progress}%` }} 
                    />
                  </div>
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {task.status === 'pending' && (
                      <Button 
                        size="sm" 
                        className="flex-1 rounded-xl h-9 gap-1.5 bg-[#162E93] hover:bg-[#1a36a8]"
                        onClick={() => handleStatusUpdate(task.id, 'active')}
                      >
                        <Play className="h-3.5 w-3.5" /> Start
                      </Button>
                    )}

                    {task.status === 'active' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 rounded-xl h-9 gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => handleStatusUpdate(task.id, 'paused')}
                        >
                          <Pause className="h-3.5 w-3.5" /> Pause
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 rounded-xl h-9 gap-1.5 bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusUpdate(task.id, 'completed')}
                        >
                          <CheckSquare className="h-3.5 w-3.5" /> Complete
                        </Button>
                      </>
                    )}

                    {task.status === 'paused' && (
                      <>
                        <Button 
                          size="sm" 
                          className="flex-1 rounded-xl h-9 gap-1.5 bg-[#162E93] hover:bg-[#1a36a8]"
                          onClick={() => handleStatusUpdate(task.id, 'active')}
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Resume
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 rounded-xl h-9 gap-1.5 bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusUpdate(task.id, 'completed')}
                        >
                          <CheckSquare className="h-3.5 w-3.5" /> Complete
                        </Button>
                      </>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl h-9 border-gray-200 hover:bg-gray-50 px-3"
                      onClick={() => setViewTask(task)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl h-9 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 px-3"
                      onClick={() => setTaskToDelete(task)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewTask && <ViewTaskModal task={viewTask} onClose={() => setViewTask(null)} />}

        <DeleteConfirmModal
          open={!!taskToDelete}
          onCancel={() => setTaskToDelete(null)}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
          itemName={taskToDelete?.title}
        />
      </div>
    </AppLayout>
  );
}
