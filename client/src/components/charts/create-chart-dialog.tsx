import { useState } from "react";
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
import CreateFolderDialog from "@/components/folders/create-folder-dialog";
import { Plus } from "lucide-react";
import type { Folder } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CreateChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
}

export default function CreateChartDialog({ open, onOpenChange, folders }: CreateChartDialogProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    locationId: null as string | null,
    notes: "",
    folderId: "",
  });
  
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createChartMutation = useMutation({
    mutationFn: async (chartData: typeof formData) => {
      const validatedData = insertChartSchema.parse({
        ...chartData,
        folderId: chartData.folderId === "no-folder" ? null : chartData.folderId || null,
      });
      await apiRequest("POST", "/api/charts", validatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Chart created successfully",
      });
      resetForm();
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
        description: "Failed to create chart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      clientName: "",
      birthDate: "",
      birthTime: "",
      birthPlace: "",
      locationId: null,
      notes: "",
      folderId: "",
    });
  };

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
    createChartMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Обработчик успешного создания папки
  const handleFolderCreated = () => {
    // Обновляем список папок и выбираем новую папку
    queryClient.invalidateQueries({ queryKey: ["/api/folders"] }).then(() => {
      // После обновления данных найдем самую новую папку и выберем её
      const updatedFolders = queryClient.getQueryData(["/api/folders"]) as Folder[] | undefined;
      if (updatedFolders && updatedFolders.length > 0) {
        // Сортируем по дате создания и берем последнюю
        const newestFolder = [...updatedFolders].sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )[0];
        handleInputChange("folderId", newestFolder.id);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Chart</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-4">Client Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client-name">Client Name *</Label>
                <Input
                  id="client-name"
                  type="text"
                  placeholder="Enter client's full name"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  required
                  data-testid="input-client-name"
                />
              </div>
              <div>
                <Label htmlFor="folder">Folder</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.folderId} 
                    onValueChange={(value) => handleInputChange("folderId", value)}
                  >
                    <SelectTrigger data-testid="select-folder" className="flex-1">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCreateFolderOpen(true)}
                    title="Создать новую папку"
                    data-testid="button-create-folder-inline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Birth Details */}
          <div>
            <h4 className="text-lg font-medium text-foreground mb-4">Birth Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth-date">Birth Date *</Label>
                <Input
                  id="birth-date"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                  required
                  data-testid="input-birth-date"
                />
              </div>
              <div>
                <Label htmlFor="birth-time">Birth Time *</Label>
                <Input
                  id="birth-time"
                  type="time"
                  value={formData.birthTime}
                  onChange={(e) => handleInputChange("birthTime", e.target.value)}
                  required
                  data-testid="input-birth-time"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="birth-place">Место рождения *</Label>
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
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this chart..."
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              data-testid="textarea-notes"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-chart"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createChartMutation.isPending}
              data-testid="button-create-chart"
            >
              {createChartMutation.isPending ? "Creating..." : "Create Chart"}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Диалог создания папки */}
      <CreateFolderDialog 
        open={createFolderOpen} 
        onOpenChange={setCreateFolderOpen}
        onSuccess={handleFolderCreated}
      />
    </Dialog>
  );
}
