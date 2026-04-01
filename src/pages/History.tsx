import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Image, CheckCircle2, XCircle, Loader2, RefreshCw, ChevronRight } from "lucide-react";
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
  created_at: string;
  completed_at: string | null;
  last_error: string | null;
}

const statusIcon = (s: string) => {
  if (s === "completed") return <CheckCircle2 className="w-4 h-4 text-primary" />;
  if (s === "failed") return <XCircle className="w-4 h-4 text-destructive" />;
  if (s === "processing") return <Loader2 className="w-4 h-4 animate-spin text-primary/60" />;
  return <Clock className="w-4 h-4 text-muted-foreground" />;
};

const History = () => {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { user, authReady } = useAuth();

  const fetchJobs = async () => {
    if (!authReady || !user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("generation_jobs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setJobs((data as JobRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { void fetchJobs(); }, [authReady, user]);

  const getPayload = (j: JobRow) => j.request_payload as Record<string, any> | null;
  const getAngles = (j: JobRow) => (j.requested_angles as string[]) || [];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" /> Generation History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all past generation jobs.</p>
        </div>
        <Button variant="outline" onClick={fetchJobs} className="rounded-xl gap-2 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : jobs.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center"><Image className="w-7 h-7 text-primary/60" /></div>
          <p className="font-display font-bold text-lg">No generation history</p>
          <p className="text-sm text-muted-foreground">Your generation jobs will appear here after you create your first visualization.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job, i) => {
            const payload = getPayload(job);
            const angles = getAngles(job);
            const isExpanded = expanded === job.id;
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}>
                <button onClick={() => setExpanded(isExpanded ? null : job.id)}
                  className="w-full glass-card-hover p-4 flex items-center gap-4 text-left">
                  {statusIcon(job.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {payload?.movement || payload?.exercise || "Generation"} — {payload?.environment || "Default"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {angles.length} angles · {job.batch_type} · {job.restart_count > 0 ? `${job.restart_count} restarts` : "No restarts"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      job.status === "completed" ? "bg-primary/10 text-primary" :
                      job.status === "failed" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{job.status}</span>
                    <span className="text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString()}</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="glass-card p-4 mt-1 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-muted-foreground">Job ID:</span> <span className="font-mono text-[11px]">{job.id.slice(0, 12)}…</span></div>
                      <div><span className="text-muted-foreground">Created:</span> {new Date(job.created_at).toLocaleString()}</div>
                      {job.completed_at && <div><span className="text-muted-foreground">Completed:</span> {new Date(job.completed_at).toLocaleString()}</div>}
                      <div><span className="text-muted-foreground">Angles:</span> {angles.join(", ")}</div>
                    </div>
                    {job.last_error && (
                      <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-xl text-xs text-destructive">
                        {job.last_error}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
