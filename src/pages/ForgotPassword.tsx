import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
        <Link to="/" className="font-display text-xl font-black tracking-tight flex items-center gap-2 justify-center">
          <Activity className="w-5 h-5 text-primary" /> Active<span className="text-primary">Forge</span>
        </Link>

        {sent ? (
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-6">We sent a reset link to {email}</p>
            <Link to="/login"><Button variant="outline" className="rounded-xl gap-2"><ArrowLeft className="w-4 h-4" /> Back to Login</Button></Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Reset password</h1>
              <p className="text-sm text-muted-foreground">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@brand.com" className="premium-input" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-xl font-bold">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-semibold">Back to Login</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
