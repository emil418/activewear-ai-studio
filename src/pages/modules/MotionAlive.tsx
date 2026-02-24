import { Camera } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const MotionAlive = () => (
  <ModulePage
    icon={Camera}
    title="MotionAlive"
    subtitle="Physics-accurate motion simulation for training wear"
    description="Generate hyper-realistic training wear videos with physics overlays. Fabric stretch under load, compression zones, sweat absorption, wind effects. 500+ training movements with intensity sliders. Export single video, multi-angle grid, 360° spin, or AR/VR files."
    promptPlaceholder="e.g. 'Male athlete doing squats in black compression tights — show stretch map on quads, sweat at 80% intensity, gym setting, multi-angle output'"
    features={["Fabric Physics", "360° Spin", "Performance Overlays", "Batch Mode", "AR/VR Export"]}
    showGarmentUpload
  />
);
export default MotionAlive;
