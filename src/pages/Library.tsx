import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Image, Search, Download, Plus, Calendar, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

interface AssetRow {
  id: string;
  name: string;
  status: string;
  thumbnail_url: string | null;
  created_at: string;
  metadata: Json;
  physics_settings: Json;
  motion_settings: Json;
}

const Library = () => {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetRow | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (!session) return;
    const fetchAssets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, status, thumbnail_url, created_at, metadata, physics_settings, motion_settings")
        .order("created_at", { ascending: false });

      if (!error && data) setAssets(data);
      setLoading(false);
    };
    fetchAssets();
  }, [session]);

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const getImages = (asset: AssetRow): Record<string, string> => {
    const meta = asset.metadata as Record<string, unknown> | null;
    return (meta?.images as Record<string, string>) || {};
  };

  const getPhysics = (asset: AssetRow) => {
    return asset.physics_settings as Record<string, unknown> | null;
  };

  const getAthlete = (asset: AssetRow) => {
    const meta = asset.metadata as Record<string, unknown> | null;
    return meta?.athlete as Record<string, string> | null;
  };

  const getMotion = (asset: AssetRow) => {
    return asset.motion_settings as Record<string, unknown> | null;
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {assets.length > 0 ? `${assets.length} generated asset${assets.length !== 1 ? "s" : ""}` : "All your generated assets in one place."}
          </p>
        </div>
        <Link to="/dashboard/create">
          <Button className="gap-2 rounded-xl font-bold">
            <Plus className="w-4 h-4" /> New Generation
          </Button>
        </Link>
      </motion.div>

      {assets.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 premium-input" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Image className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground">
            {search ? "No assets match your search." : "No generated assets yet. Create your first simulation!"}
          </p>
          {!search && (
            <Link to="/dashboard/create">
              <Button variant="outline" size="sm" className="rounded-xl mt-2 gap-2">
                <Zap className="w-4 h-4" /> Start Creating
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Asset grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((asset, i) => {
              const images = getImages(asset);
              const motion_s = getMotion(asset);
              const firstImg = Object.values(images)[0];
              
              return (
                <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.4 }}
                  onClick={() => setSelectedAsset(selectedAsset?.id === asset.id ? null : asset)}
                  className={`glass-card-hover rounded-2xl overflow-hidden cursor-pointer ${
                    selectedAsset?.id === asset.id ? "border-primary/30 glow-border" : ""
                  }`}>
                  
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center relative">
                    {firstImg ? (
                      <img src={firstImg} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-10 h-10 text-muted-foreground/15" />
                    )}
                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      asset.status === "completed" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {asset.status}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-semibold truncate">{asset.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {motion_s && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {String(motion_s.movement || "")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(asset.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selectedAsset && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">{selectedAsset.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAsset(null)}
                  className="text-muted-foreground">✕</Button>
              </div>

              {/* Multi-angle images */}
              {Object.keys(getImages(selectedAsset)).length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Generated Views</p>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(getImages(selectedAsset)).map(([angle, url]) => (
                      <div key={angle} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted/20">
                        <img src={url} alt={angle} className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-foreground/70 uppercase bg-background/60 px-1.5 py-0.5 rounded">
                          {angle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physics */}
              {getPhysics(selectedAsset) && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Performance Physics</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Stretch", key: "stretch_factor" },
                      { label: "Compression", key: "compression_percentage", suffix: "%" },
                      { label: "Sweat", key: "sweat_absorption", suffix: "%" },
                      { label: "Breathability", key: "breathability_score", suffix: "%" },
                    ].map(m => {
                      const val = (getPhysics(selectedAsset) as Record<string, unknown>)?.[m.key];
                      return (
                        <div key={m.key} className="glass-surface p-3 text-center">
                          <p className="text-[10px] text-muted-foreground mb-1">{m.label}</p>
                          <p className="font-display text-sm font-bold glow-text">{String(val || "—")}{m.suffix && val ? m.suffix : ""}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Athlete info */}
              {getAthlete(selectedAsset) && (
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Athlete: {getAthlete(selectedAsset)?.gender}, {getAthlete(selectedAsset)?.size}, {getAthlete(selectedAsset)?.bodyType}</span>
                </div>
              )}

              {/* Download */}
              <div className="flex gap-3">
                {Object.entries(getImages(selectedAsset)).map(([angle, url]) => (
                  <a key={angle} href={url} target="_blank" rel="noopener noreferrer" download>
                    <Button variant="outline" size="sm" className="rounded-xl border-border gap-2">
                      <Download className="w-3 h-3" /> {angle}
                    </Button>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Library;
