import { motion } from "framer-motion";
import { ArrowRight, Zap, Camera, Shirt, TrendingUp, Layers, Video, Target, ChevronRight, Star, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const }
  })
};

const Hero = () => (
  <section className="relative min-h-screen flex items-center section-padding overflow-hidden">
    {/* Gradient orbs */}
    <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[128px]" />
    <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-secondary/10 rounded-full blur-[128px]" />
    
    <div className="relative z-10 max-w-5xl mx-auto text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm text-primary font-medium">AI-Powered Activewear Content Studio</span>
      </motion.div>

      <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
        From design sketch to{" "}
        <span className="gradient-text">campaign-ready</span>{" "}
        activewear visuals in seconds
      </motion.h1>

      <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
        No studio. No models. No returns. Cut content costs by 80% and reduce return rates by 40% with photorealistic AI visuals built for performance clothing.
      </motion.p>

      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/dashboard">
          <Button size="lg" className="text-base px-8 py-6 font-semibold gap-2 glow-border">
            Start Creating Free <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <Button variant="outline" size="lg" className="text-base px-8 py-6 font-semibold border-border">
          Watch Demo
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="mt-16 flex items-center justify-center gap-8 text-muted-foreground text-sm">
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> 15 free generations</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> No credit card</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Enterprise ready</span>
      </motion.div>
    </div>
  </section>
);

const steps = [
  { icon: Camera, title: "Upload brand assets", desc: "Logo, colors, fabric photos – we learn your brand DNA." },
  { icon: Shirt, title: "Describe your vision", desc: "Text, sketch, or voice – our AI understands activewear." },
  { icon: Layers, title: "Generate & refine", desc: "Photorealistic visuals with fabric physics in seconds." },
  { icon: TrendingUp, title: "Launch everywhere", desc: "Export campaign-ready assets for any platform." },
];

const HowItWorks = () => (
  <section className="section-padding">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Four steps to <span className="gradient-text">stunning content</span></h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">From upload to campaign launch in minutes, not months.</p>
      </motion.div>
      <div className="grid md:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.15 }}
            className="glass-card-hover p-6 text-center group">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <s.icon className="w-7 h-7 text-primary" />
            </div>
            <div className="text-xs text-primary font-semibold mb-2">Step {i + 1}</div>
            <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const modules = [
  { icon: Camera, name: "MotionAlive", desc: "Text-to-visual generation with fabric physics, sweat simulation, and dynamic movement." },
  { icon: Target, name: "AthleteID", desc: "Consistent brand avatars with body measurement precision and A/B testing." },
  { icon: Shirt, name: "DynamicVTO", desc: "Virtual try-on with compression physics, seam stretch, and heatmap overlays." },
  { icon: TrendingUp, name: "FitEvolve", desc: "Body transformation timeline with week-by-week visual progression." },
  { icon: Layers, name: "CollectionForge", desc: "One-click lookbooks with tech specs, size charts, and sustainability badges." },
  { icon: Video, name: "CampaignFlow", desc: "Still-to-video with AI voiceover, shoppable end cards, and auto-resizing." },
];

const Features = () => (
  <section className="section-padding bg-muted/30">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Built exclusively for <span className="gradient-text">activewear</span></h2>
        <p className="text-muted-foreground text-lg">Six powerful modules. One platform. Zero compromises.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, i) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="glass-card-hover p-6 group cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">{m.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            <div className="mt-4 flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Explore <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const tiers = [
  { name: "Free", price: "€0", features: ["15 generations/month", "2 avatars", "Watermarked exports", "Community support"], cta: "Get Started" },
  { name: "Pro", price: "€49", popular: true, features: ["300 generations/month", "10 avatars", "HD, no watermark", "Basic analytics", "Priority support"], cta: "Start Pro Trial" },
  { name: "Business", price: "€249", features: ["Unlimited generations", "Team of 10", "Custom branding", "API access", "Dedicated support"], cta: "Contact Sales" },
];

const Pricing = () => (
  <section className="section-padding">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Simple, transparent <span className="gradient-text">pricing</span></h2>
        <p className="text-muted-foreground text-lg">Start free. Scale when you're ready.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`glass-card p-8 relative ${t.popular ? "border-primary/40 glow-border" : ""}`}>
            {t.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                Most Popular
              </div>
            )}
            <h3 className="font-display text-xl font-bold mb-1">{t.name}</h3>
            <div className="mb-6">
              <span className="font-display text-4xl font-bold">{t.price}</span>
              {t.price !== "€0" && <span className="text-muted-foreground text-sm">/mo</span>}
            </div>
            <ul className="space-y-3 mb-8">
              {t.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button className={`w-full ${t.popular ? "" : "bg-muted text-foreground hover:bg-muted/80"}`}>
              {t.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="font-display text-xl font-bold">
        Fit<span className="text-primary">Lumoo</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="nav-link">Features</a>
        <a href="#pricing" className="nav-link">Pricing</a>
        <a href="#" className="nav-link">Docs</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">Log in</Button>
        </Link>
        <Link to="/dashboard">
          <Button size="sm" className="gap-1">Get Started <ArrowRight className="w-4 h-4" /></Button>
        </Link>
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="border-t border-border section-padding py-12">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="font-display text-lg font-bold">Fit<span className="text-primary">Lumoo</span></div>
      <div className="flex gap-6 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <a href="#" className="hover:text-foreground transition-colors">Contact</a>
      </div>
      <p className="text-xs text-muted-foreground">© 2026 FitLumoo. All rights reserved.</p>
    </div>
  </footer>
);

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <HowItWorks />
    <div id="features"><Features /></div>
    <div id="pricing"><Pricing /></div>
    <Footer />
  </div>
);

export default Index;
