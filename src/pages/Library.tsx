import { motion } from "framer-motion";
import { Image, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Library = () => (
  <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="font-display text-2xl font-bold mb-1">Asset Library</h1>
      <p className="text-sm text-muted-foreground">All your generated assets in one place.</p>
    </motion.div>

    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search assets..." className="pl-9 bg-muted/50" />
      </div>
      <Button variant="outline" size="sm" className="gap-2"><Filter className="w-4 h-4" /> Filters</Button>
      <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card-hover aspect-square rounded-xl flex items-center justify-center cursor-pointer group">
          <Image className="w-8 h-8 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
        </motion.div>
      ))}
    </div>
  </div>
);
export default Library;
