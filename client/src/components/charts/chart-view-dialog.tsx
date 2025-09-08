import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Download, Trash, ChartPie } from "lucide-react";
import type { Chart, Folder } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChartViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chart: Chart | null;
}

export default function ChartViewDialog({ open, onOpenChange, chart }: ChartViewDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery<Folder[]>({
    queryKey: ["/api/folders"],
    enabled: open && !!chart,
  });

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
      onOpenChange(false);
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
    if (!chart) return;
    
    if (window.confirm("Are you sure you want to delete this chart? This action cannot be undone.")) {
      deleteChartMutation.mutate(chart.id);
    }
  };

  const handleEdit = () => {
    toast({
      title: "Coming Soon",
      description: "Chart editing functionality will be available soon.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Coming Soon",
      description: "Chart export functionality will be available soon.",
    });
  };

  if (!chart) return null;

  const folder = folders.find(f => f.id === chart.folderId);
  const createdDate = chart.createdAt ? new Date(chart.createdAt).toLocaleDateString() : "Unknown";
  const birthDate = new Date(chart.birthDate).toLocaleDateString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground" data-testid="text-chart-title">
                {chart.clientName} - Birth Chart
              </h3>
              <p className="text-muted-foreground" data-testid="text-chart-subtitle">
                Born {birthDate}, {chart.birthTime} in {chart.birthPlace}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Display Area */}
          <div className="lg:col-span-2">
            <div className="bg-muted rounded-xl p-8 text-center min-h-[400px] flex items-center justify-center">
              <div className="text-muted-foreground">
                <ChartPie className="mx-auto h-16 w-16 mb-4" />
                <p className="text-lg">Chart visualization will be rendered here</p>
                <p className="text-sm">Jyotish calculation engine integration pending</p>
              </div>
            </div>
          </div>
          
          {/* Chart Details */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3">Birth Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground" data-testid="text-birth-date">{birthDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="text-foreground" data-testid="text-birth-time">{chart.birthTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Place:</span>
                    <span className="text-foreground text-right" data-testid="text-birth-place">{chart.birthPlace}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3">Chart Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Folder:</span>
                    <Badge variant="secondary" data-testid="badge-folder">
                      {folder?.name || "No folder"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-foreground" data-testid="text-created-date">{createdDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {chart.notes && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-3">Notes</h4>
                  <p className="text-sm text-foreground" data-testid="text-chart-notes">
                    {chart.notes}
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={handleEdit}
                data-testid="button-edit-chart"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Chart
              </Button>
              <Button 
                variant="secondary" 
                className="w-full" 
                onClick={handleExport}
                data-testid="button-export-chart"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Chart
              </Button>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleDelete}
                disabled={deleteChartMutation.isPending}
                data-testid="button-delete-chart"
              >
                <Trash className="mr-2 h-4 w-4" />
                {deleteChartMutation.isPending ? "Deleting..." : "Delete Chart"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
