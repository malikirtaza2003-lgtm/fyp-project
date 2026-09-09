import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import {
  Clock,
  LogIn,
  LogOut,
  Calendar as CalendarIcon,
  Coffee,
  Play,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { showToast } from "../utils/toast";
import { useAttendance } from "../contexts/attendance-context";
import { fetchAttendance } from "../utils/api";

const initialAttendanceRecords = [
  { date: "2026-04-29", checkIn: "09:00 AM", checkOut: "06:00 PM", workingHours: "9h 0m", status: "Present" },
  { date: "2026-04-28", checkIn: "09:00 AM", checkOut: "06:00 PM", workingHours: "9h 0m", status: "Present" },
  { date: "2026-04-27", checkIn: "09:15 AM", checkOut: "06:05 PM", workingHours: "8h 50m", status: "Late" },
  { date: "2026-04-25", checkIn: "-", checkOut: "-", workingHours: "0h 0m", status: "Holiday" },
  { date: "2026-04-24", checkIn: "08:55 AM", checkOut: "05:58 PM", workingHours: "9h 3m", status: "Present" },
  { date: "2026-04-23", checkIn: "09:00 AM", checkOut: "06:00 PM", workingHours: "9h 0m", status: "Present" },
  { date: "2026-04-22", checkIn: "09:15 AM", checkOut: "06:05 PM", workingHours: "8h 50m", status: "Late" },
  { date: "2026-04-21", checkIn: "08:55 AM", checkOut: "05:58 PM", workingHours: "9h 3m", status: "Present" },
  { date: "2026-04-18", checkIn: "09:00 AM", checkOut: "02:00 PM", workingHours: "5h 0m", status: "Half Day" },
  { date: "2026-04-17", checkIn: "-", checkOut: "-", workingHours: "0h 0m", status: "Absent" },
  { date: "2026-04-16", checkIn: "09:00 AM", checkOut: "06:00 PM", workingHours: "9h 0m", status: "Present" },
  { date: "2026-04-15", checkIn: "09:00 AM", checkOut: "06:00 PM", workingHours: "9h 0m", status: "Present" },
  { date: "2026-04-14", checkIn: "09:00 AM", checkOut: "06:00 PM", workingHours: "9h 0m", status: "Present" }
];
const holidayDates = ["2026-04-25", "2026-04-03"];
const WORKING_DAYS_DATA = {
  currentWeek: { label: "Current Week (Apr 27\u2013May 1)", totalDays: 5, present: 3, absent: 0, late: 1, halfDay: 0 },
  previousWeek: { label: "Previous Week (Apr 20\u201324)", totalDays: 5, present: 3, absent: 1, late: 1, halfDay: 1 },
  currentMonth: { label: "Current Month (April 2026)", totalDays: 22, present: 9, absent: 1, late: 2, halfDay: 1 },
  previousMonth: { label: "Previous Month (March 2026)", totalDays: 21, present: 19, absent: 1, late: 1, halfDay: 0 }
};
const STATUS_BADGE = {
  Present: "bg-green-100 text-green-700 border-green-200",
  Late: "bg-gray-100 text-gray-600 border-gray-200",
  Absent: "bg-red-100 text-red-700 border-red-200",
  "Half Day": "bg-blue-100 text-blue-700 border-blue-200",
  Holiday: "bg-orange-100 text-orange-700 border-orange-200"
};
const STATUS_CAL = {
  Present: { backgroundColor: "#dcfce7", color: "#15803d", borderRadius: "50%" },
  Absent: { backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: "50%" },
  Late: { backgroundColor: "#f3f4f6", color: "#6b7280", borderRadius: "50%" },
  "Half Day": { backgroundColor: "#dbeafe", color: "#1d4ed8", borderRadius: "50%" },
  Holiday: { backgroundColor: "#fed7aa", color: "#c2410c", borderRadius: "50%" }
};
function formatElapsed(s) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor(s % 3600 / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
function EmployeeAttendance() {
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
  const [selectedDate, setSelectedDate] = useState(/* @__PURE__ */ new Date());
  const [records, setRecords] = useState(initialAttendanceRecords);
  const [daysFilter, setDaysFilter] = useState("currentMonth");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAttendance() {
      try {
        const data = await fetchAttendance();
        if (mounted) {
          setRecords(
            data.map((record) => ({
              id: record.id ?? record._id ?? record.date,
              date: record.date ?? "",
              checkIn: record.checkIn ?? "-",
              checkOut: record.checkOut ?? "-",
              workingHours: record.workingHours ?? "0h 0m",
              status: record.status === "Leave"
                ? "Absent"
                : record.status === "Checked In" || record.status === "On Break" || record.status === "Checked Out"
                ? "Present"
                : record.status ?? "Present",
            }))
          );
        }
      } catch {
        // Keep the demo rows if the backend cannot be reached.
      }
    }

    loadAttendance();

    return () => {
      mounted = false;
    };
  }, []);

  const calModifiers = useMemo(() => {
    const map = { Present: [], Absent: [], Late: [], "Half Day": [], Holiday: [] };
    records.forEach((r) => {
      if (map[r.status]) {
        map[r.status].push(/* @__PURE__ */ new Date(r.date + "T00:00:00"));
      }
    });
    holidayDates.forEach((d) => map.Holiday.push(/* @__PURE__ */ new Date(d + "T00:00:00")));
    return map;
  }, [records]);
  const calModifiersStyles = useMemo(
    () => Object.fromEntries(Object.entries(STATUS_CAL)),
    []
  );
  const daysData = WORKING_DAYS_DATA[daysFilter];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayRecord = records.find((r) => r.date === todayStr);
  const handleCheckIn = () => {
    checkIn();
    showToast(`Checked in at ${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`, "success");
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
    showToast(`Checked out at ${(/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`, "success");
  };
  return <AppLayout userRole="employee">
      <div className="space-y-6">

        {
    /* ── Header ──────────────────────────────────────────────── */
  }
        <div>
          <h1>My Attendance</h1>
          <p className="text-muted-foreground">Track your attendance and working hours</p>
        </div>

        {
    /* ── Summary Tiles ────────────────────────────────────────── */
  }
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

          {
    /* Working Days tile with filter */
  }
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm leading-snug">Working Days</CardTitle>
                {
    /* Filter dropdown */
  }
                <div className="relative">
                  <button
    onClick={() => setFilterOpen((f) => !f)}
    className="flex items-center gap-0.5 text-[10px] text-gray-500 hover:text-[#162E93] transition-colors"
  >
                    Filter <ChevronDown className="h-3 w-3" />
                  </button>
                  {filterOpen && <>
                      <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                      <div className="absolute right-0 top-5 z-50 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                        {Object.keys(WORKING_DAYS_DATA).map((f) => <button
    key={f}
    onClick={() => {
      setDaysFilter(f);
      setFilterOpen(false);
    }}
    className={`w-full text-left text-xs px-3 py-2.5 hover:bg-gray-50 transition-colors ${daysFilter === f ? "text-[#162E93] font-semibold bg-[#162E93]/5" : "text-gray-600"}`}
  >
                            {WORKING_DAYS_DATA[f].label}
                          </button>)}
                      </div>
                    </>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{daysData.totalDays}</span>
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{daysData.label}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{daysData.present}P</span>
                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">{daysData.absent}A</span>
                <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">{daysData.late}L</span>
                {daysData.halfDay > 0 && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{daysData.halfDay}H</span>}
              </div>
            </CardContent>
          </Card>

          {
    /* Present Days */
  }
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Present Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">{daysData.present}</span>
                <LogIn className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Out of {daysData.totalDays} days</p>
            </CardContent>
          </Card>

          {
    /* Absent Days */
  }
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Absent Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-500">{daysData.absent}</span>
                <LogOut className="h-5 w-5 text-red-400" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{daysData.late} late · {daysData.halfDay} half-day</p>
            </CardContent>
          </Card>

          {
    /* Avg Hours */
  }
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Working Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[#162E93]">8h 50m</span>
                <Clock className="h-5 w-5 text-[#162E93]" />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Per working day</p>
            </CardContent>
          </Card>
        </div>

        {
    /* ── Today's Attendance + Calendar ────────────────────────── */
  }
        <div className="grid gap-6 md:grid-cols-2">

          {
    /* Today's Attendance card — unified flow */
  }
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#162E93]" />Today's Attendance
                </CardTitle>
                {
    /* Live status badge */
  }
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${isOnBreak ? "bg-amber-50 border-amber-200 text-amber-700" : isCheckedIn ? "bg-green-50 border-green-200 text-green-700" : checkOutTime ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-gray-50 border-gray-100 text-gray-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnBreak ? "bg-amber-400 animate-pulse" : isCheckedIn ? "bg-green-400 animate-pulse" : checkOutTime ? "bg-gray-300" : "bg-gray-200"}`} />
                  {isOnBreak ? "On Break" : isCheckedIn ? "Working" : checkOutTime ? "Day Complete" : "Not Checked In"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {
    /* ── Timer display panel ── */
  }
              <div className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center ${isOnBreak ? "border-amber-200 bg-amber-50" : isCheckedIn ? "border-green-200 bg-green-50" : checkOutTime ? "border-[#162E93]/20 bg-[#162E93]/5" : "border-gray-100 bg-gray-50"}`}>
                {isCheckedIn && !isOnBreak && <>
                    <p className="text-3xl font-bold text-[#162E93] font-mono tracking-wider">{formatElapsed(elapsedSeconds)}</p>
                    <p className="text-sm text-green-600 font-medium mt-1">● Working</p>
                  </>}
                {isOnBreak && <>
                    <p className="text-3xl font-bold text-amber-600 font-mono tracking-wider">{formatElapsed(currentBreakSeconds)}</p>
                    <p className="text-sm text-amber-600 font-medium mt-1">☕ On Break</p>
                  </>}
                {!isCheckedIn && !checkOutTime && <>
                    <p className="text-3xl font-bold text-gray-300 font-mono">00:00:00</p>
                    <p className="text-sm text-gray-400 mt-1">Not yet checked in</p>
                  </>}
                {!isCheckedIn && checkOutTime && <>
                    <p className="text-3xl font-bold text-[#162E93] font-mono tracking-wider">{formatElapsed(elapsedSeconds)}</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">✓ Day Complete</p>
                  </>}

                {
    /* Three-field row: Check-in | Break | Check-out */
  }
                <div className="grid grid-cols-3 gap-0 mt-4 pt-3 border-t border-gray-200/60 w-full">
                  <div className="text-center px-2">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Check-in</p>
                    <p className="text-xs font-semibold text-gray-700">{checkInTime ?? "\u2014"}</p>
                  </div>
                  <div className="text-center px-2 border-x border-gray-200/60">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Break</p>
                    <p className="text-xs font-semibold text-amber-600 font-mono">
                      {currentBreakSeconds > 0 ? `${Math.floor(currentBreakSeconds / 60).toString().padStart(2, "0")}:${(currentBreakSeconds % 60).toString().padStart(2, "0")}` : "\u2014"}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-1">Check-out</p>
                    <p className="text-xs font-semibold text-gray-700">{checkOutTime ?? "\u2014"}</p>
                  </div>
                </div>
              </div>

              {
    /* ── Button flow ─────────────────────────────────────── */
  }

              {
    /* State 4 — day complete */
  }
              {checkOutTime && <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-xl border border-gray-200">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-semibold text-gray-600">Attendance Marked for Today</span>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    {checkInTime} → {checkOutTime} · {formatElapsed(elapsedSeconds)} worked
                  </p>
                </div>}

              {
    /* State 1 — not checked in yet */
  }
              {!isCheckedIn && !checkOutTime && <Button onClick={handleCheckIn} className="w-full h-11 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2">
                  <LogIn className="h-5 w-5" />
                  Check In
                </Button>}

              {
    /* State 2 — checked in, working */
  }
              {isCheckedIn && !isOnBreak && <div className="flex gap-3">
                  <Button
    onClick={handleBreak}
    variant="outline"
    className="flex-1 h-11 rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-700 gap-2"
  >
                    <Coffee className="h-4 w-4" />
                    Take Break
                  </Button>
                  <Button
    onClick={handleCheckOut}
    variant="outline"
    className="flex-1 h-11 rounded-xl border-red-300 text-red-600 hover:bg-red-50 gap-2"
  >
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </Button>
                </div>}

              {
    /* State 3 — on break */
  }
              {isCheckedIn && isOnBreak && <div className="flex gap-3">
                  <Button
    onClick={handleResume}
    className="flex-1 h-11 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2"
  >
                    <Play className="h-4 w-4" />
                    Resume Work
                  </Button>
                  <Button
    onClick={handleCheckOut}
    variant="outline"
    className="flex-1 h-11 rounded-xl border-red-300 text-red-600 hover:bg-red-50 gap-2"
  >
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </Button>
                </div>}

              {
    /* Status legend */
  }
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                {[
    { color: "bg-green-500", label: "Present" },
    { color: "bg-red-500", label: "Absent" },
    { color: "bg-gray-400", label: "Late" },
    { color: "bg-blue-500", label: "Half Day" },
    { color: "bg-orange-400", label: "Holiday" }
  ].map((s) => <div key={s.label} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.color}`} />
                    {s.label}
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {
    /* Attendance Calendar with live status colours */
  }
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendance Calendar</CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {[
    { color: "bg-green-400", label: "Present" },
    { color: "bg-red-400", label: "Absent" },
    { color: "bg-gray-300", label: "Late" },
    { color: "bg-blue-400", label: "Half Day" },
    { color: "bg-orange-300", label: "Holiday" }
  ].map((s) => <div key={s.label} className="flex items-center gap-1 text-[9px] text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      {s.label}
                    </div>)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
    mode="single"
    selected={selectedDate}
    onSelect={setSelectedDate}
    className="rounded-xl border"
    modifiers={calModifiers}
    modifiersStyles={calModifiersStyles}
  />
            </CardContent>
          </Card>
        </div>

        {
    /* ── Attendance History ──────────────────────────────────────── */
  }
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left p-3 text-xs font-semibold text-gray-500">Date</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500">Check In</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500">Check Out</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500">Working Hours</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((r, i) => <tr key={r.id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-700 font-medium">
                        {r.date ? (/* @__PURE__ */ new Date(r.date + "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="p-3 text-gray-600">{r.checkIn}</td>
                      <td className="p-3 text-gray-600">{r.checkOut}</td>
                      <td className="p-3 text-gray-700 font-medium">{r.workingHours}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold ${STATUS_BADGE[r.status]}`}>
                          {r.status}
                        </span>
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
  EmployeeAttendance as default
};
