import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import ChartCard from "@/components/charts/chart-card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import type { Chart } from "@shared/schema";

export default function Search() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
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

  const { data: charts = [], isLoading: chartsLoading } = useQuery<Chart[]>({
    queryKey: ["/api/charts", searchQuery ? { search: searchQuery } : ""],
    enabled: isAuthenticated && searchQuery.length > 0,
  });

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Search Charts</h2>
            <p className="text-muted-foreground">Find charts by client name</p>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative mb-8">
              <Input
                type="text"
                placeholder="Search for charts by client name..."
                className="pl-10 text-lg py-6"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-main"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {!searchQuery ? (
                <div className="text-center py-12 text-muted-foreground">
                  Start typing to search for charts by client name
                </div>
              ) : chartsLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Searching...
                </div>
              ) : charts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No charts found matching "{searchQuery}"
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Found {charts.length} chart{charts.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </div>
                  {charts.map((chart) => (
                    <ChartCard key={chart.id} chart={chart} />
                  ))}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
