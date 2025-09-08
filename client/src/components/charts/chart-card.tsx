import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Edit, Trash } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ChartViewDialog from "./chart-view-dialog";
import EditChartDialog from "./edit-chart-dialog";
import type { Chart, Folder } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChartCardProps {
  chart: Chart;
}

export default function ChartCard({ chart }: ChartCardProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
  });

  const folder = folders.find(f => f.id === chart.folderId);
  const initials = chart.clientName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const birthDate = new Date(chart.birthDate).toLocaleDateString();
  const createdDate = chart.createdAt 
    ? new Date(chart.createdAt).toLocaleDateString()
    : "Unknown";

  const deleteChartMutation = useMutation({
    mutationFn: async (chartId: string) => {
      await apiRequest("DELETE", `/api/charts/${chartId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Chart deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete chart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the chart for ${chart.clientName}? This action cannot be undone.`)) {
      deleteChartMutation.mutate(chart.id);
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow" data-testid={`card-chart-${chart.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground" data-testid="text-client-name">
                    {chart.clientName}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewDialogOpen(true)}
                      data-testid="button-view-chart"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditDialogOpen(true)}
                      data-testid="button-edit-chart"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleteChartMutation.isPending}
                      data-testid="button-delete-chart"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mt-1">
                  <p data-testid="text-birth-details">Born {birthDate} in {chart.birthPlace}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      {folder && (
                        <Badge variant="secondary" data-testid="badge-chart-folder">
                          {folder.name}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs" data-testid="text-chart-created">
                      Created {createdDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChartViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        chart={chart}
      />

      <EditChartDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        chart={chart}
        folders={folders}
      />
    </>
  );
}
