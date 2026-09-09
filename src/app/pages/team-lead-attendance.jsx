import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar as CalendarIcon, 
  Coffee, 
  Play, 
  CheckCircle2, 
  ChevronDown,
  Users,
  Target,
  Zap,
  MoreVertical,
  AlertCircle
} from "lucide-react";
import { showToast } from "../utils/toast";
import { useAttendance } from "../contexts/attendance-context";
import { fetchAttendance } from "../utils/api";

const WORKING_DAYS_DATA = {
  currentWeek: { label: "Current Week", totalDays: 5, present: 3, absent: 0, late: 1, halfDay: 0 },
  currentMonth: { label: "Current Month", totalDays: 22, present: 14, absent: 1, late: 2, halfDay: 1 },
};

const STATUS_CAL = {
  Present: { backgroundColor: "#dcfce7", color: "#15803d", borderRadius: "50%" },
  Absent: { backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "50%" },
  Late: { backgroundColor: "#f3f4f6", color: "#6b7280", borderRadius: "50%" },
  Holiday: { backgroundColor: "#fed7aa", color: "#c2410c", borderRadius: "50%" }
};

const initialTeamAttendance = [
  { name: "Alex Johnson", status: "Present", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: "9h 0m" },
  { name: "Maria Santos", status: "Present", checkIn: "09:15 AM", checkOut: "06:05 PM", hours: "8h 50m" },
  { name: "David Kim", status: "Late", checkIn: "09:45 AM", checkOut: "06:00 PM", hours: "8h 15m" },
  { name: "Priya Patel", status: "On Leave", checkIn: "-", checkOut: "-", hours: "-" },
];

function formatElapsed(s) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor(s % 3600 / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export default function TeamLeadAttendance() {
  const {
    isCheckedIn,
    isOnBreak,
    checkInTime,
    checkOutTime,
    elapsedSeconds,
    currentBreakSeconds,
    checkIn,
    startBreak,
    resumeFromBreak,
    checkOut
  } = useAttendance();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [teamAttendance, setTeamAttendance] = useState(initialTeamAttendance);
  const [personalRecords, setPersonalRecords] = useState([]);

  const calModifiers = useMemo(() => {
    const map = { Present: [], Absent: [], Late: [], Holiday: [] };
    personalRecords.forEach(rec => {
      if (map[rec.status]) {
        map[rec.status].push(new Date(rec.date));
      }
    });
    return map;
  }, [personalRecords]);

  useEffect(() => {
    let mounted = true;
    fetchAttendance().then(data => {
      if (!mounted || !data || data.length === 0) return;
      // In a real app, we'd distinguish personal vs team attendance
      setTeamAttendance(data.map(r => ({
        name: r.employee || r.user || "Employee",
        status: r.status || "Present",
        checkIn: r.checkIn || "-",
        checkOut: r.checkOut || "-",
        hours: r.workingHours || "0h 0m"
      })));
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleCheckIn = () => {
    checkIn();
    showToast("Checked in successfully", "success");
  };

  const handleBreak = () => {
    startBreak();
    showToast("Break started", "info");
  };

  const handleResume = () => {
    resumeFromBreak();
    showToast("Back to work!", "success");
  };

  const handleCheckOut = () => {
    checkOut();
    showToast("Checked out successfully", "success");
  };

  return (
    <AppLayout userRole="teamlead">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your personal attendance and track your team.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500">
            <CalendarIcon className="h-4 w-4 text-[#162E93]" />
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Working Days", value: "22", sub: "Current Month", icon: CalendarIcon, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Present", value: "14", sub: "Days this month", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            { label: "Late / Absent", value: "3", sub: "Action required", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Avg. Hours", value: "8h 45m", sub: "Daily average", icon: Clock, color: "text-[#162E93]", bg: "bg-[#162E93]/5" },
          ].map((s, i) => (
            <Card key={i} className="border-0 shadow-sm rounded-2xl bg-white/80">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                <p className="text-[10px] text-gray-400 mt-2">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Personal Attendance and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Today's Attendance (Check-in/out) */}
          <Card className="lg:col-span-5 border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-gray-800">My Attendance</CardTitle>
                <Badge className={`text-[10px] font-bold border-0 px-2.5 py-1 ${
                  isOnBreak ? "bg-amber-50 text-amber-600" : isCheckedIn ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                }`}>
                  {isOnBreak ? "On Break" : isCheckedIn ? "Currently Working" : "Not Checked In"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className={`p-8 rounded-3xl border-2 flex flex-col items-center justify-center text-center mb-6 transition-all ${
                isOnBreak ? "border-amber-100 bg-amber-50/50" : isCheckedIn ? "border-green-100 bg-green-50/50" : "border-gray-50 bg-gray-50/50"
              }`}>
                {isCheckedIn && !isOnBreak && (
                  <p className="text-4xl font-black text-[#162E93] font-mono tracking-tighter">{formatElapsed(elapsedSeconds)}</p>
                )}
                {isOnBreak && (
                  <p className="text-4xl font-black text-amber-600 font-mono tracking-tighter">{formatElapsed(currentBreakSeconds)}</p>
                )}
                {!isCheckedIn && !checkOutTime && (
                  <p className="text-4xl font-black text-gray-300 font-mono tracking-tighter">00:00:00</p>
                )}
                {checkOutTime && (
                  <p className="text-4xl font-black text-green-600 font-mono tracking-tighter">{formatElapsed(elapsedSeconds)}</p>
                )}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
                  {isOnBreak ? "Break Timer" : "Shift Duration"}
                </p>

                <div className="grid grid-cols-3 gap-4 w-full mt-8 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Check-in</p>
                    <p className="text-xs font-bold text-gray-800">{checkInTime || "--:--"}</p>
                  </div>
                  <div className="text-center border-x border-gray-100 px-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Break</p>
                    <p className="text-xs font-bold text-amber-600">
                      {currentBreakSeconds > 0 ? `${Math.floor(currentBreakSeconds/60)}m` : "--"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Check-out</p>
                    <p className="text-xs font-bold text-gray-800">{checkOutTime || "--:--"}</p>
                  </div>
                </div>
              </div>

              {!isCheckedIn && !checkOutTime && (
                <Button onClick={handleCheckIn} className="w-full h-12 rounded-2xl bg-[#162E93] hover:bg-[#1a36a8] shadow-lg shadow-[#162E93]/20 gap-3 font-bold">
                  <LogIn className="h-5 w-5" /> Start Your Shift
                </Button>
              )}

              {isCheckedIn && !isOnBreak && (
                <div className="flex gap-3">
                  <Button onClick={handleBreak} variant="outline" className="flex-1 h-12 rounded-2xl border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-600 gap-2 font-bold">
                    <Coffee className="h-5 w-5" /> Take Break
                  </Button>
                  <Button onClick={handleCheckOut} className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100 gap-2 font-bold">
                    <LogOut className="h-5 w-5" /> End Shift
                  </Button>
                </div>
              )}

              {isOnBreak && (
                <div className="flex gap-3">
                  <Button onClick={handleResume} className="flex-1 h-12 rounded-2xl bg-[#162E93] hover:bg-[#1a36a8] gap-2 font-bold">
                    <Play className="h-5 w-5" /> Resume Shift
                  </Button>
                  <Button onClick={handleCheckOut} variant="outline" className="flex-1 h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 gap-2 font-bold">
                    <LogOut className="h-5 w-5" /> End Shift
                  </Button>
                </div>
              )}

              {checkOutTime && (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-center gap-3 text-green-700 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  Work complete for today!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Calendar */}
          <Card className="lg:col-span-7 border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-gray-800">Attendance Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Absent</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-2xl border-gray-100"
                modifiers={calModifiers}
                modifiersStyles={STATUS_CAL}
              />
            </CardContent>
          </Card>
        </div>

        {/* Team Attendance Table */}
        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-6 border-b border-gray-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-800">Team Status Today</CardTitle>
              <p className="text-xs text-gray-400 mt-1">Live monitoring of your team's current status</p>
            </div>
            <div className="flex -space-x-2">
              {teamAttendance.slice(0, 4).map((m, i) => (
                <div key={i} className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {m.name.split(" ").map(n => n[0]).join("")}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Check In</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Check Out</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teamAttendance.map((att, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {att.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{att.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`text-[10px] font-bold px-2.5 py-1 border-0 ${
                          att.status === "Present" ? "bg-green-50 text-green-600" : 
                          att.status === "Late" ? "bg-amber-50 text-amber-600" : 
                          att.status === "On Leave" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                        }`}>
                          {att.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">{att.checkIn}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">{att.checkOut}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">{att.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
