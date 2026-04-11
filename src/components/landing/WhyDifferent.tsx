import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Gauge, RefreshCw, AlertTriangle, Moon } from 'lucide-react';

const features = [
  {
    icon: Gauge,
    title: "2026 SmartGain Score",
    description: "AI-powered plan quality rating in real time",
  },
  {
    icon: RefreshCw,
    title: "Adaptive AI Engine",
    description: "Machine learning adjusts weekly based on your progress",
  },
  {
    icon: AlertTriangle,
    title: "Advanced Safety Alerts",
    description: "Prevents unhealthy over-gaining with 2026 health protocols",
  },
  {
    icon: Moon,
    title: "Lifestyle Intelligence",
    description: "Sleep, stress, water & recovery optimization",
  },
];

export function WhyDifferent() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-20 bg-background" ref={ref}>
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            Why <span className="gradient-text">SmartGain</span> Is Different
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Built with 2026's most advanced nutrition science — not outdated calorie counting methods.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.25, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
