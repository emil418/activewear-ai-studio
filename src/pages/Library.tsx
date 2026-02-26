import { motion } from "framer-motion";
import { Image, Search, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Library = () => (
  <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Library</h1>
        <p className="text-sm text-muted-foreground mt-1">All your generated assets in one place.</p>
      </div>
      <Link to="/dashboard/create">
        <Button className="gap-2 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> New Generation
        </Button>
      </Link>
    </motion.div>

    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search assets..." className="pl-9 premium-input" />
      </div>
      <Button variant="outline" size="sm" className="gap-2 rounded-xl border-white/[0.08] hover:bg-white/[0.03]">
        <Download className="w-4 h-4" /> Export All
      </Button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03, duration: 0.5 }}
          className="glass-card-hover aspect-square rounded-2xl flex items-center justify-center cursor-pointer group">
          <Image className="w-8 h-8 text-muted-foreground/15 group-hover:text-muted-foreground/30 transition-colors duration-500" />
        </motion.div>
      ))}
    </div>

    {/* Empty state hint */}
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground/50">Generated assets will appear here after your first simulation.</p>
    </div>
  </div>
);

export default Library;
