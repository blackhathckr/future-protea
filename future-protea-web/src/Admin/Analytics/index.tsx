/**
 * @fileoverview Cricket Analytics Dashboard
 * @module Admin/Analytics
 */

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Trophy, Users, TrendingUp, Target, Zap, Award } from 'lucide-react'

const matchData = [
  { name: 'Mon', matches: 4, runs: 245, wickets: 8 },
  { name: 'Tue', matches: 3, runs: 189, wickets: 6 },
  { name: 'Wed', matches: 5, runs: 312, wickets: 10 },
  { name: 'Thu', matches: 2, runs: 156, wickets: 4 },
  { name: 'Fri', matches: 6, runs: 398, wickets: 12 },
  { name: 'Sat', matches: 7, runs: 456, wickets: 14 },
  { name: 'Sun', matches: 8, runs: 523, wickets: 16 },
]

const playerPerformance = [
  { name: 'Batting Avg', value: 45.2 },
  { name: 'Bowling Avg', value: 28.5 },
  { name: 'Strike Rate', value: 142.3 },
  { name: 'Economy Rate', value: 6.8 },
]

const teamStats = [
  { name: 'Team A', wins: 12, losses: 3, draws: 2 },
  { name: 'Team B', wins: 10, losses: 5, draws: 2 },
  { name: 'Team C', wins: 9, losses: 6, draws: 2 },
  { name: 'Team D', wins: 8, losses: 7, draws: 2 },
]

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function AnalyticsPage() {
  useEffect(() => {
    // Analytics data loaded
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cricket Analytics</h1>
        <p className="text-muted-foreground mt-1">Comprehensive match and player performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/40 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-400 mt-2">342</p>
              </div>
              <Trophy className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Players</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">156</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/40 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Runs/Match</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">187</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/40 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Wickets/Match</p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-400 mt-2">9.2</p>
              </div>
              <Zap className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="matches">Match Trends</TabsTrigger>
          <TabsTrigger value="players">Player Stats</TabsTrigger>
          <TabsTrigger value="teams">Team Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Match Trends */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-600" />
                Weekly Match Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={matchData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="matches" stroke="#ef4444" strokeWidth={2} name="Matches" />
                  <Line type="monotone" dataKey="runs" stroke="#3b82f6" strokeWidth={2} name="Total Runs" />
                  <Line type="monotone" dataKey="wickets" stroke="#10b981" strokeWidth={2} name="Wickets" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Player Stats */}
        <TabsContent value="players">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Player Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={playerPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Virat Kohli', stat: '1247 runs', badge: 'Batsman' },
                    { name: 'Jasprit Bumrah', stat: '34 wickets', badge: 'Bowler' },
                    { name: 'Rohit Sharma', stat: '892 runs', badge: 'Batsman' },
                    { name: 'Yuzvendra Chahal', stat: '28 wickets', badge: 'Bowler' },
                  ].map((player) => (
                    <div key={player.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.stat}</p>
                      </div>
                      <Badge variant="outline">{player.badge}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Performance */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Team Win/Loss Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="wins" fill="#10b981" name="Wins" />
                  <Bar dataKey="losses" fill="#ef4444" name="Losses" />
                  <Bar dataKey="draws" fill="#f59e0b" name="Draws" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="font-medium text-blue-900 dark:text-blue-300">📊 Highest Scoring Match</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Team A vs Team B: 487 runs (Saturday)</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <p className="font-medium text-green-900 dark:text-green-300">🏆 Best Bowling Performance</p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">5 wickets for 28 runs (Jasprit Bumrah)</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <p className="font-medium text-orange-900 dark:text-orange-300">⚡ Fastest Century</p>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">42 balls (Virat Kohli)</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <p className="font-medium text-purple-900 dark:text-purple-300">🎯 Win Rate Trend</p>
                  <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">↑ 12% increase this week</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Match Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Won', value: 180 },
                        { name: 'Lost', value: 120 },
                        { name: 'Drawn', value: 42 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
