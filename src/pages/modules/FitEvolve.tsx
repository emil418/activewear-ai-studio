import { TrendingUp } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const FitEvolve = () => (
  <ModulePage
    icon={TrendingUp}
    title="FitEvolve"
    subtitle="Training transformation — garment fit over time"
    description="Show how your garment fits after 4/8/12 weeks of training. Generate week-by-week body transformation visuals with muscle development, compression changes, and garment fit adaptation. Perfect for marketing campaigns showing real training progression."
    promptPlaceholder="e.g. '12-week strength program, male athlete, grey tank top — show muscle development and compression fit change, side-by-side comparison at week 0/4/8/12'"
    features={["4/8/12 Weeks", "Fit % Change", "Side-by-Side", "Training Timeline"]}
  />
);
export default FitEvolve;
