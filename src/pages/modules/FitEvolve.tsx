import { TrendingUp } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const FitEvolve = () => (
  <ModulePage
    icon={TrendingUp}
    title="FitEvolve"
    subtitle="Body transformation simulator"
    description="Generate week-by-week body transformation visuals showing muscle development and garment fit changes. Side-by-side comparisons with data overlays for marketing campaigns."
    promptPlaceholder="Describe the transformation... e.g. '12-week strength training progression, male athlete, showing muscle definition increase while wearing grey tank top'"
    features={["Week-by-Week", "Fit Percentage", "Side-by-Side"]}
  />
);
export default FitEvolve;
