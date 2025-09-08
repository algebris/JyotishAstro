import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertChartSchema } from "@shared/schema";
import { LocationSearch } from "@/components/location/location-search";
import type { Chart, Folder } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface EditChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chart: Chart | null;
  folders: Folder[];
}

export default function EditChartDialog({ open, onOpenChange, chart, folders }: EditChartDialogProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    locationId: null as string | null,
    notes: "",
    folderId: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Заполняем форму данными при открытии диалога
  useEffect(() => {
    if (chart && open) {
      setFormData({
        clientName: chart.clientName,
        birthDate: chart.birthDate,
        birthTime: chart.birthTime,
        birthPlace: chart.birthPlace,
        locationId: chart.locationId || null,
        notes: chart.notes || "",
        folderId: chart.folderId || "no-folder",
      });
    }
  }, [chart, open]);

  const updateChartMutation = useMutation({
    mutationFn: async (chartData: typeof formData) => {
      if (!chart) throw new Error("No chart to update");
      
      const validatedData = insertChartSchema.parse({
        ...chartData,
        folderId: chartData.folderId === "no-folder" ? null : chartData.folderId || null,
      });
      
      await apiRequest("PUT", `/api/charts/${chart.id}`, validatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Chart updated successfully",
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
        description: "Failed to update chart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.birthDate || !formData.birthTime || (!formData.locationId && !formData.birthPlace.trim())) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    updateChartMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!chart) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Chart - {chart.clientName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-4">Client Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-client-name">Client Name *</Label>
                <Input
                  id="edit-client-name"
                  type="text"
                  placeholder="Enter client's full name"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  required
                  data-testid="input-edit-client-name"
                />
              </div>
              <div>
                <Label htmlFor="edit-folder">Folder</Label>
                <Select 
                  value={formData.folderId} 
                  onValueChange={(value) => handleInputChange("folderId", value)}
                >
                  <SelectTrigger data-testid="select-edit-folder">
                    <SelectValue placeholder="Select folder..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-folder">No folder</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Birth Details */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-4">Birth Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-birth-date">Birth Date *</Label>
                <Input
                  id="edit-birth-date"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                  required
                  data-testid="input-edit-birth-date"
                />
              </div>
              <div>
                <Label htmlFor="edit-birth-time">Birth Time *</Label>
                <Input
                  id="edit-birth-time"
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => handleInputChange("birthTime", e.target.value)}
                  required
                  data-testid="input-edit-birth-time"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="edit-birth-place">Место рождения *</Label>
              <LocationSearch
                value={formData.locationId}
                onChange={(locationId) => handleInputChange("locationId", locationId || "")}
                placeholder="Поиск города или места рождения..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Поиск автоматически сохранит координаты и часовой пояс
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="edit-notes">Notes (Optional)</Label>
            <Textarea
              id="edit-notes"
              placeholder="Any additional notes about this chart..."
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              data-testid="textarea-edit-notes"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-edit-chart"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={updateChartMutation.isPending}
              data-testid="button-save-chart"
            >
              {updateChartMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}