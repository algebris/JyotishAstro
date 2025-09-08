import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import ChartCard from "@/components/charts/chart-card";
import CreateChartDialog from "@/components/charts/create-chart-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import type { Folder, Chart } from "@shared/schema";

export default function Charts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [createChartOpen, setCreateChartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
    enabled: isAuthenticated,
  });

  const { data: charts = [], isLoading: chartsLoading } = useQuery<Chart[]>({
    queryKey: ["/api/charts", searchQuery ? `search=${searchQuery}` : ""],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const filteredCharts = searchQuery 
    ? charts.filter(chart => 
        chart.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : charts;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">All Charts</h2>
              <p className="text-muted-foreground">Browse and manage all your astrological charts</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search charts..."
                  className="pl-10 w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-charts"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              <Button 
                onClick={() => setCreateChartOpen(true)}
                data-testid="button-new-chart"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Chart
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          <div className="space-y-4">
            {chartsLoading ? (
              <div className="text-muted-foreground">Loading charts...</div>
            ) : filteredCharts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  {searchQuery ? "No charts found matching your search." : "No charts yet. Create your first chart!"}
                </div>
                {!searchQuery && (
                  <Button onClick={() => setCreateChartOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Chart
                  </Button>
                )}
              </div>
            ) : (
              filteredCharts.map((chart) => (
                <ChartCard key={chart.id} chart={chart} />
              ))
            )}
          </div>
        </main>
      </div>

      <CreateChartDialog 
        open={createChartOpen} 
        onOpenChange={setCreateChartOpen}
        folders={folders}
      />
    </div>
  );
}
