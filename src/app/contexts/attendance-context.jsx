import { createContext, useContext, useEffect, useState } from "react";
import { checkIn as apiCheckIn, checkOut as apiCheckOut, fetchAttendance, resumeFromBreak as apiResumeFromBreak, startBreak as apiStartBreak } from "../utils/api";
import { getCurrentUser } from "../utils/auth";

const defaultCtx = {
  isCheckedIn: false,
  isOnBreak: false,
  checkInTime: null,
  checkOutTime: null,
  elapsedSeconds: 0,
  totalBreakSeconds: 0,
  currentBreakSeconds: 0,
  checkIn: () => {},
  startBreak: () => {},
  resumeFromBreak: () => {},
  checkOut: () => {},
};

const AttendanceContext = createContext(defaultCtx);

export function AttendanceProvider({ children }) {
  const [isCheckedIn, setIsCheckedIn]   = useState(false);
  const [isOnBreak, setIsOnBreak]       = useState(false);
  const [checkInTime, setCheckInTime]   = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [elapsedSeconds, setElapsed]    = useState(0);
  const [totalBreakSeconds, setTotalBreak]   = useState(0);
  const [currentBreakSeconds, setCurrentBreak] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const currentUser = getCurrentUser();
      // Reset state for new user
        if (!currentUser) {
          return;
        }

      try {
        const records = await fetchAttendance();
        const today = new Date().toISOString().slice(0, 10);
        const record = records.find((entry) => entry.userId === currentUser.id && entry.date === today);

        if (!mounted || !record) {
          return;
        }

        const checkInLabel = typeof record.checkIn === "string" ? record.checkIn : null;
        const checkOutLabel = typeof record.checkOut === "string" ? record.checkOut : null;
        const breakMinutes = Number.parseInt(String(record.breakTime ?? "0").replace(/[^0-9]/g, ""), 10) || 0;

        setIsCheckedIn(["Checked In", "On Break"].includes(record.status));
        setIsOnBreak(record.status === "On Break");
        setCheckInTime(checkInLabel && checkInLabel !== "—" ? checkInLabel : null);
        setCheckOutTime(checkOutLabel && checkOutLabel !== "—" ? checkOutLabel : null);
        setTotalBreak(breakMinutes * 60);
      } catch {
        // Keep local timer state if the backend is unavailable.
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, [getCurrentUser()?.id]);

  // Net working time ticker — pauses while on break
  useEffect(() => {
    if (isCheckedIn && !isOnBreak) {
      const id = setInterval(() => setElapsed(s => s + 1), 1000);
      return () => clearInterval(id);
    }
  }, [isCheckedIn, isOnBreak]);

  // Live break session ticker
  useEffect(() => {
    if (isOnBreak) {
      const id = setInterval(() => setCurrentBreak(s => s + 1), 1000);
      return () => clearInterval(id);
    } else {
      setCurrentBreak(0);
    }
  }, [isOnBreak]);

  const checkIn = () => {
    apiCheckIn().catch(() => {});
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setIsCheckedIn(true);
    setIsOnBreak(false);
    setCheckInTime(t);
    setCheckOutTime(null);
    setElapsed(0);
    setTotalBreak(0);
    setCurrentBreak(0);
  };

  const startBreak = () => {
    apiStartBreak().catch(() => {});
    setIsOnBreak(true);
  };

  // Accumulate the current break session into total, then reset
  const resumeFromBreak = () => {
    apiResumeFromBreak().catch(() => {});
    setTotalBreak(prev => prev + currentBreakSeconds);
    setCurrentBreak(0);
    setIsOnBreak(false);
  };

  const checkOut = () => {
    apiCheckOut().catch(() => {});
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    // Capture any in-progress break time
    if (isOnBreak) {
      setTotalBreak(prev => prev + currentBreakSeconds);
    }
    setIsCheckedIn(false);
    setIsOnBreak(false);
    setCurrentBreak(0);
    setCheckOutTime(t);
  };

  return (
    <AttendanceContext.Provider
      value={{
        isCheckedIn, isOnBreak, checkInTime, checkOutTime,
        elapsedSeconds, totalBreakSeconds, currentBreakSeconds,
        checkIn, startBreak, resumeFromBreak, checkOut,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export const useAttendance = () => useContext(AttendanceContext);
