import { Plus, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { showToast } from "../utils/toast";
import { createLeave as createLeaveApi, fetchLeaves } from "../utils/api";

function mapLeave(leave) {
  return {
    id: leave.id ?? leave._id ?? Date.now(),
    type: leave.leaveType ?? leave.type ?? "",
    startDate: leave.startDate ?? "",
    endDate: leave.endDate ?? leave.startDate ?? "",
    days: leave.days ?? 1,
    reason: leave.reason ?? "",
    status: leave.status ?? "Pending",
    appliedOn: leave.createdAt?.slice?.(0, 10) ?? leave.appliedOn ?? ""
  };
}

function EmployeeLeave() {
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      type: "Sick Leave",
      startDate: "2026-04-25",
      endDate: "2026-04-26",
      days: 2,
      reason: "Medical appointment",
      status: "Pending",
      appliedOn: "2026-04-23"
    },
    {
      id: 2,
      type: "Casual Leave",
      startDate: "2026-05-10",
      endDate: "2026-05-12",
      days: 3,
      reason: "Family function",
      status: "Approved",
      appliedOn: "2026-04-15"
    },
    {
      id: 3,
      type: "Annual Leave",
      startDate: "2026-03-15",
      endDate: "2026-03-20",
      days: 6,
      reason: "Vacation",
      status: "Approved",
      appliedOn: "2026-03-01"
    }
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLeave, setNewLeave] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: ""
  });

  useEffect(() => {
    let mounted = true;

    async function loadLeaves() {
      try {
        const data = await fetchLeaves();
        if (mounted && data.length > 0) {
          setLeaveRequests(data.map(mapLeave));
        }
      } catch {
        // Keep demo data when the backend is not reachable.
      }
    }

    loadLeaves();

    return () => {
      mounted = false;
    };
  }, []);

  const handleApplyLeave = () => {
    if (!newLeave.type || !newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      showToast("Please fill all fields", "error");
      return;
    }
    createLeaveApi({
      leaveType: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: newLeave.reason,
    })
      .then((saved) => {
        const newRequest = mapLeave(saved);
        setLeaveRequests((prev) => [newRequest, ...prev]);
        setDialogOpen(false);
        setNewLeave({ type: "", startDate: "", endDate: "", reason: "" });
        showToast("Leave request submitted successfully", "success");
      })
      .catch((error) => {
        showToast(error.message || "Unable to submit leave request.", "error");
      });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-success text-white";
      case "Rejected":
        return "bg-destructive text-white";
      case "Pending":
        return "bg-secondary text-white";
      default:
        return "bg-muted";
    }
  };
  const totalLeave = 20;
  const usedLeave = leaveRequests.filter((l) => l.status === "Approved").reduce((sum, l) => sum + l.days, 0);
  const pendingLeave = leaveRequests.filter((l) => l.status === "Pending").length;
  const rejectedLeave = leaveRequests.filter((l) => l.status === "Rejected").length;
  return <AppLayout userRole="employee">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1>My Leave</h1>
            <p className="text-muted-foreground">Apply for leave and track your requests</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Leave Type</Label>
                  <Select value={newLeave.type} onValueChange={(value) => setNewLeave({ ...newLeave, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                      <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                      <SelectItem value="Emergency Leave">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
    type="date"
    value={newLeave.startDate}
    onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
  />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
    type="date"
    value={newLeave.endDate}
    onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
  />
                  </div>
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea
    placeholder="Enter reason for leave"
    value={newLeave.reason}
    onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
  />
                </div>
                <Button onClick={handleApplyLeave} className="w-full">Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Leave Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{totalLeave}</span>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Used Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-destructive">{usedLeave}</span>
                <CheckCircle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Remaining Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-success">{totalLeave - usedLeave}</span>
                <Calendar className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-secondary">{pendingLeave}</span>
                <Clock className="h-5 w-5 text-secondary" />
              </div>
            </CardContent>
          </Card>

          {
    /* ── NEW: Rejected Requests tile ── */
  }
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rejected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-destructive">{rejectedLeave}</span>
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Declined by admin</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Leave Type</th>
                    <th className="text-left p-3">Start Date</th>
                    <th className="text-left p-3">End Date</th>
                    <th className="text-left p-3">Days</th>
                    <th className="text-left p-3">Reason</th>
                    <th className="text-left p-3">Applied On</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((leave) => <tr key={leave.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{leave.type}</td>
                      <td className="p-3">{new Date(leave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="p-3">{new Date(leave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="p-3">{leave.days}</td>
                      <td className="p-3">{leave.reason}</td>
                      <td className="p-3">{new Date(leave.appliedOn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="p-3">
                        <Badge className={getStatusColor(leave.status)}>
                          {leave.status === "Approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {leave.status === "Rejected" && <XCircle className="h-3 w-3 mr-1" />}
                          {leave.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
                          {leave.status}
                        </Badge>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>;
}
export {
  EmployeeLeave as default
};
