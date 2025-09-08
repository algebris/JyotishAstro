import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Edit, Trash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ChartViewDialog from "./chart-view-dialog";
import type { Chart, Folder } from "@shared/schema";

interface ChartCardProps {
  chart: Chart;
}

export default function ChartCard({ chart }: ChartCardProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

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
                      data-testid="button-edit-chart"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
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
    </>
  );
}
