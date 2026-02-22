import { Layers } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const CollectionForge = () => (
  <ModulePage
    icon={Layers}
    title="CollectionForge"
    subtitle="Lookbook & catalog generator"
    description="One-click professional lookbooks and catalogs. Generate branded PDFs or interactive web versions with tech specs, size charts, styling tips, and sustainability badges."
    promptPlaceholder="Describe your collection... e.g. 'Summer 2026 women's running collection, 8 pieces, earth tone palette, featuring recycled polyester, minimalist design language'"
    features={["Auto Layout", "Tech Specs", "Sustainability"]}
  />
);
export default CollectionForge;
