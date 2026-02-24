import { Layers } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const CollectionForge = () => (
  <ModulePage
    icon={Layers}
    title="CollectionForge"
    subtitle="Batch lookbooks with motion physics for entire drops"
    description="Upload a ZIP or CSV of your entire collection → apply the same motion, physics, and branding to all pieces. Generate lookbooks with tech specs, performance overlays, eco-badges, and size charts. Priority queue for large batches. Tag and organize with smart collections."
    promptPlaceholder="e.g. 'Summer 2026 running collection, 12 pieces — apply sprint + squat motion, compression overlays, eco-performance badges, generate PDF tech pack with specs'"
    features={["Batch ZIP/CSV", "Priority Queue", "Tech Specs", "Eco Badges", "PDF Export"]}
    showGarmentUpload
  />
);
export default CollectionForge;
