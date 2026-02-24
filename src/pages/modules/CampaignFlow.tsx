import { Video } from "lucide-react";
import ModulePage from "@/components/ModulePage";

const CampaignFlow = () => (
  <ModulePage
    icon={Video}
    title="CampaignFlow"
    subtitle="Training content for Reels, TikTok & training apps"
    description="Transform stills into ready-to-post training videos with sport movement sequences, royalty-free music, AI voiceover in 10 languages, performance data overlays, and shoppable end cards. Export directly to Shopify, social, or training apps like Strava as AR filters."
    promptPlaceholder="e.g. '15-second reel — athlete transitions between 3 HIIT movements in neon running set, high-energy music, bold text overlay with compression stats, shoppable card'"
    features={["Training App Export", "Shoppable Cards", "AR Filters", "Auto-Resize"]}
  />
);
export default CampaignFlow;
