import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import showcaseCard1 from "@/assets/showcase-card-1.jfif";
import showcaseCard2 from "@/assets/showcase-card-2.jfif";

const cards = [
  {
    image: showcaseCard1,
    title: "Performance Studio",
    description:
      "AI-powered motion testing for training wear. Simulate stretch, compression, and sweat across every movement — before production.",
    bestFor: "Enterprise sportswear brands",
    cta: "Start Creating",
    link: "/signup",
  },
  {
    image: showcaseCard2,
    title: "Brand Visualizer",
    description:
      "Generate campaign-ready athlete content on-demand. Multi-angle, multi-size — consistent and brand-aligned every time.",
    bestFor: "DTC brands, agencies & studios",
    cta: "Start Creating",
    link: "/signup",
  },
];

const ShowcaseCards = () => (
  <section className="px-6 py-16 md:py-24">
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.7, ease: "easeOut" }}
          className="group relative rounded-3xl overflow-hidden min-h-[420px] md:min-h-[520px] flex flex-col justify-end"
        >
          {/* Background image */}
          <img
            src={card.image}
            alt={card.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          {/* Content */}
          <div className="relative z-10 p-7 md:p-9 flex flex-col gap-4">
            <h3 className="font-display text-2xl md:text-3xl font-black tracking-tight text-white">
              {card.title}
            </h3>
            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-md">
              {card.description}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-white/50">
                <span className="font-bold text-white/70">Best for: </span>
                {card.bestFor}
              </p>
              <Link to={card.link}>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:brightness-110 transition-all duration-300">
                  {card.cta} <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default ShowcaseCards;
