// SmartGain Frontend - Dashboard Header Component
// Welcome message and current date display

interface DashboardHeaderProps {
  userName: string;
}

const DashboardHeader = ({ userName }: DashboardHeaderProps) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
      <p className="text-muted-foreground">{currentDate}</p>
    </div>
  );
};

export default DashboardHeader;
