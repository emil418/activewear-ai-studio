import { TrendingUp } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const FitEvolve = () => (
  <ModulePage
    icon={TrendingUp}
    title="FitEvolve"
    subtitle="Body transformation simulator"
    description="Show how the same garment fits after 4/8/12 weeks of training. Generate week-by-week body transformation visuals with muscle development and garment fit changes — perfect for marketing campaigns."
    promptPlaceholder="Describe the transformation... e.g. '12-week strength training, male athlete, showing muscle definition increase wearing grey tank top — show compression fit change over time'"
    features={["4/8/12 Weeks", "Fit Percentage", "Side-by-Side"]}
  />
);
export default FitEvolve;
