import { Camera } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const MotionAlive = () => (
  <ModulePage
    icon={Camera}
    title="MotionAlive"
    subtitle="Text-to-visual generation with motion physics"
    description="Turn text, voice notes, or sketches into hyper-realistic activewear stills and 15–60s videos. Full fabric stretch, sweat simulation, wind effects, and 500+ sport movements including squats, sprints, push-ups, yoga flows, and HIIT combos."
    promptPlaceholder="Describe your sport visual... e.g. 'Male athlete doing push-ups in black compression shirt, close-up showing fabric stretch across chest and shoulders, sweat detail, gym floor setting'"
    features={["Fabric Physics", "Sweat Sim", "500+ Movements", "Batch Mode"]}
    showGarmentUpload
  />
);
export default MotionAlive;
