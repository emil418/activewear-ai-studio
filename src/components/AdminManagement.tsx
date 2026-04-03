import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, Trash2, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

interface AdminEntry {
  id: string;
  email: string;
  created_at: string;
}

const AdminManagement = () => {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_allowlist")
      .select("*")
      .order("created_at", { ascending: true });
    setAdmins((data as unknown as AdminEntry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAdmins();
    else setLoading(false);
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("admin_allowlist").insert({ email });
    if (error) {
      toast({ title: "Could not add admin", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Admin added", description: email });
      setNewEmail("");
      fetchAdmins();
    }
    setAdding(false);
  };

  const handleRemove = async (id: string, email: string) => {
    if (admins.length <= 1) {
      toast({ title: "Cannot remove last admin", variant: "destructive" });
      return;
    }
    await supabase.from("admin_allowlist").delete().eq("id", id);
    toast({ title: "Admin removed", description: email });
    fetchAdmins();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="glass-card p-7 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-bold">Admin Access Control</p>
          <p className="text-xs text-muted-foreground">Manage who can access the Admin Panel.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{a.email}</span>
                </div>
                <button onClick={() => handleRemove(a.id, a.email)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="admin@example.com" className="premium-input flex-1"
              onKeyDown={e => e.key === "Enter" && handleAdd()} />
            <Button onClick={handleAdd} disabled={adding} size="sm" className="rounded-xl gap-1.5">
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AdminManagement;
