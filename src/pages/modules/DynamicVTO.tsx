import { Shirt } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const DynamicVTO = () => (
  <ModulePage
    icon={Shirt}
    title="DynamicVTO"
    subtitle="Virtual try-on with physics simulation & 360° visualization"
    description="Upload any training garment and try it on AI-built athletes in motion. Compression heatmaps, seam stretch, moisture wicking overlays. Select body type XS–XXL with sport presets and see fit under real training load. Compare sizes side-by-side in motion."
    promptPlaceholder="e.g. 'High-waist running shorts, electric blue, mesh panels — female runner doing sprints, show compression zones, compare M vs L side-by-side'"
    features={["Compression Heatmap", "Size Compare", "360° Export", "Multi-View", "Eco Sim"]}
    showGarmentUpload
  />
);
export default DynamicVTO;
