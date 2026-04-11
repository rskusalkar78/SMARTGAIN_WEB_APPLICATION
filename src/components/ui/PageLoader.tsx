import { Loader2 } from 'lucide-react';

export const PageLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground animate-in fade-in duration-300">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-80" />
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading experience...</p>
    </div>
  );
};

export default PageLoader;
