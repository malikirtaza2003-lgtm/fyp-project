import { useEffect, useState } from "react";
import { getCurrentRole } from "../utils/auth";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Check, X, Trash2, ClipboardList } from "lucide-react";
import { showToast } from "../utils/toast";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";
import { approveLeave as approveLeaveApi, createLeave as createLeaveApi, deleteLeave as deleteLeaveApi, fetchLeaves, fetchSettings, fetchUsers, rejectLeave as rejectLeaveApi } from "../utils/api";
const initialRequests = [];

function mapLeave(leave) {
  const id = leave.id ?? leave._id;
  if (!id) {
    return null;
  }

  const employeeVal = leave.employee ?? leave.user;
  const employeeName = typeof employeeVal === "object" ? (employeeVal.name ?? "Employee") : (employeeVal ?? "Employee");

  return {
    id,
    employee: employeeName,
    leaveType: leave.leaveType ?? "",
    startDate: leave.startDate ?? "",
    endDate: leave.endDate ?? leave.startDate ?? "",
    days: leave.days ?? calcDays(leave.startDate, leave.endDate ?? leave.startDate),
    reason: leave.reason ?? "—",
    status: leave.status ?? "Pending",
    appliedOn: leave.createdAt?.slice?.(0, 10) ?? leave.appliedOn ?? "",
  };
}
function calcDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start), e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 1;
}
function statusBadge(status) {
  if (status === "Approved") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
      <Check className="h-3 w-3" />Approved
    </span>;
  if (status === "Rejected") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
      <X className="h-3 w-3" />Rejected
    </span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
      <ClipboardList className="h-3 w-3" />Pending
    </span>;
}
function ManualLeaveModal({ open, onClose, onSave, employeeOptions, leaveTypes }) {
  const [employee, setEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [dateMode, setDateMode] = useState("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("Pending");
  const employeeList = employeeOptions ?? [];
  const leaveTypeOptions = leaveTypes ?? [];
  const reset = () => {
    setEmployee("");
    setLeaveType("");
    setDateMode("single");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setStatus("Pending");
  };
  const handleSave = (close) => {
    if (!employee) {
      showToast("Please select an employee.", "error");
      return;
    }
    if (!leaveType) {
      showToast("Please select a leave type.", "error");
      return;
    }
    const sd = dateMode === "single" ? singleDate : startDate;
    const ed = dateMode === "single" ? singleDate : endDate;
    if (!sd) {
      showToast("Please select a date.", "error");
      return;
    }
    onSave({
      employee,
      leaveType,
      startDate: sd,
      endDate: ed || sd,
      days: calcDays(sd, ed || sd),
      reason: reason || "\u2014",
      status
    });
    reset();
    if (close) onClose();
  };
  return <Dialog open={open} onOpenChange={(v) => {
    if (!v) {
      reset();
      onClose();
    }
  }}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#162E93]" />Manual Leave Entry
          </DialogTitle>
          <DialogDescription>
            {employeeList.length > 0 ? "Add a leave request for one of your team members." : "Add a leave request manually for any employee."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-1">

          {
    /* Employee */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Select Employee <span className="text-red-500">*</span>
            </Label>
            {
    /* Dropdown when allowedEmployees is provided; text input otherwise */
  }
            {employeeList.length > 0 ? <select
    value={employee}
    onChange={(e) => setEmployee(e.target.value)}
    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30 appearance-none"
  >
                <option value="">Select team member…</option>
                {employeeList.map((name) => <option key={name} value={name}>{name}</option>)}
              </select> : <Input
    type="text"
    placeholder="No employees available"
    value={employee}
    onChange={(e) => setEmployee(e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
    disabled
  />}
          </div>

          {
    /* Leave Type */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Leave Type <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-4 gap-1.5">
              {leaveTypeOptions.map((t) => <button
    key={t}
    type="button"
    onClick={() => setLeaveType(t)}
    className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${leaveType === t ? "bg-[#162E93] border-[#162E93] text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
  >
                  {t}
                </button>)}
            </div>
          </div>

          {
    /* Date Mode Toggle */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Date Selection</Label>
            <div className="flex gap-2">
              {["single", "range"].map((m) => <button
    key={m}
    type="button"
    onClick={() => setDateMode(m)}
    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${dateMode === m ? "bg-[#162E93]/10 border-[#162E93]/40 text-[#162E93]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
  >
                  {m === "single" ? "Single Date" : "Date Range"}
                </button>)}
            </div>
          </div>

          {
    /* Date inputs */
  }
          {dateMode === "single" ? <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Input
    type="date"
    value={singleDate}
    onChange={(e) => setSingleDate(e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
            </div> : <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Start Date</Label>
                <Input
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">End Date</Label>
                <Input
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              </div>
            </div>}

          {
    /* Reason */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Reason</Label>
            <Textarea
    placeholder="Enter reason for leave…"
    value={reason}
    onChange={(e) => setReason(e.target.value)}
    rows={3}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93] resize-none"
  />
          </div>

          {
    /* Status */
  }
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Set Status</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Pending", "Approved", "Rejected"].map((s) => <button
    key={s}
    type="button"
    onClick={() => setStatus(s)}
    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${status === s ? s === "Approved" ? "bg-green-100 border-green-400 text-green-700" : s === "Rejected" ? "bg-red-100 border-red-400 text-red-700" : "bg-amber-100 border-amber-400 text-amber-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
  >
                  {s}
                </button>)}
            </div>
          </div>

          {
    /* Actions */
  }
          <div className="flex gap-2 pt-2">
            <Button
    variant="outline"
    className="flex-1 rounded-xl border-gray-200"
    onClick={() => {
      reset();
      onClose();
    }}
  >
              <X className="h-4 w-4 mr-1.5" />Cancel
            </Button>
            <Button
    variant="outline"
    className="flex-1 rounded-xl border-[#162E93]/30 text-[#162E93] hover:bg-[#162E93]/5"
    onClick={() => handleSave(false)}
  >
              Apply
            </Button>
            <Button
    className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white"
    onClick={() => handleSave(true)}
  >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
function Leave() {
  const userRole = getCurrentRole();
  const [requests, setRequests] = useState(initialRequests);
  const [users, setUsers] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [settingsSnapshot, setSettingsSnapshot] = useState(null);
  const [leaveAllowances, setLeaveAllowances] = useState({});
  const [manualOpen, setManualOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isAdminOrLead = userRole === "admin" || userRole === "teamlead";
  const displayRequests = requests;
  const [empLeaveType, setEmpLeaveType] = useState("");
  const [empStart, setEmpStart] = useState("");
  const [empEnd, setEmpEnd] = useState("");
  const [empReason, setEmpReason] = useState("");

  const employeeOptions = users
    .filter((user) => String(user.role ?? "").toLowerCase() !== "admin")
    .map((user) => ({
      id: user.id ?? user._id,
      name: user.name,
      department: user.department ?? "",
      email: user.email,
    }))
    .filter((user) => user.id && user.name);

  const resolveEmployee = (value) => {
    if (!value) return null;
    return (
      users.find((user) => user.id === value || user._id === value) ||
      users.find((user) => user.email === value) ||
      users.find((user) => user.name === value)
    );
  };
  useEffect(() => {
    let mounted = true;

    async function loadLeaves() {
      try {
        const [leaveData, userData, settingsData] = await Promise.all([
          fetchLeaves(),
          fetchUsers(),
          fetchSettings(),
        ]);
        if (mounted) {
          setRequests(leaveData.map(mapLeave).filter(Boolean));
          setUsers(userData ?? []);
          setLeaveTypes(settingsData?.leaveTypes ?? []);
          setLeaveAllowances(settingsData?.leaveAllowances ?? {});
          setSettingsSnapshot(settingsData ?? {});
        }
      } catch {
        if (mounted) {
          setRequests([]);
          setUsers([]);
          setLeaveTypes([]);
          setSettingsSnapshot(null);
        }
      }
    }

    loadLeaves();

    return () => {
      mounted = false;
    };
  }, []);
  const handleApprove = async (id) => {
    try {
      const saved = await approveLeaveApi(id);
      setRequests((prev) => prev.map((r) => r.id === id ? mapLeave(saved) : r));
      showToast("Leave request approved.", "success");
    } catch (error) {
      showToast(error.message || "Unable to approve leave.", "error");
    }
  };
  const handleReject = async (id) => {
    try {
      const saved = await rejectLeaveApi(id);
      setRequests((prev) => prev.map((r) => r.id === id ? mapLeave(saved) : r));
      showToast("Leave request rejected.", "error");
    } catch (error) {
      showToast(error.message || "Unable to reject leave.", "error");
    }
  };
  const handleDelete = (id) => {
    const req = requests.find((r) => r.id === id);
    if (req) setDeleteTarget(req);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLeaveApi(deleteTarget.id);
      setRequests((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast("Leave request deleted.", "success");
      setDeleteTarget(null);
    } catch (error) {
      showToast(error.message || "Unable to delete leave request.", "error");
    }
  };
  const handleManualSave = async (req) => {
    try {
      const employee = resolveEmployee(req.employee);

      if (!employee) {
        showToast("Please select a valid employee.", "error");
        return;
      }

      const saved = await createLeaveApi({
        user: employee.id ?? employee._id ?? employee.email ?? employee.name,
        employee: employee.name,
        leaveType: req.leaveType,
        startDate: req.startDate,
        endDate: req.endDate,
        reason: req.reason,
        status: req.status,
      });
      const mapped = mapLeave(saved);
      if (mapped) {
        setRequests((prev) => [...prev, mapped]);
      }
      showToast(`Leave added for ${employee.name}.`, "success");
    } catch (error) {
      showToast(error.message || "Unable to add leave request.", "error");
    }
  };
  const handleEmployeeApply = async () => {
    if (!empLeaveType || !empStart) {
      showToast("Please fill in leave type and start date.", "error");
      return;
    }



    try {
      const saved = await createLeaveApi({
        leaveType: empLeaveType,
        startDate: empStart,
        endDate: empEnd || empStart,
        reason: empReason || "—",
      });
      const mapped = mapLeave(saved);
      if (mapped) {
        setRequests((prev) => [...prev, mapped]);
      }
      setEmpLeaveType("");
      setEmpStart("");
      setEmpEnd("");
      setEmpReason("");
      setApplyOpen(false);
      showToast("Leave request submitted.", "success");
    } catch (error) {
      showToast(error.message || "Unable to submit leave request.", "error");
    }
  };
  const pending = displayRequests.filter((r) => r.status === "Pending").length;
  const approved = displayRequests.filter((r) => r.status === "Approved").length;
  const rejected = displayRequests.filter((r) => r.status === "Rejected").length;
  return <AppLayout userRole={userRole}>
      <div className="space-y-6">

        {
    /* ── Header ── */
  }
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1>Leave Management</h1>
            <p className="text-muted-foreground">
              {userRole === "admin" ? "Manage team leave requests" : userRole === "teamlead" ? "Manage your team's leave requests" : "Request and track your leaves"}
            </p>
          </div>

          {
    /* Admin & Team Lead: Manual Leave button */
  }
          {isAdminOrLead && <Button
    className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2"
    onClick={() => setManualOpen(true)}
  >
              <Plus className="h-4 w-4" />Manual Leave
            </Button>}

          {
    /* Employee: Apply Leave */
  }
          {userRole === "employee" && <Button onClick={() => setApplyOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Apply Leave
            </Button>}
        </div>

        {
    /* ── Summary Cards (Admin & Team Lead) ── */
  }
        {isAdminOrLead && <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{pending}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{approved}</p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{rejected}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>}

        {
    /* ── Leave Balance (Employee) ── */
  }
        {userRole === "employee" && (
          <div className="grid gap-4 md:grid-cols-4">
            {leaveTypes.map((type) => {
              const allowance = leaveAllowances[type] || 0;
              const used = requests
                .filter(r => r.leaveType === type && r.status === "Approved")
                .reduce((acc, r) => acc + (r.days || 0), 0);
              const remaining = Math.max(0, allowance - used);
              return (
                <Card key={type} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600">{type} Leave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{remaining}/{allowance}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">Days remaining</p>
                  </CardContent>
                </Card>
              );
            })}
            {leaveTypes.length === 0 && (
              ["Casual", "Sick", "Short", "Total"].map((l) => (
                <Card key={l} className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600">{l} Leave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">—</div>
                    <p className="text-xs text-muted-foreground mt-0.5">No allowance set</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {
    /* ── Leave Requests Table ── */
  }
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>
              {userRole === "admin" ? "Leave Requests" : userRole === "teamlead" ? "Team Leave Requests" : "My Leave History"}
            </CardTitle>
            <CardDescription>
              {userRole === "admin" ? "Review and manage leave requests" : userRole === "teamlead" ? "Review and manage your team's leave requests" : "Track your leave applications"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    {
    /* Employee column — visible to Admin & Team Lead */
  }
                    {isAdminOrLead && <TableHead className="font-semibold text-gray-700">Employee</TableHead>}
                    <TableHead className="font-semibold text-gray-700">Leave Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Start Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">End Date</TableHead>
                    <TableHead className="font-semibold text-gray-700">Days</TableHead>
                    <TableHead className="font-semibold text-gray-700">Reason</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    {isAdminOrLead && <TableHead className="font-semibold text-gray-700">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRequests.map((req) => <TableRow key={req.id} className="hover:bg-gray-50/60 transition-colors">

                      {
    /* Employee */
  }
                      {isAdminOrLead && <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-[#162E93]">
                                {(typeof req.employee === "object" ? (req.employee.name ?? "—") : (req.employee || "—")).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 text-sm whitespace-nowrap">{typeof req.employee === "object" ? (req.employee.name ?? "—") : (req.employee || "—")}</span>
                          </div>
                        </TableCell>}

                      {
    /* Leave Type */
  }
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${req.leaveType === "Sick" ? "bg-red-50 text-red-700" : req.leaveType === "Casual" ? "bg-blue-50 text-blue-700" : req.leaveType === "Short Leave" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                          {req.leaveType}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.startDate}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{req.endDate}</TableCell>
                      <TableCell className="text-sm text-gray-600">{req.days}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[180px] truncate">{req.reason}</TableCell>

                      {
    /* Status */
  }
                      <TableCell>{statusBadge(req.status)}</TableCell>

                      {
    /* Actions (Admin and Team Lead) */
  }
                      {isAdminOrLead && <TableCell>
                          <div className="flex items-center gap-1.5">
                            {
    /* Approve */
  }
                            <button
    onClick={() => handleApprove(req.id)}
    disabled={req.status === "Approved"}
    title="Approve"
    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${req.status === "Approved" ? "bg-green-50 border-green-200 text-green-400 cursor-not-allowed opacity-60" : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"}`}
  >
                              <Check className="h-3 w-3" />Accept
                            </button>

                            {
    /* Reject */
  }
                            <button
    onClick={() => handleReject(req.id)}
    disabled={req.status === "Rejected"}
    title="Reject"
    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${req.status === "Rejected" ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-60" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"}`}
  >
                              <X className="h-3 w-3" />Reject
                            </button>

                            {
    /* Delete */
  }
                            <button
    onClick={() => handleDelete(req.id)}
    title="Delete"
    className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
  >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>}
                    </TableRow>)}

                  {displayRequests.length === 0 && <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                        No leave requests found.
                      </TableCell>
                    </TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {
    /* ── Manual Leave Modal (Admin & Team Lead) ── */
  }
      <ManualLeaveModal
    open={manualOpen}
    onClose={() => setManualOpen(false)}
    onSave={handleManualSave}
    employeeOptions={employeeOptions.map((employee) => employee.name)}
    leaveTypes={leaveTypes}
  />

      {
    /* ── Delete Confirm Modal ── */
  }
      <DeleteConfirmModal
    open={!!deleteTarget}
    title="Delete Leave Request"
    message={deleteTarget ? `Are you sure you want to delete the leave request for "${typeof deleteTarget.employee === "object" ? (deleteTarget.employee.name ?? "this employee") : (deleteTarget.employee || "this employee")}"? This action cannot be undone.` : void 0}
    onConfirm={confirmDelete}
    onCancel={() => setDeleteTarget(null)}
  />

      {
    /* ── Apply Leave Modal (Employee) ── */
  }
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Submit your leave request for approval.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={empLeaveType} onValueChange={setEmpLeaveType}>
                <SelectTrigger className="rounded-xl border-gray-200">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => {
    const label = type.toLowerCase().includes("leave") ? type : `${type} Leave`;
    return (
      <SelectItem key={type} value={type}>
        {label}
      </SelectItem>
    );
  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
    id="startDate"
    type="date"
    value={empStart}
    onChange={(e) => setEmpStart(e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
    id="endDate"
    type="date"
    value={empEnd}
    onChange={(e) => setEmpEnd(e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
    id="reason"
    placeholder="Describe the reason for leave"
    rows={3}
    value={empReason}
    onChange={(e) => setEmpReason(e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93] resize-none"
  />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="rounded-xl" onClick={() => setApplyOpen(false)}>Cancel</Button>
              <Button className="rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white" onClick={handleEmployeeApply}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>;
}
export {
  Leave as default
};
