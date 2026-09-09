import { useEffect, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";
import { fetchLeaves, createLeave } from "../utils/api";
import { showToast } from "../utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const fallbackRequests = [
  { id: 1, type: "Advance Request", amount: "₹5,000", status: "Pending", date: "2026-04-20", description: "Personal expense" },
  { id: 2, type: "Work From Home", date: "2026-04-18", status: "Approved", duration: "2 days", description: "Attending personal work" },
  { id: 3, type: "Late Attendance", date: "2026-04-15", status: "Approved", duration: "15 mins", description: "Traffic delay" },
];

export default function EmployeeRequests() {
  const [requests, setRequests] = useState(fallbackRequests);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const loadRequests = () => {
    fetchLeaves()
      .then((leaves) => {
        const mapped = leaves.map((leave) => ({
          id: leave.id,
          type: leave.leaveType || leave.type || "Leave Request",
          status: leave.status || "Pending",
          date: String(leave.startDate || leave.date || "").slice(0, 10),
          description: leave.reason || "No details",
        }));
        if (mapped.length > 0) {
          setRequests(mapped);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leaveType || !formData.startDate) {
      showToast("Please fill all required fields", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createLeave(formData);
      showToast("Request submitted successfully", "success");
      setIsModalOpen(false);
      setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
      loadRequests();
    } catch (error) {
      showToast(error.message || "Failed to submit request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout userRole="employee">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
            <p className="text-muted-foreground mt-1">Manage your leave and special requests</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#162E93] hover:bg-[#1a36a8] text-white">
                <Plus className="mr-2 h-4 w-4" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Request Type *</Label>
                  <Select 
                    value={formData.leaveType} 
                    onValueChange={(val) => setFormData(p => ({ ...p, leaveType: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual">Casual Leave</SelectItem>
                      <SelectItem value="Sick">Sick Leave</SelectItem>
                      <SelectItem value="Work From Home">Work From Home</SelectItem>
                      <SelectItem value="Short Leave">Short Leave</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input 
                      type="date" 
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="date" 
                      value={formData.endDate}
                      onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Textarea 
                    required
                    placeholder="Provide details for your request..."
                    value={formData.reason}
                    onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[#162E93] text-white">
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: requests.length, color: "text-blue-700" },
            { label: "Approved", value: requests.filter(r => r.status === "Approved" || r.status === "approved").length, color: "text-green-700" },
            { label: "Pending", value: requests.filter(r => r.status === "Pending" || r.status === "pending").length, color: "text-amber-700" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          {requests.map(req => (
            <Card key={req.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{req.type}</h3>
                    <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Date: {req.date}</p>
                  </div>
                  <Badge className={req.status?.toLowerCase() === "approved" ? "bg-green-100 text-green-700 border-green-200" : req.status?.toLowerCase() === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200"}>
                    {req.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
