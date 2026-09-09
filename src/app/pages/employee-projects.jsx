import { useState, useEffect } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Users, 
  Calendar, 
  TrendingUp, 
  Target,
  Search,
  Activity,
  CheckCircle,
  Circle,
  ClipboardList
} from "lucide-react";
import { fetchProjects, fetchTasks } from "../utils/api";
import { getCurrentUser } from "../utils/auth";
import { showToast } from "../utils/toast";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";

function StatusBadge({ status }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all";
  if (status === "Completed") return <span className={`${base} bg-green-100 text-green-700 border-green-200 shadow-sm`}><CheckCircle2 className="h-3 w-3" /> Completed</span>;
  if (status === "In Progress") return <span className={`${base} bg-blue-100 text-blue-700 border-blue-200 shadow-sm`}><Activity className="h-3 w-3" /> In Progress</span>;
  return <span className={`${base} bg-amber-100 text-amber-700 border-amber-200 shadow-sm`}><Clock className="h-3 w-3" /> Pending</span>;
}

function ViewDetailsModal({ project, onClose }) {
  if (!project) return null;
  const tasks = project.tasks || [];
  
  const taskIcon = (s) => {
    const st = String(s).toLowerCase();
    if (st === "done" || st === "completed") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (st === "in-progress" || st === "in progress" || st === "active") return <Activity className="h-4 w-4 text-[#162E93]" />;
    return <Circle className="h-4 w-4 text-gray-300" />;
  };

  return (
    <Dialog open={!!project} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#162E93]/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-[#162E93]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{project.name}</DialogTitle>
              <DialogDescription>Project overview and your assigned tasks</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <p className="text-sm font-bold text-gray-800">{project.status}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Priority</p>
              <p className="text-sm font-bold text-gray-800">{project.priority}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Progress</p>
              <p className="text-sm font-bold text-gray-800">{project.progress}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Deadline</p>
              <p className="text-sm font-bold text-gray-800">{project.deadline || "None"}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-gray-800">Project Tasks</h4>
              <Badge variant="outline" className="rounded-lg">{tasks.length} Total</Badge>
            </div>
            <div className="space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gray-100 hover:border-[#162E93]/20 transition-all group">
                    {taskIcon(task.status)}
                    <span className={`flex-1 text-sm font-medium ${String(task.status).toLowerCase() === 'completed' ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {task.title || task.name}
                    </span>
                    <Badge variant="ghost" className="text-[10px] font-bold text-[#162E93] bg-[#162E93]/5 rounded-lg group-hover:bg-[#162E93] group-hover:text-white transition-colors">
                      {task.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No tasks listed for this project</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeeProjects() {
  const [projectItems, setProjectItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewProject, setViewProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    let mounted = true;
    const user = getCurrentUser();

    async function loadProjects() {
      try {
        const [data, tasksData] = await Promise.all([fetchProjects(), fetchTasks()]);
        if (!mounted) return;

        const filtered = data;

        const mapped = data.map((project) => {
          const projectTasks = tasksData.filter(t => t.project === (project.title || project.name));
          const userTasks = projectTasks.filter(t => t.assignedTo === user?.name || t.assignedToId === user?.id || t.assignedToId === user?._id || t.assignedTo?._id === user?._id);
          
          const completed = projectTasks.filter((task) => {
            const s = String(task.status).toLowerCase();
            return s === "done" || s === "completed";
          }).length;
          const total = projectTasks.length || Number(project.totalTasks ?? 0);
          const progress = total > 0 ? Math.round((completed / total) * 100) : Number(project.progress ?? project.goalCompleted ?? 0);
          
          return {
            id: project.id ?? project._id ?? Date.now(),
            name: project.title ?? project.name ?? "Untitled Project",
            status: project.status || (progress >= 100 ? "Completed" : progress > 0 ? "In Progress" : "Pending"),
            progress: Number(progress) || 0,
            deadline: project.deadline || project.dueDate || "Not Set",
            priority: project.priority || "Medium",
            tasks: projectTasks,
            userTasks: userTasks,
            memberCount: project.teamMembers?.length || project.members?.length || 1,
            members: project.selectedMemberNames || project.members || []
          };
        });
        setProjectItems(mapped);
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProjects();
    return () => { mounted = false; };
  }, []);

  const filteredProjects = projectItems.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "Active Projects", value: projectItems.filter(p => p.status !== "Completed").length, icon: Briefcase, color: "text-[#162E93]", bg: "bg-[#162E93]/10" },
    { label: "Completed", value: projectItems.filter(p => p.status === "Completed").length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { label: "Total Tasks", value: projectItems.reduce((acc, p) => acc + p.userTasks.length, 0), icon: Target, color: "text-[#088395]", bg: "bg-[#088395]/10" },
    { label: "Average Progress", value: `${projectItems.length ? Math.round(projectItems.reduce((sum, p) => sum + p.progress, 0) / projectItems.length) : 0}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  const handleDeleteProject = () => {
    if (projectToDelete) {
      // For employees, we'll just remove it from their view (simulated since it's an assignment)
      setProjectItems(prev => prev.filter(p => p.id !== projectToDelete.id));
      showToast("Project removed from your view", "info");
      setProjectToDelete(null);
    }
  };

  return (
    <AppLayout userRole="employee">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-gray-900">My Projects</h1>
            <p className="text-gray-500 mt-1">Overview of your assigned projects and contributions</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#162E93]/10 transition-all"
            />
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
                  <Badge variant="ghost" className="bg-gray-50 text-gray-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">Live</Badge>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 leading-none">{s.value}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No projects found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">You don't have any projects assigned yet or matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => (
              <Card key={proj.id} className="border-0 shadow-sm rounded-xl overflow-hidden group hover:shadow-md transition-all flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#162E93] flex items-center justify-center text-white shadow-sm transition-transform">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <StatusBadge status={proj.status} />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900">{proj.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1">
                    <Calendar className="h-3.5 w-3.5" /> Deadline: <span className="font-semibold text-gray-700">{proj.deadline}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Overall Progress</span>
                      <span className="font-bold text-gray-900">{proj.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#162E93] to-[#088395] rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${proj.progress}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-y border-gray-50">
                    <div className="flex -space-x-2">
                      {proj.members.slice(0, 3).map((m, i) => (
                        <Avatar key={i} className="h-7 w-7 rounded-lg border-2 border-white shadow-sm">
                          <AvatarFallback className="rounded-lg bg-[#162E93]/10 text-[#162E93] text-[9px] font-bold">
                            {m.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {proj.members.length > 3 && (
                        <div className="h-7 w-7 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-500">
                          +{proj.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Tasks</p>
                      <p className="text-xs font-bold text-gray-800">{proj.userTasks.length} Assigned</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold h-10 gap-2"
                      onClick={() => setViewProject(proj)}
                    >
                      <Eye className="h-4 w-4" /> View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-10 h-10 rounded-xl border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all p-0"
                      onClick={() => setProjectToDelete(proj)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewProject && (
          <ViewDetailsModal 
            project={viewProject} 
            onClose={() => setViewProject(null)} 
          />
        )}

        <DeleteConfirmModal
          open={!!projectToDelete}
          onCancel={() => setProjectToDelete(null)}
          onConfirm={handleDeleteProject}
          title="Remove Project"
          message={`Are you sure you want to remove "${projectToDelete?.name}" from your view?`}
          itemName={projectToDelete?.name}
        />
      </div>
    </AppLayout>
  );
}
