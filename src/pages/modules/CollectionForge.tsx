import { Layers } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const CollectionForge = () => (
  <ModulePage
    icon={Layers}
    title="CollectionForge"
    subtitle="Lookbook & catalog generator"
    description="One-click professional lookbooks and catalogs with motion GIFs. Generate branded PDFs or interactive web versions with tech specs, size charts, performance data, and sustainability badges."
    promptPlaceholder="Describe your collection... e.g. 'Summer 2026 men's running collection, 8 pieces, bold black/neon palette, featuring recycled polyester, include tech spec overlays'"
    features={["Motion GIFs", "Tech Specs", "PDF Export"]}
  />
);
export default CollectionForge;
