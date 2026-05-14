import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Users,
  DollarSign,
  CreditCard,
  Video,
  Shield,
  Server,
  Activity,
  Clock,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  BookOpen,
  Users,
  DollarSign,
  CreditCard,
  Video,
  Shield,
  Server,
  Activity,
  Clock,
  BarChart3,
  TrendingUp,
};

interface ReportSummaryCardProps {
  icon: string;
  title: string;
  value: string | number;
  changePercent?: number;
}

export const ReportSummaryCard = memo(function ReportSummaryCard({
  icon,
  title,
  value,
  changePercent,
}: ReportSummaryCardProps) {
  const Icon = iconMap[icon] ?? Activity;
  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {changePercent !== undefined && (
              <Badge
                variant="outline"
                className={
                  isPositive
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }
              >
                {isPositive ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {Math.abs(changePercent).toFixed(1)}%
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
