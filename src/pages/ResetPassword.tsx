import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-8">
        <div className="font-display text-xl font-black tracking-tight flex items-center gap-2 justify-center">
          <Activity className="w-5 h-5 text-primary" /> Active<span className="text-primary">Forge</span>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight mb-1">Set new password</h1>
          <p className="text-sm text-muted-foreground">Choose a strong password for your account</p>
        </div>
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <Label className="text-sm font-semibold mb-2 block">New Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 characters" className="premium-input" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl font-bold">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
