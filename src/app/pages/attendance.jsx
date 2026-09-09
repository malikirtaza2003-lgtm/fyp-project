import { useEffect, useState, useMemo } from "react";
import { getCurrentRole } from "../utils/auth";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
import {
  LogIn,
  LogOut,
  Clock,
  Search,
  X,
  Plus,
  CalendarDays,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  User,
  Briefcase,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Coffee,
  Play
} from "lucide-react";
import { showToast } from "../utils/toast";
import { useAttendance } from "../contexts/attendance-context";
import { fetchAttendance, fetchSettings, fetchUsers, saveAttendance, updateSettings } from "../utils/api";
const getDept = (name, users) => users.find((e) => e.name === name)?.department ?? "—";
const initialRecords = [];
const allDateRecords = [];

function mapAttendanceRecord(record) {
  const id = record.id ?? record._id;

  if (!id) {
    return null;
  }

  const employeeValue = record.employee || record.user;
  const employeeName = typeof employeeValue === "object" ? (employeeValue.name ?? "") : (employeeValue ?? "");

  const status = record.status === "Checked In" || record.status === "On Break" || record.status === "Checked Out"
    ? "Present"
    : record.status ?? "Present";

  const deptVal = record.department;
  const deptStr = typeof deptVal === "object" ? (deptVal.name ?? "") : (deptVal ?? "");

  return {
    id,
    employee: employeeName,
    department: deptStr,
    checkIn: record.checkIn ?? "—",
    checkOut: record.checkOut ?? "—",
    workingHours: record.workingHours ?? "0h",
    status,
    date: record.date ?? "",
  };
}
function statusStyle(s) {
  const base = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border";
  if (s === "Present") return `${base} bg-green-100 text-green-700 border-green-200`;
  if (s === "Late") return `${base} bg-amber-100 text-amber-700 border-amber-200`;
  if (s === "Leave") return `${base} bg-blue-100 text-blue-700 border-blue-200`;
  return `${base} bg-red-100 text-red-700 border-red-200`;
}
function statusIcon(s) {
  if (s === "Present") return <CheckCircle2 className="h-3 w-3" />;
  if (s === "Late") return <AlertCircle className="h-3 w-3" />;
  if (s === "Leave") return <CalendarIcon className="h-3 w-3" />;
  return <XCircle className="h-3 w-3" />;
}
function toDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function fmtDate(d) {
  return (/* @__PURE__ */ new Date(d + "T00:00:00")).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateFull(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function fmtDateHeader(d) {
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}
function formatElapsed(s) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor(s % 3600 / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
function calcHours(ci, co) {
  try {
    const toMins = (t) => {
      const parts = t.trim().split(" ");
      const ampm = parts[1];
      const [hStr, mStr] = parts[0].split(":");
      let h = parseInt(hStr), m = parseInt(mStr);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };
    const diff = toMins(co) - toMins(ci);
    if (diff <= 0) return "";
    return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? ` ${diff % 60}m` : ""}`;
  } catch {
    return "";
  }
}
function getEventDates(event) {
  const dates = [];
  const start = /* @__PURE__ */ new Date(event.startDate + "T00:00:00");
  const end = /* @__PURE__ */ new Date(event.endDate + "T00:00:00");
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(toDateStr(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
function buildEventMap(events) {
  const map = /* @__PURE__ */ new Map();
  events.forEach((ev) => {
    getEventDates(ev).forEach((d) => map.set(d, ev.eventName));
  });
  return map;
}
const emptyEventForm = {
  eventName: "",
  eventType: "Holiday",
  startDate: "",
  endDate: "",
  description: "",
  isRange: false
};
function AddEventModal({ open, onClose, onSave, events, onDeleteEvent }) {
  const [form, setForm] = useState({ ...emptyEventForm });
  const cf = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleSave = () => {
    if (!form.eventName.trim()) {
      showToast("Event name is required.", "error");
      return;
    }
    if (!form.startDate) {
      showToast("Please select a start date.", "error");
      return;
    }
    if (form.isRange && !form.endDate) {
      showToast("Please select an end date.", "error");
      return;
    }
    const ev = {
      id: Date.now(),
      eventName: form.eventName.trim(),
      eventType: form.eventType,
      startDate: form.startDate,
      endDate: form.isRange ? form.endDate : form.startDate,
      description: form.description.trim()
    };
    onSave(ev);
    setForm({ ...emptyEventForm });
    showToast(`"${ev.eventName}" added to calendar.`, "success");
  };
  return <Dialog open={open} onOpenChange={(v) => {
    if (!v) onClose();
  }}>
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#162E93]" /> Add Calendar Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">

          {
    /* ── Existing events list ── */
  }
          {events.length > 0 && <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Current Events</p>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {events.map((ev) => {
    const isRange = ev.startDate !== ev.endDate;
    return <div key={ev.id} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${ev.eventType === "Holiday" ? "bg-amber-100" : "bg-purple-100"}`}>
                        {ev.eventType === "Holiday" ? <Star className="h-3.5 w-3.5 text-amber-600" /> : <Sparkles className="h-3.5 w-3.5 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{ev.eventName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {ev.eventType} ·{" "}
                          {isRange ? `${fmtDate(ev.startDate)} \u2192 ${fmtDate(ev.endDate)}` : fmtDate(ev.startDate)}
                        </p>
                        {ev.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{ev.description}</p>}
                      </div>
                      <button
      onClick={() => onDeleteEvent(ev.id)}
      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
    >
                        <X className="h-4 w-4" />
                      </button>
                    </div>;
  })}
              </div>
            </div>}

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-sm font-semibold text-gray-700">New Event</p>

            {
    /* Event Name */
  }
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Event Name <span className="text-red-500">*</span></Label>
              <Input
    placeholder="e.g. Eid ul-Adha, National Holiday, Exam Day"
    value={form.eventName}
    onChange={(e) => cf("eventName", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
            </div>

            {
    /* Event Type */
  }
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Event Type</Label>
              <div className="flex gap-2">
                {["Holiday", "Special Event"].map((type) => <button
    key={type}
    type="button"
    onClick={() => cf("eventType", type)}
    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${form.eventType === type ? type === "Holiday" ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-purple-100 border-purple-400 text-purple-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
  >
                    {type === "Holiday" ? <Star className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {type}
                  </button>)}
              </div>
            </div>

            {
    /* Date Range Toggle */
  }
            <div className="flex items-center gap-2">
              <button
    type="button"
    onClick={() => cf("isRange", !form.isRange)}
    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.isRange ? "bg-[#162E93]" : "bg-gray-200"}`}
  >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isRange ? "left-5" : "left-0.5"}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">Multi-day event (date range)</span>
            </div>

            {
    /* Date Selection */
  }
            {!form.isRange ? <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></Label>
                <Input
    type="date"
    value={form.startDate}
    onChange={(e) => cf("startDate", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              </div> : <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></Label>
                  <Input
    type="date"
    value={form.startDate}
    onChange={(e) => cf("startDate", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></Label>
                  <Input
    type="date"
    value={form.endDate}
    min={form.startDate}
    onChange={(e) => cf("endDate", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
                </div>
              </div>}

            {
    /* Description */
  }
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Description <span className="text-gray-400 text-xs font-normal">(optional)</span></Label>
              <textarea
    rows={2}
    placeholder="Brief description of this event…"
    value={form.description}
    onChange={(e) => cf("description", e.target.value)}
    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#162E93]/30"
  />
            </div>

            {
    /* Actions */
  }
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />Cancel
              </Button>
              <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white" onClick={handleSave}>
                <Plus className="h-4 w-4 mr-2" />Save Event
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
const emptyManual = { employee: "", checkIn: "", checkOut: "", status: "Present", workingHours: "", date: "" };
function ManualAttendanceModal({ open, onClose, onSave, employeeOptions }) {
  const [form, setForm] = useState({ ...emptyManual });
  const employeeList = employeeOptions ?? [];
  const change = (k, v) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "checkIn" || k === "checkOut") {
        const ci = k === "checkIn" ? v : prev.checkIn;
        const co = k === "checkOut" ? v : prev.checkOut;
        const calc = calcHours(ci, co);
        if (calc) next.workingHours = calc;
      }
      if (k === "status" && (v === "Absent" || v === "Leave")) {
        next.checkIn = "\u2014";
        next.checkOut = "\u2014";
        next.workingHours = "0h";
      }
      return next;
    });
  };
  const handleSave = () => {
    if (!form.employee) {
      showToast("Please select an employee.", "error");
      return;
    }
    onSave(form);
    setForm({ ...emptyManual });
  };
  const showTimes = form.status !== "Absent" && form.status !== "Leave";
  return <Dialog open={open} onOpenChange={(v) => {
    if (!v) onClose();
  }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-[#162E93]" /> Manual Attendance
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Employee <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
    value={form.employee}
    onChange={(e) => change("employee", e.target.value)}
    className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#162E93]/30 appearance-none"
  >
                <option value="">Select employee…</option>
                {employeeList.map((e) => <option key={e.name} value={e.name}>{e.name} — {typeof e.department === "object" ? (e.department.name ?? "—") : (e.department || "—")}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Date</Label>
            <Input
    type="date"
    value={form.date}
    onChange={(e) => change("date", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Status</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {["Present", "Late", "Leave", "Absent"].map((s) => <button
    key={s}
    type="button"
    onClick={() => change("status", s)}
    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${form.status === s ? s === "Present" ? "bg-green-100 border-green-400 text-green-700" : s === "Late" ? "bg-amber-100 border-amber-400 text-amber-700" : s === "Leave" ? "bg-blue-100 border-blue-400 text-blue-700" : "bg-red-100 border-red-400 text-red-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
  >{s}</button>)}
            </div>
          </div>
          {showTimes && <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Check-in Time</Label>
                <Input
    placeholder="e.g. 09:00 AM"
    value={form.checkIn === "\u2014" ? "" : form.checkIn}
    onChange={(e) => change("checkIn", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Check-out Time</Label>
                <Input
    placeholder="e.g. 06:00 PM"
    value={form.checkOut === "\u2014" ? "" : form.checkOut}
    onChange={(e) => change("checkOut", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
              </div>
            </div>}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Working Hours
              <span className="text-xs font-normal text-gray-400 ml-2">(auto-calculated)</span>
            </Label>
            <Input
    placeholder="Auto-calculated or enter manually"
    value={form.workingHours}
    onChange={(e) => change("workingHours", e.target.value)}
    className="rounded-xl border-gray-200 focus-visible:ring-[#162E93]"
  />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl border-gray-200" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button className="flex-1 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] text-white" onClick={handleSave}>
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}
const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function AttendanceCalendar({ selected, onSelect, records, eventMap, eventDateSet }) {
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const todayStr = new Date().toISOString().slice(0, 10);
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };
  const dateStatusMap = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    records.forEach((r) => {
      if (!map.has(r.date)) map.set(r.date, /* @__PURE__ */ new Set());
      map.get(r.date).add(r.status);
    });
    return map;
  }, [records]);
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const selectedStr = toDateStr(selected);
  const cells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return <div className="w-full select-none">
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm font-bold text-gray-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
    if (day === null) return <div key={`e-${idx}`} />;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = dateStr === selectedStr;
    const isEvent = eventDateSet.has(dateStr);
    const statuses = dateStatusMap.get(dateStr);
    const isToday = dateStr === todayStr;
    const hasPresent = statuses?.has("Present") ?? false;
    const hasAbsent = statuses?.has("Absent") ?? false;
    const hasLeave = statuses?.has("Leave") ?? false;
    const hasLate = statuses?.has("Late") ?? false;
    let cellBg = "";
    let cellText = "text-gray-700";
    let cellBorder = "";
    if (isSelected) {
      cellBg = "bg-[#162E93]";
      cellText = "text-white";
    } else if (isEvent) {
      cellBg = "bg-orange-50";
      cellBorder = "ring-1 ring-orange-300";
      cellText = "text-orange-800";
    } else if (hasAbsent) {
      cellBg = "bg-red-50";
      cellText = "text-red-800";
    } else if (hasLeave) {
      cellBg = "bg-blue-50";
      cellText = "text-blue-800";
    } else if (hasLate) {
      cellBg = "bg-gray-100";
      cellText = "text-gray-600";
    } else if (hasPresent) {
      cellBg = "bg-green-50";
      cellText = "text-green-800";
    }
    if (isToday && !isSelected && !isEvent) {
      cellBorder = "ring-2 ring-[#162E93]";
    }
    const bars = [];
    if (!isSelected) {
      if (isEvent) bars.push("bg-orange-500");
      if (hasPresent) bars.push("bg-green-500");
      if (hasAbsent) bars.push("bg-red-500");
      if (hasLeave) bars.push("bg-blue-500");
      if (hasLate) bars.push("bg-gray-400");
    }
    return <button
      key={dateStr}
      onClick={() => onSelect(/* @__PURE__ */ new Date(dateStr + "T00:00:00"))}
      className={`relative flex flex-col items-center justify-between rounded-lg min-h-[48px] pt-1.5 pb-0.5 overflow-hidden transition-all hover:opacity-75 ${cellBg} ${cellText} ${cellBorder}`}
    >
              <span className={`text-xs font-semibold leading-none ${isToday && !isSelected ? "font-extrabold underline decoration-[#162E93] underline-offset-2 text-[#162E93]" : ""} ${isSelected ? "text-white" : ""}`}>
                {day}
              </span>
              {isEvent && !isSelected && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500" />}
              {bars.length > 0 ? <div className="flex w-full mt-1 gap-px px-0.5">
                  {bars.map((color, i) => <span key={i} className={`h-1.5 flex-1 rounded-sm ${color}`} />)}
                </div> : <span className="h-1.5 mt-1" />}
            </button>;
  })}
      </div>
    </div>;
}
function HistoryView({ employeeName, records, users, onBack }) {
  const historyRecords = useMemo(
    () => records.filter((record) => record.employee === employeeName),
    [records, employeeName],
  );
  const dept = getDept(employeeName, users);
  const stats = useMemo(() => {
    const present = historyRecords.filter((r) => r.status === "Present").length;
    const absent = historyRecords.filter((r) => r.status === "Absent").length;
    const leave = historyRecords.filter((r) => r.status === "Leave").length;
    const late = historyRecords.filter((r) => r.status === "Late").length;
    const total = historyRecords.length;
    const totalHrs = historyRecords.reduce((acc, r) => acc + (parseFloat(r.workingHours) || 0), 0);
    return { present, absent, leave, late, total, totalHrs: totalHrs.toFixed(1) };
  }, [historyRecords]);
  const attendancePct = stats.total > 0 ? Math.round((stats.present + stats.late) / stats.total * 100) : 0;
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#162E93]/10 flex items-center justify-center">
            <span className="text-base font-bold text-[#162E93]">
              {(typeof employeeName === "object" ? (employeeName.name ?? "—") : (employeeName || "—")).split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{typeof employeeName === "object" ? (employeeName.name ?? "—") : (employeeName || "—")}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />{dept} · Full Attendance History
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
    { label: "Present", value: stats.present, icon: <CheckCircle2 className="h-4 w-4" />, bg: "bg-green-100", text: "text-green-700" },
    { label: "Absent", value: stats.absent, icon: <XCircle className="h-4 w-4" />, bg: "bg-red-100", text: "text-red-700" },
    { label: "Leave", value: stats.leave, icon: <CalendarIcon className="h-4 w-4" />, bg: "bg-blue-100", text: "text-blue-700" },
    { label: "Late", value: stats.late, icon: <AlertCircle className="h-4 w-4" />, bg: "bg-amber-100", text: "text-amber-700" }
  ].map((s) => <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.text}`}>{s.icon}</div>
              <div>
                <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>)}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Attendance Rate</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overall Attendance</span>
              <span className="font-bold text-gray-900">{attendancePct}%</span>
            </div>
            <Progress value={attendancePct} className="h-3" />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
    { label: "Days Present", value: stats.present + stats.late, color: "text-green-700 bg-green-50 border-green-100" },
    { label: "Days Absent", value: stats.absent, color: "text-red-700 bg-red-50 border-red-100" },
    { label: "Days Leave", value: stats.leave, color: "text-blue-700 bg-blue-50 border-blue-100" }
  ].map((s) => <div key={s.label} className={`p-2 rounded-lg border text-center ${s.color}`}>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] font-medium mt-0.5">{s.label}</p>
                </div>)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Working Hours Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#162E93]/5 rounded-xl border border-[#162E93]/10">
              <Timer className="h-6 w-6 text-[#162E93]" />
              <div>
                <p className="text-2xl font-bold text-[#162E93]">{stats.totalHrs}h</p>
                <p className="text-xs text-gray-500">Total hours logged</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">Avg / Working Day</p>
                <p className="text-base font-bold text-gray-900">
                  {stats.present + stats.late > 0 ? (parseFloat(stats.totalHrs) / (stats.present + stats.late)).toFixed(1) : "0"}h
                </p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">Total Records</p>
                <p className="text-base font-bold text-gray-900">{stats.total} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Full Attendance Record</CardTitle></CardHeader>
        <CardContent className="p-0 pb-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
                <TableHead className="font-semibold text-gray-700">Check In</TableHead>
                <TableHead className="font-semibold text-gray-700">Check Out</TableHead>
                <TableHead className="font-semibold text-gray-700">Working Hours</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyRecords.map((r, i) => <TableRow key={i} className="hover:bg-gray-50/60">
                  <TableCell className="text-sm text-gray-700 font-medium">{fmtDate(r.date)}</TableCell>
                  <TableCell className="text-sm text-gray-600">{r.checkIn}</TableCell>
                  <TableCell className="text-sm text-gray-600">{r.checkOut}</TableCell>
                  <TableCell className="text-sm text-gray-600">{r.workingHours}</TableCell>
                  <TableCell>
                    <span className={statusStyle(r.status)}>{statusIcon(r.status)}{r.status}</span>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>;
}
function Attendance() {
  const userRole = getCurrentRole();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState(allDateRecords);
  const [users, setUsers] = useState([]);
  const [settingsSnapshot, setSettingsSnapshot] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(/* @__PURE__ */ new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const isAdminOrLead = userRole === "admin" || userRole === "teamlead";

  const employeeOptions = users
    .filter((user) => String(user.role ?? "").toLowerCase() === "employee")
    .map((user) => ({
      id: user.id ?? user._id,
      name: typeof user.name === "object" ? (user.name.name ?? "—") : (user.name || "—"),
      department: typeof user.department === "object" ? (user.department.name ?? "") : (user.department ?? ""),
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

    async function loadAttendance() {
      try {
        const [attendanceData, userData, settingsData] = await Promise.all([
          fetchAttendance(),
          fetchUsers(),
          fetchSettings(),
        ]);

        if (mounted) {
          const mapped = attendanceData.map(mapAttendanceRecord).filter(Boolean);
          setRecords(mapped);
          setUsers(userData ?? []);
          setSettingsSnapshot(settingsData ?? {});
          setCalendarEvents(settingsData?.calendarEvents ?? []);
        }
      } catch {
        if (mounted) {
          setRecords([]);
          setUsers([]);
          setSettingsSnapshot(null);
          setCalendarEvents([]);
        }
      }
    }

    loadAttendance();

    return () => {
      mounted = false;
    };
  }, []);
  const eventMap = useMemo(() => buildEventMap(calendarEvents), [calendarEvents]);
  const eventDateSet = useMemo(() => new Set(eventMap.keys()), [eventMap]);
  const selectedDateStr = toDateStr(selectedDate);
  const filteredRecords = records;
  const dateRecords = useMemo(
    () => filteredRecords.filter((r) => r.date === selectedDateStr),
    [filteredRecords, selectedDateStr]
  );
  const tableRecords = useMemo(
    () => dateRecords.filter(
      (r) => r.employee.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [dateRecords, searchQuery]
  );
  const dateSummary = useMemo(() => ({
    present: dateRecords.filter((r) => r.status === "Present").length,
    absent: dateRecords.filter((r) => r.status === "Absent").length,
    leave: dateRecords.filter((r) => r.status === "Leave").length,
    late: dateRecords.filter((r) => r.status === "Late").length,
    totalHrs: dateRecords.reduce((s, r) => s + (parseFloat(r.workingHours) || 0), 0).toFixed(1)
  }), [dateRecords]);
  const selectedIsEvent = eventDateSet.has(selectedDateStr);
  const selectedEventName = eventMap.get(selectedDateStr);
  const handleManualSave = (form) => {
    const dateKey = form.date || selectedDateStr;
    const employee = resolveEmployee(form.employee);

    if (!employee) {
      showToast("Please select a valid employee.", "error");
      return;
    }

    saveAttendance({
      user: employee.id ?? employee._id ?? employee.email ?? employee.name,
      employee: employee.name,
      department: employee.department ?? "",
      date: dateKey,
      checkIn: form.checkIn || "—",
      checkOut: form.checkOut || "—",
      workingHours: form.workingHours || "0h",
      status: form.status,
    })
      .then((saved) => {
        const rec = mapAttendanceRecord(saved);
        if (!rec) {
          return;
        }
        setRecords((prev) => {
          const idx = prev.findIndex((row) => row.employee === form.employee && row.date === dateKey);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = rec;
            return next;
          }
          return [...prev, rec];
        });
        setManualOpen(false);
        showToast(`Attendance for ${form.employee} updated.`, "success");
      })
      .catch((error) => {
        showToast(error.message || "Unable to save attendance.", "error");
      });
  };

  const persistCalendarEvents = async (nextEvents) => {
    setCalendarEvents(nextEvents);

    if (!settingsSnapshot) {
      return;
    }

    try {
      const saved = await updateSettings({
        ...settingsSnapshot,
        calendarEvents: nextEvents,
      });
      setSettingsSnapshot(saved);
    } catch (error) {
      showToast(error.message || "Unable to save calendar events.", "error");
    }
  };

  const handleAddEvent = (event) => {
    persistCalendarEvents([...(calendarEvents ?? []), event]);
  };

  const handleDeleteEvent = (eventId) => {
    persistCalendarEvents((calendarEvents ?? []).filter((event) => event.id !== eventId));
  };
  const handleCheckIn = () => {
    checkIn();
    showToast("\u2705 Checked in successfully!", "success");
  };
  const handleBreak = () => {
    startBreak();
    showToast("\u2615 Break started", "info");
  };
  const handleResume = () => {
    resumeFromBreak();
    showToast("\u25B6 Resumed working", "info");
  };
  const handleCheckOut = () => {
    checkOut();
    showToast("\u{1F44B} Checked out. Have a great day!", "success");
  };
  if (historyEmployee) {
    return <AppLayout userRole={userRole}>
        <HistoryView
      employeeName={historyEmployee}
      records={records}
      users={users}
      onBack={() => setHistoryEmployee(null)}
    />
      </AppLayout>;
  }
  const isToday = selectedDateStr === new Date().toISOString().slice(0, 10);
  const tableTitle = isToday ? "Today's Attendance" : fmtDateHeader(selectedDate);
  return <AppLayout userRole={userRole}>
      <div className="space-y-6">

        {
    /* ── Header ── */
  }
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1>Attendance Management</h1>
            <p className="text-muted-foreground">
              {userRole === "admin" ? "Track team attendance" : userRole === "teamlead" ? "Track your team's attendance" : "Manage your attendance"}
            </p>
          </div>
          {isAdminOrLead && <div className="flex gap-2">
              {userRole === "admin" && <Button
    className="rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 gap-2 transition-all duration-200"
    onClick={() => setAddEventOpen(true)}
  >
                  <CalendarDays className="h-4 w-4" />Add Event
                </Button>}
              <Button
    className="bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl gap-2"
    onClick={() => setManualOpen(true)}
  >
                <Plus className="h-4 w-4" />Manual Attendance
              </Button>
            </div>}
        </div>

        {
    /* ── Summary Cards (Admin & Team Lead) ── */
  }
        {isAdminOrLead && <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
    { label: "Present Today", value: dateSummary.present, bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle2 className="h-5 w-5" /> },
    { label: "Absent Today", value: dateSummary.absent, bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-5 w-5" /> },
    { label: "On Leave", value: dateSummary.leave, bg: "bg-blue-100", text: "text-blue-700", icon: <CalendarIcon className="h-5 w-5" /> },
    { label: "Late Today", value: dateSummary.late, bg: "bg-amber-100", text: "text-amber-700", icon: <AlertCircle className="h-5 w-5" /> }
  ].map((s) => <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg} ${s.text}`}>{s.icon}</div>
                  <div>
                    <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>)}
          </div>}

        {
    /* ── Today's Attendance — unified design (all roles) ── */
  }
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
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
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-stretch gap-5">

              {
    /* Timer display panel */
  }
              <div className={`flex-1 p-5 rounded-2xl border-2 flex flex-col items-center justify-center text-center ${isOnBreak ? "border-amber-200 bg-amber-50" : isCheckedIn ? "border-green-200 bg-green-50" : checkOutTime ? "border-[#162E93]/20 bg-[#162E93]/5" : "border-gray-100 bg-gray-50"}`}>
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
    /* Action buttons column */
  }
              <div className="flex flex-col gap-3 w-full md:w-52">
                {
    /* State 1: not checked in */
  }
                {!isCheckedIn && !checkOutTime && <Button
    onClick={handleCheckIn}
    className="w-full h-12 rounded-xl bg-[#162E93] hover:bg-[#1a36a8] gap-2 text-sm font-semibold"
  >
                    <LogIn className="h-5 w-5" />Check In
                  </Button>}

                {
    /* States 2 & 3: checked in */
  }
                {isCheckedIn && <>
                    {!isOnBreak ? <Button
    variant="outline"
    onClick={handleBreak}
    className="w-full h-12 rounded-xl border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-600 gap-2 text-sm font-semibold"
  >
                        <Coffee className="h-5 w-5" />Take a Break
                      </Button> : <Button
    variant="outline"
    onClick={handleResume}
    className="w-full h-12 rounded-xl border-[#088395]/40 text-[#088395] hover:bg-[#088395]/5 gap-2 text-sm font-semibold"
  >
                        <Play className="h-5 w-5" />Resume Work
                      </Button>}
                    <Button
    onClick={handleCheckOut}
    className="w-full h-12 rounded-xl bg-[#D6090D] hover:bg-red-700 gap-2 text-sm font-semibold"
  >
                      <LogOut className="h-5 w-5" />Check Out
                    </Button>
                  </>}

                {
    /* State 4: checked out */
  }
                {!isCheckedIn && checkOutTime && <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-700">Done for today!</p>
                      <p className="text-xs text-green-600">Checked out at {checkOutTime}</p>
                    </div>
                  </div>}

                {!isCheckedIn && !checkOutTime && <p className="text-[11px] text-gray-400 text-center leading-relaxed mt-1">
                    Click Check In to start tracking your working hours for today.
                  </p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {
    /* ── Main grid: Table + Calendar ── */
  }
        <div className="grid gap-5 lg:grid-cols-3">

          {
    /* Table section */
  }
          <div className="lg:col-span-2 space-y-3">
            {isAdminOrLead && <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
    placeholder={userRole === "teamlead" ? "Search team member by name\u2026" : "Search employee by name\u2026"}
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 rounded-xl border-gray-200 bg-white"
  />
                {searchQuery && <button
    onClick={() => setSearchQuery("")}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
  >
                    <X className="h-4 w-4" />
                  </button>}
              </div>}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {tableTitle}
                      {selectedIsEvent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                          <Star className="h-3 w-3" />{selectedEventName}
                        </span>}
                    </CardTitle>
                    {!isToday && <p className="text-xs text-gray-400 mt-0.5">
                        Click any date in the calendar to view that day's attendance
                      </p>}
                  </div>
                  {isAdminOrLead && dateRecords.length > 0 && <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      {[
    { label: `${dateSummary.present} Present`, cls: "bg-green-100 text-green-700 border-green-200" },
    { label: `${dateSummary.absent} Absent`, cls: "bg-red-100 text-red-700 border-red-200" },
    { label: `${dateSummary.leave} Leave`, cls: "bg-blue-100 text-blue-700 border-blue-200" }
  ].map((b) => <span key={b.label} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${b.cls}`}>
                          {b.label}
                        </span>)}
                    </div>}
                </div>

                {isAdminOrLead && dateRecords.length > 0 && <div className="flex items-center gap-2 mt-2 p-2.5 bg-[#162E93]/5 rounded-xl border border-[#162E93]/10">
                    <Timer className="h-4 w-4 text-[#162E93]" />
                    <span className="text-xs text-gray-600">Total working hours logged:</span>
                    <span className="text-sm font-bold text-[#162E93]">{dateSummary.totalHrs}h</span>
                    <span className="ml-auto text-xs text-gray-400">{dateRecords.length} employees</span>
                  </div>}
              </CardHeader>

              <CardContent className="p-0 pb-2">
                {selectedIsEvent && dateRecords.length === 0 ? <div className="text-center py-12 space-y-2">
                    <Star className="h-10 w-10 mx-auto text-amber-300" />
                    <p className="font-semibold text-gray-700">{selectedEventName}</p>
                    <p className="text-sm text-gray-400">This is a holiday/event. No attendance records.</p>
                  </div> : <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          {
    /* Employee Name column — visible to Admin & Team Lead */
  }
                          {isAdminOrLead && <TableHead className="font-semibold text-gray-700">Employee</TableHead>}
                          {
    /* Department column — visible to Admin & Team Lead */
  }
                          {isAdminOrLead && <TableHead className="font-semibold text-gray-700">Department</TableHead>}
                          <TableHead className="font-semibold text-gray-700">Check In</TableHead>
                          <TableHead className="font-semibold text-gray-700">Check Out</TableHead>
                          <TableHead className="font-semibold text-gray-700">Hours</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          {
    /* History column — visible to Admin & Team Lead */
  }
                          {isAdminOrLead && <TableHead className="font-semibold text-gray-700">History</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableRecords.map((record) => <TableRow key={record.id} className="hover:bg-gray-50/60 transition-colors">

                            {
    /* ── Employee Name Cell ── */
  }
                            {isAdminOrLead && <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-[#162E93]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-bold text-[#162E93]">
                                      {record.employee.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                    </span>
                                  </div>
                                  <span className="font-medium text-gray-900 text-sm whitespace-nowrap">{record.employee}</span>
                                </div>
                              </TableCell>}

                            {
    /* ── Department Cell ── */
  }
                            {isAdminOrLead && <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                                  {typeof record.department === "object" ? (record.department.name ?? "—") : (record.department || "—")}
                                </span>
                              </TableCell>}

                            {
    /* ── Time & Status Cells ── */
  }
                            <TableCell className="text-sm text-gray-600">{record.checkIn}</TableCell>
                            <TableCell className="text-sm text-gray-600">{record.checkOut}</TableCell>
                            <TableCell className="text-sm text-gray-600">{record.workingHours}</TableCell>
                            <TableCell>
                              <span className={statusStyle(record.status)}>{statusIcon(record.status)}{record.status}</span>
                            </TableCell>

                            {
    /* ── View History Cell ── */
  }
                            {isAdminOrLead && <TableCell>
                                <button
    onClick={() => setHistoryEmployee(record.employee)}
    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#162E93]/20 bg-[#162E93]/5 text-[#162E93] hover:bg-[#162E93]/10 transition-colors whitespace-nowrap"
  >
                                  <CalendarIcon className="h-3 w-3" />View History
                                </button>
                              </TableCell>}
                          </TableRow>)}
                        {isAdminOrLead && tableRecords.length === 0 && !selectedIsEvent && <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                              {searchQuery ? "No team members match your search." : "No records for this date."}
                            </TableCell>
                          </TableRow>}
                      </TableBody>
                    </Table>
                  </div>}
              </CardContent>
            </Card>
          </div>

          {
    /* Calendar section */
  }
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-[#162E93]" />Calendar View
                </CardTitle>
                <p className="text-xs text-gray-400">Click a date to view attendance</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">

                <AttendanceCalendar
    selected={selectedDate}
    onSelect={setSelectedDate}
    records={filteredRecords}
    eventMap={eventMap}
    eventDateSet={eventDateSet}
  />

                {
    /* Legend */
  }
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-100">
                  {[
    { color: "bg-green-500", label: "Present" },
    { color: "bg-red-500", label: "Absent" },
    { color: "bg-blue-500", label: "Leave" },
    { color: "bg-orange-500", label: "Holiday/Event" },
    { color: "bg-gray-400", label: "Late" }
  ].map((item) => <div key={item.label} className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.color}`} />
                      <span className="text-gray-600">{item.label}</span>
                    </div>)}
                </div>

                {
    /* Selected date summary */
  }
                <div className="p-3 bg-[#162E93]/5 rounded-xl border border-[#162E93]/10 space-y-2">
                  <p className="text-xs font-semibold text-[#162E93] flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {fmtDateFull(selectedDate)}
                  </p>
                  {selectedIsEvent ? <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 text-orange-500" />{selectedEventName} — Holiday / Event
                    </p> : dateRecords.length > 0 ? <div className="grid grid-cols-2 gap-1.5">
                      {[
    { label: "Present", value: dateSummary.present, cls: "text-green-700" },
    { label: "Absent", value: dateSummary.absent, cls: "text-red-700" },
    { label: "Leave", value: dateSummary.leave, cls: "text-blue-700" },
    { label: "Late", value: dateSummary.late, cls: "text-amber-700" }
  ].map((s) => <div key={s.label} className="flex justify-between text-xs">
                          <span className="text-gray-500">{s.label}:</span>
                          <span className={`font-bold ${s.cls}`}>{s.value}</span>
                        </div>)}
                    </div> : <p className="text-xs text-gray-400">No records for this date.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {
    /* ── Modals ── */
  }
      {isAdminOrLead && <ManualAttendanceModal
    open={manualOpen}
    onClose={() => setManualOpen(false)}
    onSave={handleManualSave}
    employeeOptions={employeeOptions}
  />}
      <AddEventModal
    open={addEventOpen}
    onClose={() => setAddEventOpen(false)}
    onSave={handleAddEvent}
    events={calendarEvents}
    onDeleteEvent={handleDeleteEvent}
  />

    </AppLayout>;
}
export {
  Attendance as default
};
