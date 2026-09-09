import { useEffect, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Check, X, Trash2, Calendar, User, Clock, AlertCircle } from "lucide-react";
import { fetchLeaves, updateLeave, deleteLeave } from "../utils/api";
import { showToast } from "../utils/toast";
import { DeleteConfirmModal } from "../components/delete-confirm-modal";

const initialLeaveRequests = [
  { id: 1, name: "John Doe", type: "Casual Leave", from: "2026-05-01", to: "2026-05-03", days: 3, status: "Pending", reason: "Family event" },
  { id: 2, name: "Jane Smith", type: "Sick Leave", from: "2026-04-25", to: "2026-04-26", days: 2, status: "Approved", reason: "High fever" },
  { id: 3, name: "Mike Johnson", type: "Annual Leave", from: "2026-06-01", to: "2026-06-10", days: 10, status: "Approved", reason: "Summer vacation" },
];

export default function TeamLeadLeave() {
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [leaveToDelete, setLeaveToDelete] = useState(null);

  useEffect(() => {
    let mounted = true;
    fetchLeaves()
      .then((data) => {
        if (!mounted || !data || data.length === 0) return;
        setLeaveRequests(
          data.map((leave, idx) => ({
            id: leave.id || leave._id || idx + 10,
            name: leave.employee || leave.user || "Unknown",
            type: leave.leaveType || "Leave",
            from: leave.startDate || "",
            to: leave.endDate || leave.startDate || "",
            days: leave.days || 1,
            status: leave.status || "Pending",
            reason: leave.reason || "N/A"
          })),
        );
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateLeave(id, { status: newStatus });
      setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      showToast(`Leave request ${newStatus.toLowerCase()}`, "success");
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = () => {
    if (leaveToDelete) {
      setLeaveRequests(prev => prev.filter(req => req.id !== leaveToDelete.id));
      showToast("Leave record deleted", "success");
      setLeaveToDelete(null);
    }
  };

  const stats = {
    total: leaveRequests.length,
    approved: leaveRequests.filter(r => r.status === "Approved").length,
    pending: leaveRequests.filter(r => r.status === "Pending").length,
    rejected: leaveRequests.filter(r => r.status === "Rejected").length,
  };

  return (
    <AppLayout userRole="teamlead">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-sm text-gray-500 mt-1">Review and manage your team's absence requests.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500 uppercase tracking-widest">
            <Clock className="h-4 w-4 text-[#162E93]" />
            Real-time Updates
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Approved", value: stats.approved, color: "text-green-600", bg: "bg-green-50" },
            { label: "Pending", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Rejected", value: stats.rejected, color: "text-red-600", bg: "bg-red-50" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-gray-50">
            <CardTitle className="text-base font-bold text-gray-800">Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Leave Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Days</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#162E93]/5 flex items-center justify-center text-[#162E93] font-bold text-xs">
                            {req.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{req.name}</p>
                            <p className="text-[10px] font-medium text-gray-400">{req.reason}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-gray-50 text-gray-600 border-gray-100 text-[10px] font-bold px-2 py-0.5 border">
                          {req.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-gray-700">{req.from}</span>
                            <span className="text-gray-300">→</span>
                            <span className="text-[11px] font-bold text-gray-700">{req.to}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-gray-600">{req.days}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`text-[10px] font-bold px-2 py-0.5 border-0 ${
                          req.status === "Approved" ? "bg-green-50 text-green-600" : 
                          req.status === "Rejected" ? "bg-red-50 text-red-600" : 
                          "bg-amber-50 text-amber-600"
                        }`}>
                          {req.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === "Pending" && (
                            <>
                              <button 
                                onClick={() => handleStatusUpdate(req.id, "Approved")}
                                className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(req.id, "Rejected")}
                                className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setLeaveToDelete(req)}
                            className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leaveRequests.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-400">No leave requests found</h3>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <DeleteConfirmModal
        open={!!leaveToDelete}
        onCancel={() => setLeaveToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Leave Request"
        itemName={`Leave Request by ${leaveToDelete?.name}`}
      />
    </AppLayout>
  );
}
