import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, Building2, User, Mail, Phone, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { setAuthSession, normalizeRole } from "../utils/auth";
import { register as registerUser } from "../utils/api";
import { showToast } from "../utils/toast";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "",
    workspace: "", role: "admin",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.workspace,
        role: formData.role,
      });

      setAuthSession({ token: response.token, user: response.user });
      const nextRole = normalizeRole(response.user?.role);

      if (nextRole === "admin") navigate("/admin/dashboard");
      else if (nextRole === "teamlead") navigate("/teamlead/dashboard");
      else navigate("/employee/dashboard");
    } catch (error) {
      showToast(error.message || "Unable to create account", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "14-day free trial, no credit card required",
    "Unlimited projects and team members",
    "Advanced analytics and reporting",
    "24/7 customer support",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#1A1953] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#162E93]/40 blur-3xl" />
          <div className="absolute bottom-20 -left-20 w-72 h-72 rounded-full bg-[#088395]/30 blur-3xl" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-[#088395] rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">SyncFlow</span>
        </div>
        <div className="relative space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">Start managing your team today</h2>
            <p className="text-white/70">Join thousands of teams already using SyncFlow to streamline operations.</p>
          </div>
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#088395] flex-shrink-0" />
                <span className="text-white/80 text-sm">{b}</span>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white/70 text-sm italic">"The best team management tool we've ever used. Setup was incredibly fast."</p>
            <p className="text-white/50 text-xs mt-3">— Marcus L., CTO at Nexus Solutions</p>
          </div>
        </div>
        <div />
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 lg:p-12 bg-[#F5F7FB] overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-[#162E93] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1953]">SyncFlow</span>
          </div>

          <div className="mb-7">
            <h1 className="text-3xl font-bold text-[#1A1953] mb-2">Create your account</h1>
            <p className="text-gray-500">Set up your workspace and start managing your team</p>
          </div>

          {/* Google Signup */}
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="w-full h-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-gray-700 shadow-sm mb-5"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#F5F7FB] px-3 text-gray-400 uppercase tracking-wider">Or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm text-gray-700 mb-1.5 block">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="pl-9 bg-white border-gray-200 h-11 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm text-gray-700 mb-1.5 block">Phone <span className="text-gray-400 font-normal">(Optional)</span></Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-9 bg-white border-gray-200 h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm text-gray-700 mb-1.5 block">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="pl-9 bg-white border-gray-200 h-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="workspace" className="text-sm text-gray-700 mb-1.5 block">Workspace Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="workspace"
                  placeholder="your-company"
                  value={formData.workspace}
                  onChange={(e) => setFormData({ ...formData, workspace: e.target.value })}
                  required
                  className="pl-9 bg-white border-gray-200 h-11 rounded-xl"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">.workforce.app</span>
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-gray-700 mb-1.5 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pl-9 pr-10 bg-white border-gray-200 h-11 rounded-xl"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#162E93] hover:bg-[#1a36a8] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            By creating an account, you agree to our{" "}
            <span className="text-[#162E93] cursor-pointer hover:underline">Terms of Service</span>
            {" "}and{" "}
            <span className="text-[#162E93] cursor-pointer hover:underline">Privacy Policy</span>
          </p>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-[#162E93] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
