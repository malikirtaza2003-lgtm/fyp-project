import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AttendanceProvider } from "./contexts/attendance-context";

const GLOBAL_THEME_KEY = "wf_theme_global";

export default function App() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = localStorage.getItem(GLOBAL_THEME_KEY);
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <AttendanceProvider>
      <RouterProvider router={router} />
    </AttendanceProvider>
  );
}
