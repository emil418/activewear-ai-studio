import { Video } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const CampaignFlow = () => (
  <ModulePage
    icon={Video}
    title="CampaignFlow"
    subtitle="Still-to-video animation"
    description="Transform still images into dynamic campaign videos with movement sequences, AI voiceover in 10 languages, text animations, and shoppable end cards."
    promptPlaceholder="Describe your campaign video... e.g. 'Dynamic 15-second reel showing athlete transitioning between 3 yoga poses, wearing teal sports bra and leggings set, ambient studio lighting'"
    features={["AI Voiceover", "Shoppable Cards", "Auto-Resize"]}
  />
);
export default CampaignFlow;
