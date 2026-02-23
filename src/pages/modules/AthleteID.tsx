import { Target } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const AthleteID = () => (
  <ModulePage
    icon={Target}
    title="AthleteID"
    subtitle="Brand avatar system — all body types"
    description="Create pixel-perfect brand avatars from reference photos or specifications. XS–XXL, any gender, body type (athletic, muscular, curvy, plus-size). AI ensures consistency across all generations with sport-specific poses."
    promptPlaceholder="Describe your ideal brand athlete... e.g. 'Female, mid-20s, athletic build, warm skin tone, suitable for running and HIIT content, size M'"
    features={["XS–XXL Range", "Consistency AI", "A/B Testing"]}
  />
);
export default AthleteID;
