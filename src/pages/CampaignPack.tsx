import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Download, Image, Video, FileText, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockCampaigns = [
  { id: "1", name: "Summer Drop 2026", movement: "Sprint", athlete: "Marcus", garment: "Compression Shorts", angles: 4, hasVideo: true, date: "2026-03-28" },
  { id: "2", name: "HIIT Launch Pack", movement: "Burpees", athlete: "Zara", garment: "Sports Bra + Leggings", angles: 4, hasVideo: true, date: "2026-03-25" },
];

const CampaignPack = () => {
  const [campaigns] = useState(mockCampaigns);

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Campaign Packs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Package your generated assets into premium, campaign-ready deliverables.</p>
        </div>
        <Link to="/dashboard/create">
          <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> New Campaign</Button>
        </Link>
      </motion.div>

      {/* What's included */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.5 }}
        className="glass-card p-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Each Campaign Pack Includes</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Image, label: "Multi-angle stills", desc: "Front, side, back views" },
            { icon: Video, label: "Motion video", desc: "Cinematic MP4 clip" },
            { icon: FileText, label: "PDF Lookbook", desc: "Branded presentation" },
            { icon: Layers, label: "Social exports", desc: "Ready-to-post formats" },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/[0.06] flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-primary/70" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center">
            <Package className="w-7 h-7 text-primary/60" />
          </div>
          <p className="font-display font-bold text-lg">No campaign packs yet</p>
          <p className="text-sm text-muted-foreground">Generate your first visualization and package it into a campaign.</p>
          <Link to="/dashboard/create">
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Create First Campaign</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="glass-card-hover p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/[0.06] flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary/70" />
                </div>
                <div>
                  <p className="font-display font-bold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.athlete} · {c.garment} · {c.movement} · {c.angles} angles {c.hasVideo && "· Video"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{c.date}</span>
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs">
                  <Download className="w-3 h-3" /> Download ZIP
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignPack;
