import React, { useState } from "react";
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Globe 
} from "lucide-react";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  isAnonymous?: boolean;
}

interface AuthPanelProps {
  user: AuthUser | null;
  onAuthChange: (user: AuthUser | null) => void;
}

export default function AuthPanel({ user, onAuthChange }: AuthPanelProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError(null);
    setSuccessMsg(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError("Please fill out all credentials.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      setSuccessMsg(isSignUp ? "Account created successfully!" : "Successfully logged in!");
      
      // Store user info in localStorage for session restoration
      localStorage.setItem("aura_user", JSON.stringify(data.user));
      onAuthChange(data.user);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Guest login failed.");
      }

      localStorage.setItem("aura_user", JSON.stringify(data.user));
      onAuthChange(data.user);
    } catch (err: any) {
      console.error(err);
      setError("Unable to initialize guest mode. Please use standard email login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    setIsLoading(true);
    try {
      localStorage.removeItem("aura_user");
      onAuthChange(null);
      resetFields();
    } catch (err: any) {
      console.error(err);
      setError("Failed to log out correctly.");
    } finally {
      setIsLoading(false);
    }
  };

  // Logged-in profile state representation
  if (user) {
    const isGuest = user.isAnonymous;
    return (
      <div className="bg-[#0F1115] rounded-2xl border border-slate-800 p-4 space-y-3.5" id="auth-logged-in-profile">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
            {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : "G"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {user.displayName || "Aura Candidate"}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {isGuest ? "Temporary Guest Session" : user.email}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <div className="px-2.5 py-1 rounded bg-emerald-500/5 border border-emerald-500/15 text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Database Secured & Active</span>
          </div>
          {isGuest && (
            <p className="text-[10px] text-amber-400/80 leading-normal bg-amber-500/5 p-2 rounded border border-amber-500/10">
              💡 Register with email to store data permanently across multiple devices.
            </p>
          )}
          
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full py-1.5 px-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 text-xs rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-500/15"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Login / Register interactive card
  return (
    <div className="bg-[#0F1115] rounded-2xl border border-slate-800 p-5 space-y-4" id="auth-form-card">
      <div className="space-y-1">
        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> Account Dashboard
        </h3>
        <p className="text-[10px] text-slate-400">
          Sync placement progress and scans with secure cloud database
        </p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        {isSignUp && (
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Candidate Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <UserIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition"
                placeholder="Aditya Verma"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Mail className="w-3.5 h-3.5" />
            </span>
            <input
              type="email"
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition"
              placeholder="candidate@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Lock className="w-3.5 h-3.5" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition font-mono"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] leading-snug">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] leading-snug">
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
            </>
          ) : isSignUp ? (
            "Create Candidate Profile"
          ) : (
            "Sign In to Aura"
          )}
        </button>
      </form>

      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccessMsg(null);
          }}
          className="text-slate-400 hover:text-indigo-400 font-semibold cursor-pointer"
        >
          {isSignUp ? "Already have an account? Sign In" : "New candidate? Sign Up"}
        </button>
      </div>

      <div className="relative flex py-1.5 items-center">
        <div className="flex-grow border-t border-slate-800/60"></div>
        <span className="flex-shrink mx-3 text-slate-500 text-[9px] uppercase font-bold tracking-widest">or</span>
        <div className="flex-grow border-t border-slate-800/60"></div>
      </div>

      <button
        type="button"
        onClick={handleAnonymousSignIn}
        disabled={isLoading}
        className="w-full py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs rounded-xl font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Globe className="w-3.5 h-3.5 text-slate-400" /> Sign In as Guest (Anonymous)
          </>
        )}
      </button>
    </div>
  );
}
