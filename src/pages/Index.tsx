import { motion } from "framer-motion";
import { ArrowRight, Upload, Sparkles, Check, Play, Activity, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const }
  })
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-background/80 backdrop-blur-2xl">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Active<span className="text-primary">Forge</span>
      </Link>
      <div className="hidden md:flex items-center gap-10">
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#pricing" className="nav-link">Pricing</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Log in</Button>
        </Link>
        <Link to="/signup">
          <Button size="sm" className="gap-1.5 rounded-xl px-5 font-bold">
            Start Free <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
    <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[200px]" />
    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/[0.02] rounded-full blur-[180px]" />

    <div className="relative z-10 max-w-4xl mx-auto text-center">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-primary/[0.04] mb-10">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-energy-pulse" />
        <span className="text-xs text-primary/90 font-bold tracking-widest uppercase">AI Motion Testing</span>
      </motion.div>

      <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="visible"
        className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-7 tracking-tight">
        See your gear{" "}
        <span className="gradient-text">in motion</span>{" "}
        before production
      </motion.h1>

      <motion.p variants={fadeUp} custom={2} initial="hidden" animate="visible"
        className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
        Upload your training wear. Choose an athlete and movement. Get realistic physics simulation with stretch, compression, and sweat — in seconds.
      </motion.p>

      <motion.div variants={fadeUp} custom={3} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/signup">
          <Button size="lg" className="text-sm px-8 py-6 font-bold gap-2 rounded-xl glow-border">
            Start Free — 5 Generations <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" size="lg" className="text-sm px-8 py-6 font-bold border-white/[0.08] rounded-xl hover:bg-white/[0.03] gap-2">
            <Play className="w-4 h-4" /> Log In
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} custom={4} initial="hidden" animate="visible"
        className="mt-16 flex items-center justify-center gap-8 text-muted-foreground text-sm flex-wrap">
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> No samples needed</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> Real physics simulation</span>
        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-primary/70" /> Multi-angle export</span>
      </motion.div>
    </div>
  </section>
);

const ValueBar = () => (
  <section className="border-y border-white/[0.04] bg-white/[0.01]">
    <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
      {[
        { value: "85%", label: "Lower content costs" },
        { value: "30-40%", label: "Fewer returns" },
        { value: "<45s", label: "Average generation time" },
      ].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
          <p className="font-display text-4xl md:text-5xl font-black glow-text mb-2">{s.value}</p>
          <p className="text-sm text-muted-foreground">{s.label}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const steps = [
  { icon: Upload, title: "Upload Your Gear", desc: "Drop your product photo, tech flat, or sketch. AI detects fabric, seams, and details automatically." },
  { icon: Target, title: "Choose Athlete & Movement", desc: "Pick body type, size, and a training movement like squats or sprints. Set intensity with a simple slider." },
  { icon: Sparkles, title: "Get Realistic Results", desc: "AI generates video and images with real physics — stretch, compression, sweat. Export multi-angle views instantly." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="px-6 py-24 md:px-12">
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">How It Works</p>
        <h2 className="font-display text-3xl md:text-4xl font-black mb-4 tracking-tight">
          Three steps to <span className="gradient-text">performance content</span>
        </h2>
        <p className="text-muted-foreground text-base max-w-md mx-auto">From garment upload to campaign-ready assets in minutes.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
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
        ))}
      </div>
    </div>
  </section>
);

const tiers = [
  { name: "Free", price: "€0", features: ["5 generations/month", "Watermarked exports", "1 team member"], cta: "Start Free" },
  { name: "Pro", price: "€99", popular: true, features: ["400 generations/month", "HD, no watermark", "Team of 5", "Logo placement", "Priority support"], cta: "Start Pro Trial" },
  { name: "Business", price: "€299", features: ["Unlimited generations", "Team of 25", "Campaign Pack export", "API access", "Dedicated manager"], cta: "Contact Sales" },
];

const Pricing = () => (
  <section id="pricing" className="px-6 py-24 md:px-12">
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
        <p className="text-xs text-primary/80 font-bold tracking-widest uppercase mb-4">Pricing</p>
        <h2 className="font-display text-3xl md:text-4xl font-black mb-4 tracking-tight">
          Scale with your <span className="gradient-text">brand</span>
        </h2>
        <p className="text-muted-foreground text-base">Start free. Upgrade when you need more.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className={`glass-card p-7 relative ${t.popular ? "border-primary/25 glow-border" : ""}`}>
            {t.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full tracking-widest uppercase">
                Most Popular
              </div>
            )}
            <h3 className="font-display text-lg font-bold mb-1 tracking-tight">{t.name}</h3>
            <div className="mb-6">
              <span className="font-display text-3xl font-black">{t.price}</span>
              {t.price !== "€0" && <span className="text-muted-foreground text-sm">/mo</span>}
            </div>
            <ul className="space-y-3 mb-6">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary/60 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link to="/signup">
              <Button className={`w-full rounded-xl font-bold text-sm ${t.popular ? "" : "bg-white/[0.04] text-foreground hover:bg-white/[0.08] border border-white/[0.06]"}`}>
                {t.cta}
              </Button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-white/[0.04] px-6 py-14">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
      <div className="font-display text-lg font-bold tracking-tight flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        Active<span className="text-primary">Forge</span>
      </div>
      <div className="flex gap-8 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        <a href="#" className="hover:text-foreground transition-colors">Contact</a>
      </div>
      <p className="text-xs text-muted-foreground/60">© 2026 ActiveForge</p>
    </div>
  </footer>
);

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <ValueBar />
    <HowItWorks />
    <Pricing />
    <Footer />
  </div>
);

export default Index;
