import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, ShieldCheck, Users, BarChart3, CheckCircle2, ArrowRight, Building2 } from "lucide-react";
import { setAuthSession, normalizeRole } from "../utils/auth";
import { login as loginUser } from "../utils/api";
import { showToast } from "../utils/toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [role, setRole] = useState("employee");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      setAuthSession({ token: response.token, user: response.user });

      const dbRole = normalizeRole(response.user?.role);
      
      if (dbRole === "admin") window.location.href = "/admin/dashboard";
      else if (dbRole === "teamlead") window.location.href = "/teamlead/dashboard";
      else if (dbRole === "employee") window.location.href = "/employee/dashboard";
      else {
        // Fallback for demo or unrecognized roles
        const selectedRole = normalizeRole(role);
        if (selectedRole === "admin") window.location.href = "/admin/dashboard";
        else if (selectedRole === "teamlead") window.location.href = "/teamlead/dashboard";
        else window.location.href = "/employee/dashboard";
      }
    } catch (error) {
      showToast(error.message || "Unable to sign in", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setAuthSession({ 
        token: "demo-token-for-google-login",
        user: { _id: "google-mock-id", role: role, name: "Google User", email: `google-${role}@demo.com` } 
      });
      if (role === "admin") window.location.href = "/admin/dashboard";
      else if (role === "teamlead") window.location.href = "/teamlead/dashboard";
      else window.location.href = "/employee/dashboard";
    }, 600);
  };

  const roles = [
    { value: "admin", label: "Admin", desc: "Full system access", icon: ShieldCheck, color: "from-[#162E93] to-[#1A1953]" },
    { value: "teamlead", label: "Team Lead", desc: "Manage your team", icon: Users, color: "from-[#088395] to-[#0a6b7a]" },
    { value: "employee", label: "Employee", desc: "Personal workspace", icon: BarChart3, color: "from-[#01B01B] to-[#018015]" },
  ];

  const features = [
    "Role-based access control for all team levels",
    "Real-time task and project tracking",
    "Attendance & leave management",
    "Advanced analytics and reporting",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1953] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#162E93]/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#088395]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#088395] rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">SyncFlow</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your team<br />
              <span className="text-[#088395]">smarter & faster</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              A complete employee management platform built for modern teams. Track tasks, attendance, and performance — all in one place.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#088395]/20 border border-[#088395]/40 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-[#088395]" />
                </div>
                <span className="text-white/80 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            {[
              { label: "Active Teams", value: "2.4K+" },
              { label: "Tasks Managed", value: "180K+" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/50 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          <p className="text-white/80 text-sm italic leading-relaxed">
            "SyncFlow transformed how we manage our distributed team. Tasks, attendance, and projects — everything in one dashboard."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-8 h-8 rounded-full bg-[#088395] flex items-center justify-center">
              <span className="text-white text-xs font-bold">SC</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Sarah Chen</p>
              <p className="text-white/50 text-xs">VP Engineering, TechCorp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[#F5F7FB] dark:bg-[#0B0B0F]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-[#162E93] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1953] dark:text-[#F8FAFC]">SyncFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1A1953] dark:text-[#F8FAFC] mb-2">Welcome back</h1>
            <p className="text-gray-500 dark:text-slate-400">Sign in to your workspace to continue</p>
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <Label className="text-sm text-gray-600 dark:text-slate-300 mb-3 block">Login as</Label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`relative p-3 rounded-xl border-2 transition-all text-center ${
                      role === r.value
                        ? "border-[#162E93] bg-[#162E93]/5 shadow-sm dark:border-[#3B82F6] dark:bg-[#3B82F6]/15"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-[#12121A] dark:hover:border-white/20"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center mx-auto mb-1`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className={`text-xs font-semibold ${role === r.value ? "text-[#162E93] dark:text-[#93c5fd]" : "text-gray-700 dark:text-slate-200"}`}>{r.label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-400 mt-0.5 leading-tight">{r.desc}</p>
                    {role === r.value && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#162E93]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Workspace */}
            <div>
              <Label htmlFor="workspace" className="text-sm text-gray-700 dark:text-slate-300 mb-1.5 block">Workspace Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                <Input
                  id="workspace"
                  type="text"
                  placeholder="your-company"
                  value={workspace}
                  onChange={(e) => setWorkspace(e.target.value)}
                  className="pl-9 bg-white border-gray-200 focus:border-[#162E93] h-11 rounded-xl dark:bg-[#12121A] dark:border-[#1F1F2B] dark:text-[#F8FAFC] dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm text-gray-700 dark:text-slate-300 mb-1.5 block">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-gray-200 focus:border-[#162E93] h-11 rounded-xl dark:bg-[#12121A] dark:border-[#1F1F2B] dark:text-[#F8FAFC] dark:placeholder:text-slate-500"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-sm text-gray-700 dark:text-slate-300">Password</Label>
                <Link to="/forgot-password" className="text-xs text-[#088395] hover:text-[#162E93] dark:text-[#7dd3fc] dark:hover:text-[#93c5fd] transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10 bg-white border-gray-200 focus:border-[#162E93] h-11 rounded-xl dark:bg-[#12121A] dark:border-[#1F1F2B] dark:text-[#F8FAFC] dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F5F7FB] dark:bg-[#0B0B0F] px-3 text-gray-400 dark:text-slate-500 uppercase tracking-wider">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700 shadow-sm dark:bg-[#12121A] dark:border-[#1F1F2B] dark:text-slate-200 dark:hover:bg-[#1A1A26] dark:hover:border-[#2D2D3D]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#162E93] dark:text-[#93c5fd] font-semibold hover:underline">
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-[#162E93]/5 dark:bg-[#1E293B] rounded-xl border border-[#162E93]/10 dark:border-[#334155]">
            <p className="text-xs text-gray-500 dark:text-slate-400 text-center mb-2 font-medium">Demo — click any role above then sign in</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] font-semibold text-[#162E93]">Admin</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">admin@demo.com</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#088395]">Team Lead</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">lead@demo.com</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#01B01B]">Employee</p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500">emp@demo.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
