import { Shirt } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const DynamicVTO = () => (
  <ModulePage
    icon={Shirt}
    title="DynamicVTO"
    subtitle="Virtual try-on engine"
    description="Upload garment sketches or describe your design for instant virtual try-on with realistic compression physics, seam stretch simulation, and moisture wicking heatmaps."
    promptPlaceholder="Describe your garment for try-on... e.g. 'High-waist running shorts, electric blue, mesh panels on sides, reflective logo on left thigh'"
    features={["Compression Physics", "Heatmap Overlay", "Colorways"]}
  />
);
export default DynamicVTO;
