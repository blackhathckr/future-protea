import * as React from "react"
import { motion } from "framer-motion"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const learnerChartData = [
  { date: "2024-04-01", hours: 2.5, courses: 1 },
  { date: "2024-04-02", hours: 1.8, courses: 1 },
  { date: "2024-04-03", hours: 3.2, courses: 2 },
  { date: "2024-04-04", hours: 2.0, courses: 1 },
  { date: "2024-04-05", hours: 4.5, courses: 3 },
  { date: "2024-04-06", hours: 3.8, courses: 2 },
  { date: "2024-04-07", hours: 1.5, courses: 1 },
  { date: "2024-04-08", hours: 2.8, courses: 2 },
  { date: "2024-04-09", hours: 3.5, courses: 2 },
  { date: "2024-04-10", hours: 4.2, courses: 3 },
  { date: "2024-04-11", hours: 2.0, courses: 1 },
  { date: "2024-04-12", hours: 3.0, courses: 2 },
  { date: "2024-04-13", hours: 5.0, courses: 4 },
  { date: "2024-04-14", hours: 2.5, courses: 2 },
  { date: "2024-04-15", hours: 1.8, courses: 1 },
  { date: "2024-04-16", hours: 3.5, courses: 2 },
  { date: "2024-04-17", hours: 4.0, courses: 3 },
  { date: "2024-04-18", hours: 2.2, courses: 1 },
  { date: "2024-04-19", hours: 3.8, courses: 3 },
  { date: "2024-04-20", hours: 2.5, courses: 2 },
  { date: "2024-04-21", hours: 4.5, courses: 3 },
  { date: "2024-04-22", hours: 3.2, courses: 2 },
  { date: "2024-04-23", hours: 2.8, courses: 2 },
  { date: "2024-04-24", hours: 5.5, courses: 4 },
  { date: "2024-04-25", hours: 3.0, courses: 2 },
  { date: "2024-04-26", hours: 2.0, courses: 1 },
  { date: "2024-04-27", hours: 4.2, courses: 3 },
  { date: "2024-04-28", hours: 3.5, courses: 2 },
  { date: "2024-04-29", hours: 2.8, courses: 2 },
  { date: "2024-04-30", hours: 4.8, courses: 3 },
]

const educatorChartData = [
  { date: "2024-04-01", students: 45, revenue: 450 },
  { date: "2024-04-02", students: 52, revenue: 520 },
  { date: "2024-04-03", students: 48, revenue: 480 },
  { date: "2024-04-04", students: 61, revenue: 610 },
  { date: "2024-04-05", students: 55, revenue: 550 },
  { date: "2024-04-06", students: 67, revenue: 670 },
  { date: "2024-04-07", students: 43, revenue: 430 },
  { date: "2024-04-08", students: 72, revenue: 720 },
  { date: "2024-04-09", students: 58, revenue: 580 },
  { date: "2024-04-10", students: 65, revenue: 650 },
  { date: "2024-04-11", students: 78, revenue: 780 },
  { date: "2024-04-12", students: 62, revenue: 620 },
  { date: "2024-04-13", students: 85, revenue: 850 },
  { date: "2024-04-14", students: 53, revenue: 530 },
  { date: "2024-04-15", students: 47, revenue: 470 },
  { date: "2024-04-16", students: 69, revenue: 690 },
  { date: "2024-04-17", students: 91, revenue: 910 },
  { date: "2024-04-18", students: 76, revenue: 760 },
  { date: "2024-04-19", students: 58, revenue: 580 },
  { date: "2024-04-20", students: 42, revenue: 420 },
  { date: "2024-04-21", students: 54, revenue: 540 },
  { date: "2024-04-22", students: 68, revenue: 680 },
  { date: "2024-04-23", students: 73, revenue: 730 },
  { date: "2024-04-24", students: 95, revenue: 950 },
  { date: "2024-04-25", students: 82, revenue: 820 },
  { date: "2024-04-26", students: 56, revenue: 560 },
  { date: "2024-04-27", students: 88, revenue: 880 },
  { date: "2024-04-28", students: 64, revenue: 640 },
  { date: "2024-04-29", students: 79, revenue: 790 },
  { date: "2024-04-30", students: 102, revenue: 1020 },
]

const learnerChartConfig = {
  hours: {
    label: "Learning Hours",
    color: "var(--primary)",
  },
  courses: {
    label: "Courses Accessed",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const educatorChartConfig = {
  students: {
    label: "New Learners",
    color: "var(--primary)",
  },
  revenue: {
    label: "Revenue ($)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = educatorChartData
  const chartConfig = educatorChartConfig

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-04-30")
    let daysToSubtract = 30
    if (timeRange === "7d") {
      daysToSubtract = 7
    } else if (timeRange === "14d") {
      daysToSubtract = 14
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const dataKey1 = "students"
  const dataKey2 = "revenue"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="@container/card border-0 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-xl">
            Learner Growth & Revenue
          </CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              New learner enrollments and revenue trends
            </span>
            <span className="@[540px]/card:hidden">
              Growth Trends
            </span>
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="14d">Last 14 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                <SelectItem value="14d" className="rounded-lg">Last 14 days</SelectItem>
                <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey={dataKey2}
                type="monotone"
                fill="url(#fillSecondary)"
                stroke="var(--chart-2)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey={dataKey1}
                type="monotone"
                fill="url(#fillPrimary)"
                stroke="var(--primary)"
                strokeWidth={2}
                stackId="b"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
