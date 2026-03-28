import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroAthlete from "@/assets/hero-athlete.jfif";

const ANGLES = [
  { id: "front", label: "Front", rotation: "0deg" },
  { id: "side-left", label: "Vänster", rotation: "-8deg" },
  { id: "side-right", label: "Höger", rotation: "8deg" },
  { id: "back", label: "Bak", rotation: "0deg" },
] as const;

const ShowcaseSection = () => {
  const [activeAngle, setActiveAngle] = useState("front");

  return (
    <section className="relative px-6 py-20 md:py-32 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/[0.02] rounded-full blur-[180px]" />

      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left – Text content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/15 bg-primary/[0.04]">
            <Eye className="w-3.5 h-3.5 text-primary/80" />
            <span className="text-xs text-primary/90 font-bold tracking-widest uppercase">
              Multi-Angle Preview
            </span>
          </div>

          <div className="space-y-4 font-serif">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] tracking-tight font-serif">
              Se plagget från{" "}
              <span className="gradient-text">alla vinklar</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
              Visualisera hur ditt plagg ser ut på en riktig atlet i rörelse.
            </p>
          </div>

          {/* Angle selector */}
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              Välj vinkel
            </p>
            <div className="flex gap-2">
              {ANGLES.map((angle) => (
                <button
                  key={angle.id}
                  onClick={() => setActiveAngle(angle.id)}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border font-serif ${
                    activeAngle === angle.id
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-muted/40 text-muted-foreground border-border hover:border-primary/30 hover:bg-muted/60"
                  }`}
                >
                  {angle.label}
                </button>
              ))}
            </div>
          </div>

          <Link to="/signup">
            <Button size="lg" className="text-sm px-8 py-6 font-bold gap-2 rounded-xl glow-border mt-4 font-serif">
              Prova gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Right – Athlete image with angle simulation */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative flex items-center justify-center"
        >
          {/* Floating cards */}
          <div className="absolute top-4 right-4 z-20 glass-card px-4 py-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">AI-RESULTAT</p>
              <p className="text-[10px] text-muted-foreground">Realtidsvy</p>
            </div>
          </div>

          {/* Angle label */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAngle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass-card px-5 py-2 rounded-full"
            >
              <p className="text-xs font-bold text-primary tracking-widest uppercase">
                {ANGLES.find((a) => a.id === activeAngle)?.label} View
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Image container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAngle}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden bg-background"
              style={{
                transform: `perspective(1000px) rotateY(${ANGLES.find((a) => a.id === activeAngle)?.rotation})`,
              }}
            >
              <img
                src={heroAthlete}
                alt="Atlet i träningskläder — AI-genererad multi-angle vy"
className="w-full h-full object-center object-cover opacity-100"
              />
              {/* Subtle overlay for non-front angles to hint at perspective shift */}
              {activeAngle !== "front" && (
                <div className="absolute inset-0 bg-gradient-to-r from-background/10 to-transparent pointer-events-none" />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Side thumbnails */}
          <div className="absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            {ANGLES.filter((a) => a.id !== activeAngle).slice(0, 2).map((angle) => (
              <button
                key={angle.id}
                onClick={() => setActiveAngle(angle.id)}
                className="w-16 h-20 rounded-xl overflow-hidden border-2 border-border/40 hover:border-primary/40 transition-all opacity-70 hover:opacity-100"
              >
                <img
                  src={heroAthlete}
                  alt={`${angle.label} vy`}
                  className="w-full h-full object-cover object-top"
                />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
