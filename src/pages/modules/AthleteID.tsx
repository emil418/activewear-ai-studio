import { Target } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const AthleteID = () => (
  <ModulePage
    icon={Target}
    title="Athlete Builder"
    subtitle="Sport-preset avatars with fitness metrics & inclusive options"
    description="Create consistent brand athletes from reference photos or sport presets (elite runner, bodybuilder, yogi, CrossFit, adaptive). Set fitness metrics: muscle mass, body fat %, age. Inclusive options include adaptive athletes with prostheses and all age ranges. AI ensures pixel-perfect consistency across all generations."
    promptPlaceholder="e.g. 'Female, late 20s, CrossFit build, warm skin tone, prosthetic right leg, suitable for HIIT and strength content, size M — consistent across 10+ generations'"
    features={["Sport Presets", "Fitness Metrics", "Adaptive Athletes", "Consistency AI"]}
  />
);
export default AthleteID;
