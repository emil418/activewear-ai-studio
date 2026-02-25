import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-8">
            We sent a verification link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account.
          </p>
          <Link to="/login">
            <Button variant="outline" className="rounded-xl">Back to Login</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden border-r border-white/[0.04]">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-secondary/[0.03] rounded-full blur-[150px]" />
        <div className="relative z-10 text-center px-12">
          <Link to="/" className="font-display text-3xl font-black tracking-tight flex items-center gap-3 justify-center mb-8">
            <Activity className="w-8 h-8 text-primary" />
            Active<span className="text-primary">Forge</span>
          </Link>
          <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
            Join 200+ training brands using AI to visualize garment performance before production.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-display text-xl font-black tracking-tight">Active<span className="text-primary">Forge</span></span>
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start with 5 free generations</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Your name" className="premium-input" required />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Work Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@brand.com" className="premium-input" required />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Password</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters" className="premium-input pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl font-bold gap-2">
              {loading ? "Creating account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
