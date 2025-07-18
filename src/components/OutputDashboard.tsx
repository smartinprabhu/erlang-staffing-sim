import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Upload, TrendingUp, Users, Activity, Target } from "lucide-react";
import { SimulationResults, ConfigurationData } from "./ContactCenterApp";
import { MetricCard } from "./MetricCard";
import { SLAChart } from "./SLAChart";
import { OccupancyChart } from "./OccupancyChart";
import { IntervalTable } from "./IntervalTable";
import { DailySummaryTable } from "./DailySummaryTable";

interface OutputDashboardProps {
  results: SimulationResults;
  onBackToInput: () => void;
  configData: ConfigurationData;
}

export function OutputDashboard({ results, onBackToInput, configData }: OutputDashboardProps) {
  const [activeTab, setActiveTab] = useState("analysis");

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={onBackToInput}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Results & Analysis Dashboard</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Input Configuration
          </Button>
          <Button variant="default" className="gap-2">
            <Download className="h-4 w-4" />
            Output Dashboard
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Final SLA"
          value={`${results.finalSLA.toFixed(1)}%`}
          subtitle="Basis agents plotted in shifts"
          icon={Target}
          color="blue"
          trend={results.finalSLA >= 80 ? "up" : "down"}
        />
        <MetricCard
          title="Final Occupancy"
          value={`${results.finalOccupancy.toFixed(1)}%`}
          subtitle="Where SLA meets optimum staffing"
          icon={TrendingUp}
          color="green"
          trend="up"
        />
        <MetricCard
          title="Total Volume"
          value={results.totalVolume.toLocaleString()}
          subtitle="Contacts"
          icon={Activity}
          color="orange"
          trend="up"
        />
        <MetricCard
          title="Avg. Staffing"
          value={Math.round(results.averageStaffing).toString()}
          subtitle="Effective Agents"
          icon={Users}
          color="green"
          trend="up"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="analysis">Analysis & Plots</TabsTrigger>
          <TabsTrigger value="interval">Interval View</TabsTrigger>
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SLAChart 
              results={results}
              targetSLA={configData.slaTarget}
            />
            <OccupancyChart 
              results={results}
            />
          </div>
          
          {/* Key Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Key Recommendations & Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-3 text-blue-400">SLA Optimization:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• SLA is {results.finalSLA >= configData.slaTarget ? 'above' : 'below'} target - {results.finalSLA >= configData.slaTarget ? 'maintain current' : 'consider increasing'} staffing</li>
                    <li>• Focus on peak hours (9 AM - 5 PM) for maximum impact</li>
                    <li>• Monitor day-of-week variations for targeted improvements</li>
                    <li>• Consider flexible scheduling during high-volume periods</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-green-400">Occupancy Management:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• {results.finalOccupancy > 85 ? 'High occupancy may lead to agent burnout' : 'Occupancy within acceptable range'}</li>
                    <li>• Balance efficiency with agent wellbeing</li>
                    <li>• Plan for adequate break coverage</li>
                    <li>• Consider cross-training for flexibility</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interval">
          <IntervalTable results={results} />
        </TabsContent>

        <TabsContent value="daily">
          <DailySummaryTable results={results} />
        </TabsContent>
      </Tabs>
    </div>
  );
}