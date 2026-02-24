import { motion } from "framer-motion";
import { ArrowRight, Upload, Sparkles, Check, ChevronRight, Shirt, Camera, Target, TrendingUp, Layers, Video, Star, Play, Activity, RotateCcw, Zap } from "lucide-react";
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
    {/* Energy effects */}
    <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] bg-primary/[0.03] rounded-full blur-[250px]" />
    <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/[0.03] rounded-full blur-[200px]" />
    <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-destructive/[0.02] rounded-full blur-[150px]" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

    <div className="relative z-10 max-w-5xl mx-auto text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-primary/[0.04] mb-10">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-energy-pulse" />
        <span className="text-xs text-primary/90 font-bold tracking-widest uppercase">AI Motion Visuals for Sport Brands</span>
      </motion.div>

      <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
    className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.02] mb-7 tracking-tight uppercase">
        AI motion visuals for{" "}
        <span className="gradient-text">world-class</span>{" "}
        sport brands
      </motion.h1>

      <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
    className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
        Upload your gear → Customize athlete & movement → Generate realistic performance videos and images in seconds — no shoots, no samples.
      </motion.p>

      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/dashboard">
          <Button size="lg" className="text-sm px-8 py-6 font-bold gap-2 rounded-xl glow-border uppercase tracking-wide">
            Request Brand Demo <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="outline" size="lg" className="text-sm px-8 py-6 font-bold border-white/[0.08] rounded-xl hover:bg-white/[0.03] gap-2">
          <Play className="w-4 h-4" /> Watch In Action
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible" className="mt-20 flex items-center justify-center gap-10 text-muted-foreground text-sm flex-wrap">
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> 15 free generations</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> No credit card</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> Built for sport brands</span>
      </motion.div>
    </div>
  </section>;


const ValueBar = () =>
<section className="border-y border-white/[0.04] bg-white/[0.01]">
    <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
      {[
    { value: "10×", label: "Faster collection launches" },
    { value: "85%", label: "Content cost reduction" },
    { value: "30-40%", label: "Lower return rates" },
    { value: "500+", label: "Sport movements library" }].
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
{ icon: Upload, title: "Upload Garment", desc: "Drop your product photo, tech flat, or sketch. AI detects seams, fabrics, logos automatically." },
{ icon: Target, title: "Choose Size & Movement", desc: "Pick athlete body type (XS–XXL), gender, build. Select from 500+ sport movements." },
{ icon: Sparkles, title: "Generate Action Content", desc: "Get photorealistic stills, 15–60s motion videos with fabric physics, sweat, and compression." }];


const HowItWorks = () =>
<section id="how-it-works" className="section-padding">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">How It Works</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Three steps to <span className="gradient-text">action content</span>
        </h2>
        <p className="text-muted-foreground text-base max-w-lg mx-auto">From garment upload to performance visuals in minutes.</p>
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
{ icon: Camera, name: "MotionAlive", desc: "Text-to-visual with fabric physics, sweat simulation, multi-angle output and 360° spin." },
{ icon: Target, name: "AthleteID", desc: "Consistent brand avatars — all body types XS–XXL, any sport, pixel-perfect across generations." },
{ icon: Shirt, name: "DynamicVTO", desc: "Virtual try-on with compression physics, performance heatmaps and interactive 360° preview." },
{ icon: TrendingUp, name: "FitEvolve", desc: "Body transformation timeline — show garment fit at 4/8/12 weeks of training." },
{ icon: Layers, name: "CollectionForge", desc: "One-click lookbooks with tech specs, size charts and sustainability badges." },
{ icon: Video, name: "CampaignFlow", desc: "Still-to-video for Reels/TikTok with music, AI voiceover and shoppable cards." }];


const Modules = () =>
<section id="modules" className="section-padding bg-white/[0.01]">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">Modules</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Built for <span className="gradient-text">performance wear</span>
        </h2>
        <p className="text-muted-foreground text-base">Six powerful modules. One platform. Zero compromises.</p>
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


const tiers = [
{ name: "Free", price: "€0", features: ["15 generations/month", "2 avatars", "Watermarked exports", "Community support"], cta: "Get Started" },
{ name: "Pro", price: "€79", popular: true, features: ["400 generations/month", "10 avatars", "HD, no watermark", "Basic analytics", "Priority support"], cta: "Start Pro Trial" },
{ name: "Business", price: "€249", features: ["Unlimited generations", "Team of 10", "Custom branding", "API access", "Dedicated support"], cta: "Contact Sales" }];


const Pricing = () =>
<section id="pricing" className="section-padding">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">Pricing</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Simple, transparent <span className="gradient-text">pricing</span>
        </h2>
        <p className="text-muted-foreground text-base">Start free. Scale when you're ready.</p>
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


const PhysicsSection = () =>
<section className="section-padding bg-white/[0.01] border-y border-white/[0.04]">
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <p className="text-xs text-secondary font-bold tracking-widest uppercase mb-4">New</p>
        <h2 className="font-display text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase">
          Real motion physics &{" "}<span className="gradient-text">360° testing</span>
        </h2>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto">95% accurate drape and movement simulation. Test garment performance from every angle — no physical samples needed.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { icon: Zap, title: "Physics Engine", desc: "Realistic stretch under load, compression zones, sweat beads, wind effects. Color-coded stress maps with labels like 'High Compression – 85% support'." },
          { icon: RotateCcw, title: "Multi-Angle / 360°", desc: "Auto-generate 4–8 angles (front, sides, back, overhead) in one video. Interactive 360° spin mode with zoom on seams, logos, fabric detail." },
          { icon: Activity, title: "500+ Movements", desc: "Push-ups, squats, sprints, yoga, HIIT sequences. Select single or chain movements — AI animates garment with full physics." },
        ].map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="glass-card-hover p-8 group">
            <div className="w-12 h-12 rounded-2xl bg-secondary/[0.06] flex items-center justify-center mb-5 group-hover:bg-secondary/10 transition-all duration-500">
              <item.icon className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-display text-lg font-bold mb-3 tracking-tight">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
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
    <PhysicsSection />
    <Pricing />
    <Footer />
  </div>;


export default Index;