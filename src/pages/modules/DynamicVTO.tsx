import { Shirt } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const DynamicVTO = () => (
  <ModulePage
    icon={Shirt}
    title="DynamicVTO"
    subtitle="Virtual try-on with motion physics"
    description="Upload any garment and instantly try it on AI athletes in motion. Realistic compression physics, seam stretch simulation, moisture wicking heatmaps. Select body type XS–XXL and sport movement to see true fit under load."
    promptPlaceholder="Describe your garment for try-on... e.g. 'High-waist running shorts, electric blue, mesh panels on sides, reflective logo — show on female athlete doing sprint start'"
    features={["Compression Physics", "Heatmap", "Colorways", "Motion Fit"]}
    showGarmentUpload
  />
);
export default DynamicVTO;
