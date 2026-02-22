import { Target } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const AthleteID = () => (
  <ModulePage
    icon={Target}
    title="AthleteID"
    subtitle="Brand avatar system"
    description="Create pixel-perfect brand avatars from reference photos or specifications. AI ensures consistency across all generations with body measurement precision and A/B testing."
    promptPlaceholder="Describe your ideal brand avatar... e.g. 'Female athlete, mid-20s, lean muscular build, warm skin tone, confident expression, suitable for yoga and HIIT content'"
    features={["Consistency AI", "Version Control", "A/B Testing"]}
  />
);
export default AthleteID;
