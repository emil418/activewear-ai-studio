import { Sparkles } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const LogoPlacement = () => (
  <ModulePage
    icon={Sparkles}
    title="LogoPlacement"
    subtitle="Advanced logo integration"
    description="Upload logos and place them on garments with AI-suggested optimal positioning. Preview embroidery, screen print, heat transfer, reflective, and glow-in-dark rendering styles."
    promptPlaceholder="Describe your logo placement... e.g. 'Place main logo centered on chest of black hoodie, monochrome version on left sleeve, embroidery style rendering'"
    features={["AI Placement", "Render Styles", "Bulk Apply"]}
  />
);
export default LogoPlacement;
