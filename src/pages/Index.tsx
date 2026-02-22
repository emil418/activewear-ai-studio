import { motion } from "framer-motion";
import { ArrowRight, Upload, Palette, Sparkles, Check, ChevronRight, Shirt, Camera, Target, TrendingUp, Layers, Video, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.8, ease: "easeOut" as const }
  })
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-background/70 backdrop-blur-2xl">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="font-display text-xl font-bold tracking-tight">
        Active<span className="text-primary">Forge</span>
      </Link>
      <div className="hidden md:flex items-center gap-10">
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#modules" className="nav-link">Modules</a>
        <a href="#pricing" className="nav-link">Pricing</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Log in</Button>
        </Link>
        <Link to="/dashboard">
          <Button size="sm" className="gap-1.5 rounded-xl px-5">
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center section-padding pt-32 overflow-hidden">
    {/* Ambient light effects */}
    <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[200px]" />
    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/[0.03] rounded-full blur-[200px]" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

    <div className="relative z-10 max-w-4xl mx-auto text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-primary/[0.04] mb-10">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-xs text-primary/90 font-medium tracking-widest uppercase">AI-Powered Content Studio</span>
      </motion.div>

      <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-7 tracking-tight">
        The AI studio for{" "}
        <span className="gradient-text">premium activewear</span>{" "}
        brands
      </motion.h1>

      <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
        className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
        Create photorealistic product visuals, virtual try-ons and campaigns in seconds — no studio, no models, no returns.
      </motion.p>

      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/dashboard">
          <Button size="lg" className="text-sm px-8 py-6 font-semibold gap-2 rounded-xl glow-border">
            Start Creating Free <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="outline" size="lg" className="text-sm px-8 py-6 font-semibold border-white/[0.08] rounded-xl hover:bg-white/[0.03]">
          Watch Demo
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="mt-20 flex items-center justify-center gap-10 text-muted-foreground text-sm">
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> 15 free generations</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> No credit card</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> Enterprise ready</span>
      </motion.div>
    </div>
  </section>
);

const ValueBar = () => (
  <section className="border-y border-white/[0.04] bg-white/[0.01]">
    <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
      {[
        { value: "10×", label: "Faster collection launches" },
        { value: "85%", label: "Content cost reduction" },
        { value: "30-40%", label: "Lower return rates" },
      ].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
          <p className="font-display text-4xl md:text-5xl font-bold glow-text mb-2">{s.value}</p>
          <p className="text-sm text-muted-foreground">{s.label}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const steps = [
  { icon: Upload, title: "Upload Garment", desc: "Drop in your product photo, sketch, or technical drawing. AI detects every seam, texture and detail." },
  { icon: Palette, title: "Style & Brand", desc: "Apply your logo, choose colorways, set rendering style. Your brand DNA is preserved perfectly." },
  { icon: Sparkles, title: "Generate Content", desc: "Get photorealistic stills, videos, virtual try-ons and campaign assets in seconds." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="section-padding">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-medium tracking-widest uppercase mb-4">How It Works</p>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
          Three steps to <span className="gradient-text">stunning content</span>
        </h2>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">From garment upload to campaign-ready assets in minutes, not months.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}
            className="glass-card-hover p-8 text-center group relative">
            <div className="absolute top-6 left-6 text-[80px] font-display font-bold text-white/[0.02] leading-none select-none">{i + 1}</div>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/[0.06] flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 transition-all duration-500">
                <s.icon className="w-6 h-6 text-primary/80" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-3 tracking-tight">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const modules = [
  { icon: Camera, name: "MotionAlive", desc: "Text-to-visual generation with fabric physics, sweat simulation and dynamic movement." },
  { icon: Target, name: "AthleteID", desc: "Consistent brand avatars with body measurement precision and A/B testing." },
  { icon: Shirt, name: "DynamicVTO", desc: "Virtual try-on with compression physics, seam stretch and heatmap overlays." },
  { icon: TrendingUp, name: "FitEvolve", desc: "Body transformation timeline with week-by-week visual progression." },
  { icon: Layers, name: "CollectionForge", desc: "One-click lookbooks with tech specs, size charts and sustainability badges." },
  { icon: Video, name: "CampaignFlow", desc: "Still-to-video with AI voiceover, shoppable end cards and auto-resizing." },
];

const Modules = () => (
  <section id="modules" className="section-padding bg-white/[0.01]">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-medium tracking-widest uppercase mb-4">Modules</p>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
          Built exclusively for <span className="gradient-text">activewear</span>
        </h2>
        <p className="text-muted-foreground text-base">Six powerful modules. One platform. Zero compromises.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, i) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.6 }}
            className="glass-card-hover p-7 group cursor-pointer">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/[0.06] flex items-center justify-center group-hover:bg-primary/10 transition-all duration-500">
                <m.icon className="w-5 h-5 text-primary/80" />
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{m.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
            <div className="mt-5 flex items-center gap-1 text-primary/70 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-500 tracking-wide uppercase">
              Explore <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const tiers = [
  { name: "Free", price: "€0", features: ["15 generations/month", "2 avatars", "Watermarked exports", "Community support"], cta: "Get Started" },
  { name: "Pro", price: "€79", popular: true, features: ["400 generations/month", "10 avatars", "HD, no watermark", "Basic analytics", "Priority support"], cta: "Start Pro Trial" },
  { name: "Business", price: "€249", features: ["Unlimited generations", "Team of 10", "Custom branding", "API access", "Dedicated support"], cta: "Contact Sales" },
];

const Pricing = () => (
  <section id="pricing" className="section-padding">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-medium tracking-widest uppercase mb-4">Pricing</p>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 tracking-tight">
          Simple, transparent <span className="gradient-text">pricing</span>
        </h2>
        <p className="text-muted-foreground text-base">Start free. Scale when you're ready.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className={`glass-card p-8 relative ${t.popular ? "border-primary/25 glow-border" : ""}`}>
            {t.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full tracking-wide">
                Most Popular
              </div>
            )}
            <h3 className="font-display text-xl font-bold mb-1 tracking-tight">{t.name}</h3>
            <div className="mb-8">
              <span className="font-display text-4xl font-bold">{t.price}</span>
              {t.price !== "€0" && <span className="text-muted-foreground text-sm">/mo</span>}
            </div>
            <ul className="space-y-3.5 mb-8">
              {t.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary/60 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button className={`w-full rounded-xl ${t.popular ? "" : "bg-white/[0.04] text-foreground hover:bg-white/[0.08] border border-white/[0.06]"}`}>
              {t.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonial = () => (
  <section className="section-padding bg-white/[0.01] border-y border-white/[0.04]">
    <div className="max-w-3xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <div className="flex justify-center gap-1 mb-6">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-primary/70 fill-primary/70" />)}
        </div>
        <blockquote className="font-display text-xl md:text-2xl font-medium leading-relaxed mb-8 tracking-tight">
          "ActiveForge replaced our entire product photography workflow. We launched our Spring collection 
          with zero photoshoots and saved over €40,000 in the first quarter alone."
        </blockquote>
        <div>
          <p className="text-sm font-medium">Emma Lindberg</p>
          <p className="text-xs text-muted-foreground mt-1">Head of Content, Nordic Performance Wear</p>
        </div>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/[0.04] section-padding py-14">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="font-display text-lg font-bold tracking-tight">Active<span className="text-primary">Forge</span></div>
      <div className="flex gap-8 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <a href="#" className="hover:text-foreground transition-colors">Contact</a>
      </div>
      <p className="text-xs text-muted-foreground/60">© 2026 ActiveForge. All rights reserved.</p>
    </div>
  </footer>
);

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <ValueBar />
    <HowItWorks />
    <Modules />
    <Testimonial />
    <Pricing />
    <Footer />
  </div>
);

export default Index;
