import { Dumbbell } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 bg-secondary/50 border-t border-border">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold font-display">SmartGain</span>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} SmartGain. Intelligent weight gain planning.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
