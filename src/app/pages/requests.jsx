import { useEffect, useState } from "react";
import { getCurrentRole, getCurrentUser } from "../utils/auth";
import { getTeamMembers } from "../utils/team-data";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { approveLeave, createLeave, deleteLeave, fetchLeaves, rejectLeave } from "../utils/api";
const initialRequests = [];
function Requests() {
  const userRole = getCurrentRole();
  const [requests, setRequests] = useState(initialRequests);
  const [newRequest, setNewRequest] = useState({ title: "", description: "", priority: "medium" });
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    requestId: null,
    requestTitle: ""
  });
  const currentUser = getCurrentUser();
  const teamMembers = userRole === "teamlead" ? getTeamMembers(currentUser?.name || "Sarah Chen") : [];
  useEffect(() => {
    fetchLeaves()
      .then((leaves) => {
        const mapped = leaves.map((leave) => {
          const empVal = leave.employee || leave.user;
          const empName = typeof empVal === "object" ? (empVal.name ?? "Employee") : (empVal ?? "Employee");
          return {
            id: leave.id,
            employee: empName,
            title: leave.type || leave.leaveType || "Leave Request",
            description: leave.reason || "No details",
            priority: String(leave.priority || "Medium"),
            status: String(leave.status || "Pending"),
            date: String(leave.startDate || leave.date || "").slice(0, 10),
          };
        });
        if (mapped.length > 0) {
          setRequests(mapped);
        }
      })
      .catch(() => {});
  }, []);
  const displayRequests = userRole === "teamlead" ? requests.filter((req) => teamMembers.includes(req.employee)) : requests;
  const handleApprove = (requestId) => {
    approveLeave(requestId)
      .then((updated) => {
        setRequests((prev) => prev.map((req) => req.id === requestId ? { ...req, status: updated.status || "Approved" } : req));
      })
      .catch(() => {});
  };
  const handleReject = (requestId) => {
    rejectLeave(requestId)
      .then((updated) => {
        setRequests((prev) => prev.map((req) => req.id === requestId ? { ...req, status: updated.status || "Rejected" } : req));
      })
      .catch(() => {});
  };
  const handleDeleteClick = (requestId, requestTitle) => {
    setDeleteModal({ open: true, requestId, requestTitle });
  };
  const handleDeleteConfirm = () => {
    if (deleteModal.requestId !== null) {
      deleteLeave(deleteModal.requestId)
        .then(() => {
          setRequests((prev) => prev.filter((req) => req.id !== deleteModal.requestId));
          setDeleteModal({ open: false, requestId: null, requestTitle: "" });
        })
        .catch(() => {});
    }
  };
  const handleDeleteCancel = () => {
    setDeleteModal({ open: false, requestId: null, requestTitle: "" });
  };
  const filteredRequests = priorityFilter === "all" ? displayRequests : displayRequests.filter((req) => req.priority.toLowerCase() === priorityFilter.toLowerCase());
  return <AppLayout userRole={userRole}>
      <div className="space-y-6">
        {
    /* Header */
  }
        <div className="flex items-center justify-between">
          <div>
            <h1>Request Management</h1>
            <p className="text-muted-foreground">
              {userRole === "admin" ? "Review and manage requests" : "Submit and track your requests"}
            </p>
          </div>
          {userRole === "employee" && <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Request</DialogTitle>
                  <DialogDescription>Submit a request for approval</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="requestTitle">Request Title</Label>
                    <Input id="requestTitle" placeholder="Enter request title" value={newRequest.title} onChange={(event) => setNewRequest((prev) => ({ ...prev, title: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe your request" rows={3} value={newRequest.description} onChange={(event) => setNewRequest((prev) => ({ ...prev, description: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newRequest.priority} onValueChange={(value) => setNewRequest((prev) => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={() => {
                      createLeave({
                        type: newRequest.title || "General Request",
                        reason: newRequest.description || "No details",
                        startDate: new Date().toISOString().slice(0, 10),
                        endDate: new Date().toISOString().slice(0, 10),
                        priority: newRequest.priority,
                      })
                        .then((created) => {
                          setRequests((prev) => [{
                            id: created.id,
                            employee: created.employee || created.user || "Employee",
                            title: created.type || "Request",
                            description: created.reason || "",
                            priority: created.priority || "Medium",
                            status: created.status || "Pending",
                            date: String(created.startDate || "").slice(0, 10),
                          }, ...prev]);
                          setNewRequest({ title: "", description: "", priority: "medium" });
                        })
                        .catch(() => {});
                    }}>Submit Request</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>}
        </div>

        {
    /* Stats */
  }
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayRequests.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayRequests.filter((r) => r.status === "Pending").length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayRequests.filter((r) => r.status === "Approved").length}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {displayRequests.filter((r) => r.status === "Rejected").length}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {
    /* Requests Table */
  }
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Requests</CardTitle>
                <CardDescription>Request history and status</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Filter:</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {userRole === "admin" && <TableHead>Employee</TableHead>}
                  <TableHead>Request Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  {userRole === "admin" && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => <TableRow key={request.id}>
                    {userRole === "admin" && <TableCell className="font-medium">{typeof request.employee === "object" ? (request.employee.name ?? "—") : (request.employee || "—")}</TableCell>}
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{request.description}</TableCell>
                    <TableCell>
                      <Badge variant={request.priority === "High" ? "destructive" : request.priority === "Medium" ? "default" : "secondary"}>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.date}</TableCell>
                    <TableCell>
                      <Badge variant={request.status === "Approved" ? "secondary" : request.status === "Rejected" ? "destructive" : "default"}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    {userRole === "admin" && <TableCell>
                        <div className="flex gap-2">
                          {request.status === "Pending" && <>
                              <Button
    size="sm"
    variant="outline"
    className="h-8"
    onClick={() => handleApprove(request.id)}
  >
                                <Check className="h-4 w-4 mr-1 text-secondary" />
                                Approve
                              </Button>
                              <Button
    size="sm"
    variant="outline"
    className="h-8"
    onClick={() => handleReject(request.id)}
  >
                                <X className="h-4 w-4 mr-1 text-destructive" />
                                Reject
                              </Button>
                            </>}
                          <Button
    size="sm"
    variant="outline"
    className="h-8"
    onClick={() => handleDeleteClick(request.id, request.title)}
  >
                            <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>}
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {
    /* Delete Confirmation Modal */
  }
        <DeleteConfirmModal
    open={deleteModal.open}
    title="Delete Request"
    itemName={deleteModal.requestTitle}
    onConfirm={handleDeleteConfirm}
    onCancel={handleDeleteCancel}
  />
      </div>
    </AppLayout>;
}
export {
  Requests as default
};
