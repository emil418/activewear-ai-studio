import { Camera } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const MotionAlive = () => (
  <ModulePage
    icon={Camera}
    title="MotionAlive"
    subtitle="Text-to-visual generation with motion physics & multi-angle output"
    description="Turn text, voice notes, or sketches into hyper-realistic activewear stills and 15–60s videos. Full fabric stretch, sweat simulation, wind effects, and 500+ sport movements. Enable Physics Mode for color-coded stress maps, compression overlays and breathability highlights. Toggle Multi-View for 4–8 angle output or interactive 360° spin."
    promptPlaceholder="Describe your sport visual... e.g. 'Male athlete doing push-ups in black compression shirt, close-up showing fabric stretch across chest and shoulders, sweat detail, gym floor setting — physics overlay with stretch zones'"
    features={["Fabric Physics", "360° Spin", "Multi-Angle", "Sweat Sim", "500+ Movements"]}
    showGarmentUpload
  />
);
export default MotionAlive;
