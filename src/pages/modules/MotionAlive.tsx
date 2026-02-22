import { Camera } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const MotionAlive = () => (
  <ModulePage
    icon={Camera}
    title="MotionAlive"
    subtitle="Text-to-visual generation"
    description="Turn text, voice notes, or sketches into hyper-realistic activewear product stills and videos. Support for fabric stretch, sweat simulation, hair movement, and dynamic poses."
    promptPlaceholder="Describe your activewear visual... e.g. 'Athletic woman in black compression leggings, mid-squat position, gym setting, dramatic lighting, sweat detail on fabric'"
    features={["Fabric Physics", "Sweat Simulation", "Batch Mode"]}
    showGarmentUpload
  />
);
export default MotionAlive;
