import { IconBook, IconClock, IconCurrencyRupee, IconUsers, IconVideo, IconCertificate } from "@tabler/icons-react"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const learnerStats = [
  {
    title: "Enrolled Courses",
    value: "12",
    icon: IconBook,
    description: "Currently active",
    footer: "+2 this month",
  },
  {
    title: "Live Sessions",
    value: "8",
    icon: IconVideo,
    description: "Upcoming sessions",
    footer: "Next in 2 hours",
  },
  {
    title: "Learning Hours",
    value: "48.5",
    icon: IconClock,
    description: "Total this month",
    footer: "+12% from last month",
  },
  {
    title: "Certificates Earned",
    value: "5",
    icon: IconCertificate,
    description: "Completed courses",
    footer: "1 pending review",
  },
]

const educatorStats = [
  {
    title: "Total Learners",
    value: "2,847",
    icon: IconUsers,
    description: "Enrolled learners",
    footer: "Across all courses",
  },
  {
    title: "Active Courses",
    value: "18",
    icon: IconBook,
    description: "Published courses",
    footer: "3 drafts pending",
  },
  {
    title: "Sessions This Week",
    value: "12",
    icon: IconVideo,
    description: "Scheduled sessions",
    footer: "Next in 45 min",
  },
  {
    title: "Revenue",
    value: "\u20B912,450",
    icon: IconCurrencyRupee,
    description: "This month",
    footer: "Exceeds target by 15%",
  },
]

export function SectionCards() {
  const stats = educatorStats

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="@container/card overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              {stat.title}
            </CardDescription>
            <CardTitle className="text-3xl font-bold tabular-nums mt-2">
              {stat.value}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{stat.description}</p>
          </CardHeader>
          <CardFooter className="pt-0">
            <p className="text-xs text-muted-foreground">{stat.footer}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
