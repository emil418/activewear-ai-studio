import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Activity, AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw, Clock, Cpu, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

interface JobRow {
  id: string;
  status: string;
  batch_type: string;
  request_payload: Json;
  requested_angles: Json;
  restart_count: number;
  max_restarts: number;
  created_at: string;
  completed_at: string | null;
  last_error: string | null;
  master_scene: Json;
}

const AdminPanel = () => {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "failed" | "processing">("all");
  const { user, authReady } = useAuth();

  const fetchJobs = async () => {
    if (!authReady || !user) { setLoading(false); return; }
    setLoading(true);
    let q = supabase.from("generation_jobs").select("*").order("created_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setJobs((data as JobRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { void fetchJobs(); }, [authReady, user, filter]);

  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === "completed").length,
    failed: jobs.filter(j => j.status === "failed").length,
    processing: jobs.filter(j => j.status === "processing").length,
    withRestarts: jobs.filter(j => j.restart_count > 0).length,
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "failed", label: "Failed" },
    { key: "processing", label: "Processing" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor generation jobs, quality, and system health.</p>
        </div>
        <Button variant="outline" onClick={fetchJobs} className="rounded-xl gap-2 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Jobs", value: stats.total, icon: Activity, color: "text-foreground" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-primary" },
          { label: "Failed", value: stats.failed, icon: XCircle, color: "text-destructive" },
          { label: "Processing", value: stats.processing, icon: Loader2, color: "text-primary/60" },
          { label: "With Restarts", value: stats.withRestarts, icon: AlertTriangle, color: "text-orange-400" },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display text-2xl font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
              filter === f.key ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground border border-border hover:border-primary/20"
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Jobs table */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No jobs found for this filter.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-widest">
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Job ID</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Angles</th>
                  <th className="text-left p-4">Restarts</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-left p-4">Error</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => {
                  const angles = (job.requested_angles as string[]) || [];
                  return (
                    <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          job.status === "completed" ? "bg-primary/10 text-primary" :
                          job.status === "failed" ? "bg-destructive/10 text-destructive" :
                          job.status === "processing" ? "bg-primary/5 text-primary/60" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {job.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                          {job.status === "failed" && <XCircle className="w-3 h-3" />}
                          {job.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                          {job.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-muted-foreground">{job.id.slice(0, 8)}…</td>
                      <td className="p-4 text-xs">{job.batch_type}</td>
                      <td className="p-4 text-xs">{angles.length}</td>
                      <td className="p-4">
                        {job.restart_count > 0 ? (
                          <span className="text-xs text-orange-400 font-bold">{job.restart_count}/{job.max_restarts}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(job.created_at).toLocaleString()}</td>
                      <td className="p-4 text-xs text-destructive/70 max-w-[200px] truncate">{job.last_error || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
