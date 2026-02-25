import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden border-r border-white/[0.04]">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/[0.03] rounded-full blur-[150px]" />
        <div className="relative z-10 text-center px-12">
          <Link to="/" className="font-display text-3xl font-black tracking-tight flex items-center gap-3 justify-center mb-8">
            <Activity className="w-8 h-8 text-primary" />
            Active<span className="text-primary">Forge</span>
          </Link>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            AI motion testing for leading training brands. Simulate performance, reduce returns, cut costs.
          </p>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-display text-xl font-black tracking-tight">Active<span className="text-primary">Forge</span></span>
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@brand.com" className="premium-input" required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary/70 hover:text-primary transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="premium-input pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl font-bold gap-2">
              {loading ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-semibold">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
