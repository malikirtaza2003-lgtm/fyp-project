import { AppLayout } from "../components/app-layout";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { 
  Folder, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Grid, 
  List, 
  MoreHorizontal,
  Eye,
  Settings2,
  Trash2,
  User,
  ExternalLink,
  Calendar as CalendarIcon,
  DollarSign
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { fetchProjects } from "../utils/api";
import { useNavigate } from "react-router";
import { showToast } from "../utils/toast";

const initialProjects = [
  { 
    id: 1, 
    name: "E-Commerce Platform", 
    priority: "High", 
    status: "Active", 
    client: "RetailMax Inc.", 
    description: "Full-stack e-commerce solution with payment integration", 
    progress: 68, 
    done: 16, 
    total: 24, 
    dueDate: "Due Apr 30, 2026", 
    value: "$45,000", 
    team: ["AJ", "MS", "DK", "PP"], 
    color: "border-t-blue-600" 
  },
  { 
    id: 2, 
    name: "Mobile App v2.0", 
    priority: "Medium", 
    status: "Active", 
    client: "StartupHub", 
    description: "Major update with new UI and offline capabilities", 
    progress: 45, 
    done: 8, 
    total: 18, 
    dueDate: "Due May 15, 2026", 
    value: "$32,000", 
    team: ["AJ", "MS", "TW"], 
    color: "border-t-[#088395]" 
  },
  { 
    id: 3, 
    name: "Admin Dashboard", 
    priority: "High", 
    status: "Active", 
    client: "Internal", 
    description: "Internal admin panel for operations management", 
    progress: 85, 
    done: 10, 
    total: 12, 
    dueDate: "Due Apr 25, 2026", 
    value: "$15,000", 
    team: ["MS", "LC"], 
    color: "border-t-blue-500" 
  },
  { 
    id: 4, 
    name: "Marketing Site Redesign", 
    priority: "Medium", 
    status: "Completed", 
    client: "BrandCo", 
    description: "Complete website overhaul with new brand identity", 
    progress: 100, 
    done: 10, 
    total: 10, 
    dueDate: "Due Apr 22, 2026", 
    value: "$22,000", 
    team: ["MS", "LC"], 
    color: "border-t-green-500" 
  },
  { 
    id: 5, 
    name: "Data Analytics Platform", 
    priority: "High", 
    status: "At Risk", 
    client: "DataViz Corp", 
    description: "Real-time analytics dashboard with custom reports", 
    progress: 25, 
    done: 8, 
    total: 30, 
    dueDate: "Due Jun 01, 2026", 
    value: "$60,000", 
    team: ["DK", "PP", "TW"], 
    color: "border-t-red-500" 
  },
  { 
    id: 6, 
    name: "API Integration Suite", 
    priority: "Low", 
    status: "On Hold", 
    client: "FinTech Ltd.", 
    description: "Third-party API integrations for banking services", 
    progress: 55, 
    done: 8, 
    total: 15, 
    dueDate: "Due May 10, 2026", 
    value: "$28,000", 
    team: ["DK", "TW"], 
    color: "border-t-amber-500" 
  },
];

import { DeleteConfirmModal } from "../components/delete-confirm-modal";

export default function TeamLeadProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewType, setViewType] = useState("Grid");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", progress: 0 });
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchProjects()
      .then((data) => {
        if (!mounted || !data || data.length === 0) return;
        // Map real data if available
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleDelete = () => {
    if (projectToDelete) {
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      showToast("Project deleted successfully", "success");
      setProjectToDelete(null);
    }
  };

  const handleView = (project) => {
    setSelectedProject(project);
    setIsViewOpen(true);
  };

  const handleManage = (project) => {
    setSelectedProject(project);
    setEditForm({ 
      name: project.name, 
      description: project.description, 
      progress: project.progress 
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    setProjects(projects.map(p => 
      p.id === selectedProject.id ? { ...p, ...editForm } : p
    ));
    setIsEditOpen(false);
    showToast("Project updated successfully", "success");
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.client.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === "Active").length,
      completed: projects.filter(p => p.status === "Completed").length,
      atRisk: projects.filter(p => p.status === "At Risk").length,
      avgProgress: Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
    };
  }, [projects]);

  return (
    <AppLayout userRole="teamlead">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage your team's assigned projects</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-sm text-xs font-bold text-indigo-600">
              <Clock className="h-4 w-4" />
              Your team's projects only
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Projects", value: stats.total, icon: Folder, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active", value: stats.active, icon: TrendingUp, color: "text-[#088395]", bg: "bg-teal-50" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "At Risk", value: stats.atRisk, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Avg Progress", value: `${stats.avgProgress}%`, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
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

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search projects or clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-100 bg-white shadow-sm focus:ring-[#162E93]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              {["All", "Active", "On Hold", "Completed", "At Risk"].map(f => (
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
            <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block" />
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              {["Grid", "List"].map(v => {
                const Icon = v === "Grid" ? Grid : List;
                return (
                  <button
                    key={v}
                    onClick={() => setViewType(v)}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewType === v 
                        ? "bg-gray-100 text-[#162E93]" 
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className={viewType === "Grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filteredProjects.map(project => (
            <Card key={project.id} className={`border-0 border-t-4 ${project.color} shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-800">{project.name}</h3>
                      <Badge className={`text-[9px] px-1.5 py-0.5 border-0 ${
                        project.priority === "High" ? "bg-red-50 text-red-500" : 
                        project.priority === "Medium" ? "bg-blue-50 text-blue-500" : "bg-green-50 text-green-500"
                      }`}>
                        {project.priority}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-gray-400">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      project.status === "Active" ? "bg-green-500 animate-pulse" : 
                      project.status === "Completed" ? "bg-blue-500" : 
                      project.status === "At Risk" ? "bg-red-500" : "bg-amber-500"
                    }`} />
                    <span className={`text-[10px] font-bold ${
                      project.status === "Active" ? "text-green-600" : 
                      project.status === "Completed" ? "text-blue-600" : 
                      project.status === "At Risk" ? "text-red-600" : "text-amber-600"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[32px]">
                  {project.description}
                </p>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progress</span>
                    <span className="text-[10px] font-bold text-gray-800">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        project.status === "At Risk" ? "bg-red-500" : "bg-blue-600"
                      }`} 
                      style={{ width: `${project.progress}%` }} 
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold text-gray-400">{project.done} of {project.total} tasks done</span>
                    <span className="text-[10px] font-bold text-gray-500">{project.dueDate}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {project.team.map((m, i) => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600 hover:z-10 cursor-pointer">
                        {m}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border-2 border-white flex items-center justify-center text-gray-300">
                      <User className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">{project.value}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleView(project)}
                    className="rounded-xl h-9 text-[11px] gap-1.5 font-bold border-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-200"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleManage(project)}
                    className="rounded-xl h-9 text-[11px] gap-1.5 font-bold border-gray-100 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200"
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Manage
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setProjectToDelete(project)}
                    className="rounded-xl h-9 text-[11px] gap-1.5 font-bold border-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50/50 hover:border-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
              <Folder className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No projects found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-xl border-gray-200"
              onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
            >
              Clear All Filters
            </Button>
          </div>
        )}

      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden border-0">
          {selectedProject && (
            <div className={`border-t-8 ${selectedProject.color}`}>
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-blue-50 text-blue-600 border-0">{selectedProject.status}</Badge>
                    <span className="text-xs font-bold text-gray-400">{selectedProject.priority} Priority</span>
                  </div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">{selectedProject.name}</DialogTitle>
                  <p className="text-sm font-bold text-[#088395]">{selectedProject.client}</p>
                </DialogHeader>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedProject.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Deadline</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">{selectedProject.dueDate}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Budget</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">{selectedProject.value}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Progress Overview</h4>
                      <span className="text-sm font-bold text-blue-600">{selectedProject.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedProject.progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-500">{selectedProject.done} Completed</span>
                      <span className="text-xs text-gray-500">{selectedProject.total - selectedProject.done} Remaining</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Project Team</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.team.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-[#162E93] flex items-center justify-center text-[10px] font-bold">
                            {m}
                          </div>
                          <span className="text-xs font-medium text-gray-700">Team Member</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <Button 
                    className="flex-1 rounded-2xl bg-[#162E93] hover:bg-[#1a36a8] h-11"
                    onClick={() => navigate("/teamlead/tasks")}
                  >
                    View Project Tasks
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-2xl h-11 border-gray-200"
                    onClick={() => setIsViewOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-0">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">Manage Project</DialogTitle>
            <p className="text-xs text-gray-500">Edit project details and track progress</p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Name</label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="rounded-xl border-gray-100 focus:ring-[#162E93]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
              <textarea 
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="w-full h-24 p-3 text-sm rounded-xl border border-gray-100 focus:ring-2 focus:ring-[#162E93] outline-none resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progress ({editForm.progress}%)</label>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={editForm.progress}
                onChange={(e) => setEditForm({...editForm, progress: parseInt(e.target.value)})}
                className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#162E93]"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button 
              className="flex-1 rounded-2xl bg-[#162E93] hover:bg-[#1a36a8] h-11"
              onClick={handleUpdate}
            >
              Update Project
            </Button>
            <Button 
              variant="outline" 
              className="rounded-2xl h-11 border-gray-200"
              onClick={() => setIsEditOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal
        open={!!projectToDelete}
        onCancel={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        itemName={projectToDelete?.name}
      />
    </AppLayout>
  );
}
