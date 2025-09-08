import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import StatsCards from "@/components/stats/stats-cards";
import FolderCard from "@/components/folders/folder-card";
import ChartCard from "@/components/charts/chart-card";
import CreateChartDialog from "@/components/charts/create-chart-dialog";
import CreateFolderDialog from "@/components/folders/create-folder-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import type { Folder, Chart } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [createChartOpen, setCreateChartOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
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

  const { data: folders = [], isLoading: foldersLoading } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
    enabled: isAuthenticated,
  });

  const { data: charts = [], isLoading: chartsLoading } = useQuery<Chart[]>({
    queryKey: ["/api/charts"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const recentCharts = charts
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Charts Overview</h2>
              <p className="text-muted-foreground">Manage your astrological charts and client data</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search charts..."
                  className="pl-10 w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
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
          <StatsCards />

          {/* Folders Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Folders</h3>
              <Button 
                variant="ghost" 
                onClick={() => setCreateFolderOpen(true)}
                data-testid="button-new-folder"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {foldersLoading ? (
                <div className="text-muted-foreground">Loading folders...</div>
              ) : folders.length === 0 ? (
                <div className="text-muted-foreground">No folders yet. Create your first folder!</div>
              ) : (
                folders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))
              )}
            </div>
          </div>

          {/* Recent Charts */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Recent Charts</h3>
              <Button variant="ghost">View all</Button>
            </div>
            
            <div className="space-y-4">
              {chartsLoading ? (
                <div className="text-muted-foreground">Loading charts...</div>
              ) : recentCharts.length === 0 ? (
                <div className="text-muted-foreground">No charts yet. Create your first chart!</div>
              ) : (
                recentCharts.map((chart) => (
                  <ChartCard key={chart.id} chart={chart} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      <CreateChartDialog 
        open={createChartOpen} 
        onOpenChange={setCreateChartOpen}
        folders={folders}
      />
      <CreateFolderDialog 
        open={createFolderOpen} 
        onOpenChange={setCreateFolderOpen}
      />
    </div>
  );
}
