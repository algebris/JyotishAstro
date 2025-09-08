import { Card, CardContent } from "@/components/ui/card";
import { Folder as FolderIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Folder, Chart } from "@shared/schema";

interface FolderCardProps {
  folder: Folder;
}

export default function FolderCard({ folder }: FolderCardProps) {
  const { data: charts = [] } = useQuery<Chart[]>({
    queryKey: ["/api/charts", { folderId: folder.id }],
  });

  const chartCount = charts.length;
  const lastModified = folder.updatedAt 
    ? new Date(folder.updatedAt).toLocaleDateString()
    : "Never";

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      data-testid={`card-folder-${folder.id}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FolderIcon className="h-8 w-8 text-accent" />
          <div className="flex-1">
            <h4 className="font-semibold text-foreground" data-testid="text-folder-name">
              {folder.name}
            </h4>
            <p className="text-sm text-muted-foreground" data-testid="text-folder-chart-count">
              {chartCount} chart{chartCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground" data-testid="text-folder-updated">
          Updated {lastModified}
        </div>
      </CardContent>
    </Card>
  );
}
