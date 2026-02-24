import { Shirt } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const DynamicVTO = () => (
  <ModulePage
    icon={Shirt}
    title="DynamicVTO"
    subtitle="Virtual try-on with physics simulation & 360° visualization"
    description="Upload any garment and instantly try it on AI athletes in motion. Realistic compression physics, seam stretch simulation, moisture wicking heatmaps. Select body type XS–XXL and sport movement to see true fit under load. Enable Multi-View for split-screen angles or export interactive 360° previews."
    promptPlaceholder="Describe your garment for try-on... e.g. 'High-waist running shorts, electric blue, mesh panels on sides — show on female athlete doing sprint start with compression heatmap overlay, multi-angle view'"
    features={["Compression Physics", "Heatmap", "360° Export", "Multi-View", "Motion Fit"]}
    showGarmentUpload
  />
);
export default DynamicVTO;
