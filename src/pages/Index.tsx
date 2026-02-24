import { motion } from "framer-motion";
import { ArrowRight, Upload, Sparkles, Check, ChevronRight, Shirt, Camera, Target, TrendingUp, Layers, Video, Play, Activity, RotateCcw, Zap, BarChart3, Leaf, GitCompare, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: "easeOut" as const }
  })
};

const Navbar = () =>
<nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-background/80 backdrop-blur-2xl">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Active<span className="text-primary">Forge</span>
      </Link>
      <div className="hidden md:flex items-center gap-10">
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#modules" className="nav-link">Modules</a>
        <a href="#features" className="nav-link">Features</a>
        <a href="#pricing" className="nav-link">Pricing</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Log in</Button>
        </Link>
        <Link to="/dashboard">
          <Button size="sm" className="gap-1.5 rounded-xl px-5 font-bold">
            Request Demo <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  </nav>;


const Hero = () =>
<section className="relative min-h-screen flex items-center justify-center section-padding pt-32 overflow-hidden">
    <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] bg-primary/[0.03] rounded-full blur-[250px]" />
    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/[0.03] rounded-full blur-[200px]" />
    <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-destructive/[0.02] rounded-full blur-[150px]" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

    <div className="relative z-10 max-w-5xl mx-auto text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-primary/[0.04] mb-10">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-energy-pulse" />
        <span className="text-xs text-primary/90 font-bold tracking-widest uppercase">AI Motion Testing for Training Brands</span>
      </motion.div>

      <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
    className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.02] mb-7 tracking-tight uppercase">
        AI motion testing for{" "}
        <span className="gradient-text">leading training</span>{" "}
        brands
      </motion.h1>

      <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
    className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
        Upload gear → Select athlete & motion → Simulate performance with physics overlays. Test fit, compression, and fabric behavior in real training movements — no samples, no shoots.
      </motion.p>

      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/dashboard">
          <Button size="lg" className="text-sm px-8 py-6 font-bold gap-2 rounded-xl glow-border uppercase tracking-wide">
            Request Brand Demo <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="outline" size="lg" className="text-sm px-8 py-6 font-bold border-white/[0.08] rounded-xl hover:bg-white/[0.03] gap-2">
          <Play className="w-4 h-4" /> Watch Performance Test
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="mt-20 flex items-center justify-center gap-10 text-muted-foreground text-sm flex-wrap">
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> 5 free generations</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> Integrates with your ERP</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> Built for training brands</span>
      </motion.div>
    </div>
  </section>;


const ValueBar = () =>
<section className="border-y border-white/[0.04] bg-white/[0.01]">
    <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
      {[
    { value: "10×", label: "Faster prototype testing" },
    { value: "85%", label: "Content cost reduction" },
    { value: "30-40%", label: "Lower return rates" },
    { value: "500+", label: "Training movements" }].
    map((s, i) =>
    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
          <p className="font-display text-4xl md:text-5xl font-black glow-text mb-2">{s.value}</p>
          <p className="text-sm text-muted-foreground">{s.label}</p>
        </motion.div>
    )}
    </div>
  </section>;


const steps = [
{ icon: Upload, title: "Upload Gear", desc: "Drop your product photo, tech flat, or sketch. AI detects seams, fabrics, and logos. Batch upload via ZIP/CSV for full collections." },
{ icon: Target, title: "Select Athlete & Motion", desc: "Build your athlete (XS–XXL, elite runner, bodybuilder, yogi). Pick from 500+ training movements with intensity sliders." },
{ icon: Sparkles, title: "Simulate Performance", desc: "Get physics-accurate videos with compression maps, sweat sim, stretch overlays. Export to Shopify, Strava, AR/VR." }];


const HowItWorks = () =>
<section id="how-it-works" className="section-padding">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">How It Works</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Upload gear → Select motion → <span className="gradient-text">simulate</span>
        </h2>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">From garment upload to performance simulation in minutes.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) =>
      <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.6 }}
      className="glass-card-hover p-8 text-center group relative">
            <div className="absolute top-5 left-5 font-display text-[80px] font-black text-white/[0.02] leading-none select-none">{i + 1}</div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-all duration-500">
                <s.icon className="w-6 h-6 text-primary/80" />
              </div>
              <h3 className="font-display text-lg font-bold mb-3 tracking-tight">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
      )}
      </div>
    </div>
  </section>;


const modules = [
{ icon: Camera, name: "MotionAlive", desc: "Physics-accurate motion videos with stretch maps, sweat sim, multi-angle output and 360° spin." },
{ icon: Target, name: "Athlete Builder", desc: "Sport presets (runner, bodybuilder, yogi) with fitness metrics, inclusive options, XS–XXL consistency." },
{ icon: Shirt, name: "DynamicVTO", desc: "Virtual try-on with compression heatmaps, performance overlays and interactive 360° preview." },
{ icon: TrendingUp, name: "FitEvolve", desc: "Training transformation — show garment fit at 4/8/12 weeks with muscle development changes." },
{ icon: Layers, name: "CollectionForge", desc: "Batch lookbooks with tech specs. Upload ZIP/CSV → apply motion/physics to entire drop." },
{ icon: Video, name: "CampaignFlow", desc: "Still-to-video for Reels/TikTok with training sequences, voiceover, and shoppable cards." }];


const Modules = () =>
<section id="modules" className="section-padding bg-white/[0.01]">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">Modules</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Built for <span className="gradient-text">training wear</span>
        </h2>
        <p className="text-muted-foreground text-base">Six sport-focused modules. One platform. Zero compromises.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, i) =>
      <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.6 }}
      className="glass-card-hover p-7 group cursor-pointer">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/[0.06] flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500">
                <m.icon className="w-5 h-5 text-primary/80" />
              </div>
              <h3 className="font-display text-lg font-bold tracking-tight">{m.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            <div className="mt-5 flex items-center gap-1 text-primary/70 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-500 tracking-widest uppercase">
              Explore <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
      )}
      </div>
    </div>
  </section>;


const advancedFeatures = [
  { icon: BarChart3, title: "Performance Metrics Overlays", desc: "Data overlays on videos: compression level, sweat absorption %, stretch factor, breathability score. Based on user specs or AI inference." },
  { icon: RotateCcw, title: "AR/VR Export", desc: "Generate GLB/OBJ files for AR try-on in training apps like Nike Training Club, Strava, or custom brand apps." },
  { icon: Leaf, title: "Eco Simulator", desc: "Simulate sustainable materials (recycled polyester, organic cotton) with eco-performance ratings and durability badges." },
  { icon: Zap, title: "AI Optimization", desc: "Post-generation AI suggestions: 'Increase thigh compression for better squat performance' or 'Add sweat effect for authentic HIIT visuals'." },
  { icon: GitCompare, title: "A/B Testing Tool", desc: "Generate 2–3 variants (logo placements, colorways in motion) with predicted return risk based on AI analysis." },
  { icon: Flame, title: "Batch Processing", desc: "Upload ZIP/CSV for an entire drop → apply same motion, physics, and branding to all pieces with priority queue." },
];

const FeaturesSection = () =>
<section id="features" className="section-padding">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <p className="text-xs text-secondary font-bold tracking-widest uppercase mb-4">Advanced Capabilities</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Physics, overlays &{" "}<span className="gradient-text">smart testing</span>
        </h2>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto">Everything training brands need to prototype, test, and launch — without physical samples.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advancedFeatures.map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="glass-card-hover p-7 group">
            <div className="w-11 h-11 rounded-2xl bg-secondary/[0.06] flex items-center justify-center mb-5 group-hover:bg-secondary/10 transition-all duration-500">
              <item.icon className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-display text-base font-bold mb-2 tracking-tight">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>;


const B2BSection = () =>
<section className="section-padding bg-white/[0.01] border-y border-white/[0.04]">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">Enterprise Ready</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Built for <span className="gradient-text">brand teams</span>
        </h2>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: "Team Workspace", desc: "Roles, shared projects, version history. Your entire product team on one platform." },
          { title: "ERP & Shopify Integration", desc: "Seamless drops — export directly to Shopify, connect to your ERP for inventory sync." },
          { title: "Sustainability Check", desc: "AI rates visuals on eco-friendliness and suggests greener material alternatives with performance data." },
        ].map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="glass-card p-7 text-center">
            <h3 className="font-display text-lg font-bold mb-3 tracking-tight">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>;


const tiers = [
{ name: "Starter", price: "€0", features: ["5 generations/month", "1 athlete avatar", "Watermarked exports", "Community support"], cta: "Get Started" },
{ name: "Pro", price: "€99", popular: true, features: ["500 generations/month", "15 avatars", "HD, no watermark", "Physics overlays", "Batch processing", "Priority support"], cta: "Start Pro Trial" },
{ name: "Business", price: "€349", features: ["Unlimited generations", "Team of 25", "Custom branding & ERP", "API & AR/VR export", "A/B testing tool", "Dedicated manager"], cta: "Contact Sales" }];


const Pricing = () =>
<section id="pricing" className="section-padding">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">Pricing</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Scale with your <span className="gradient-text">brand</span>
        </h2>
        <p className="text-muted-foreground text-base">Start with 5 free generations. Upgrade when you're ready to go all-in.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t, i) =>
      <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: i * 0.08 }}
      className={`glass-card p-8 relative ${t.popular ? "border-primary/25 glow-border" : ""}`}>
            {t.popular &&
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full tracking-widest uppercase">
                Most Popular
              </div>
        }
            <h3 className="font-display text-xl font-bold mb-1 tracking-tight">{t.name}</h3>
            <div className="mb-8">
              <span className="font-display text-4xl font-black">{t.price}</span>
              {t.price !== "€0" && <span className="text-muted-foreground text-sm">/mo</span>}
            </div>
            <ul className="space-y-3.5 mb-8">
              {t.features.map((f) =>
          <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary/60 flex-shrink-0" /> {f}
                </li>
          )}
            </ul>
            <Button className={`w-full rounded-xl font-bold ${t.popular ? "" : "bg-white/[0.04] text-foreground hover:bg-white/[0.08] border border-white/[0.06]"}`}>
              {t.cta}
            </Button>
          </motion.div>
      )}
      </div>
    </div>
  </section>;


const Footer = () =>
<footer className="border-t border-white/[0.04] section-padding py-14">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="font-display text-lg font-bold tracking-tight flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        Active<span className="text-primary">Forge</span>
      </div>
      <div className="flex gap-8 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <a href="#" className="hover:text-foreground transition-colors">Contact</a>
      </div>
      <p className="text-xs text-muted-foreground/60">© 2026 ActiveForge. All rights reserved.</p>
    </div>
  </footer>;


const Index = () =>
<div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <ValueBar />
    <HowItWorks />
    <Modules />
    <FeaturesSection />
    <B2BSection />
    <Pricing />
    <Footer />
  </div>;


export default Index;
