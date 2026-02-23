import { Video } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const CampaignFlow = () => (
  <ModulePage
    icon={Video}
    title="CampaignFlow"
    subtitle="Still-to-video for Reels & TikTok"
    description="Transform stills into ready-to-post Reels/TikTok videos with sport movement sequences, royalty-free music, AI voiceover in 10 languages, text animations, and shoppable end cards. Auto-resize for all platforms."
    promptPlaceholder="Describe your campaign video... e.g. '15-second reel — athlete transitions between 3 HIIT movements wearing neon running set, high-energy music, bold text overlay with product specs'"
    features={["AI Voiceover", "Shoppable Cards", "Auto-Resize"]}
  />
);
export default CampaignFlow;
