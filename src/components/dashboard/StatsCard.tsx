import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={`${className} h-auto`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
        <CardTitle className="text-sm font-semibold opacity-90">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 opacity-75" />}
      </CardHeader>
      <CardContent className="px-3 py-2">
        <div className="text-xl font-bold">{value}</div>
        {description && (
          <p className="text-xs font-medium opacity-75 mt-0.5">{description}</p>
        )}
        {trend && (
          <p
            className={`text-xs mt-0.5 ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            } bg-white/80 dark:bg-black/20 px-1 rounded w-fit`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
          </p>
        )}
      </CardContent>
    </Card>
  );
}
