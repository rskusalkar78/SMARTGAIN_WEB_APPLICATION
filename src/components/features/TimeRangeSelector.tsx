import { Button } from "@/components/ui/button";

export type TimeRange = '7d' | '30d' | '90d' | 'all';

interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
    const ranges: { label: string; value: TimeRange }[] = [
        { label: '7 Days', value: '7d' },
        { label: '30 Days', value: '30d' },
        { label: '3 Months', value: '90d' },
        { label: 'All Time', value: 'all' },
    ];

    return (
        <div className="flex items-center space-x-2 bg-secondary/20 p-1 rounded-lg">
            {ranges.map((range) => (
                <Button
                    key={range.value}
                    variant={value === range.value ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onChange(range.value)}
                    className="text-xs transition-all"
                >
                    {range.label}
                </Button>
            ))}
        </div>
    );
}
