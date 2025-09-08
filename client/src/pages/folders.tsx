import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import FolderCard from "@/components/folders/folder-card";
import CreateFolderDialog from "@/components/folders/create-folder-dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Folder } from "@shared/schema";

export default function Folders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

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

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Folders</h2>
              <p className="text-muted-foreground">Organize your charts into folders</p>
            </div>
            <Button 
              onClick={() => setCreateFolderOpen(true)}
              data-testid="button-new-folder"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {foldersLoading ? (
              <div className="text-muted-foreground">Loading folders...</div>
            ) : folders.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground mb-4">
                  No folders yet. Create your first folder to organize your charts!
                </div>
                <Button onClick={() => setCreateFolderOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Folder
                </Button>
              </div>
            ) : (
              folders.map((folder) => (
                <FolderCard key={folder.id} folder={folder} />
              ))
            )}
          </div>
        </main>
      </div>

      <CreateFolderDialog 
        open={createFolderOpen} 
        onOpenChange={setCreateFolderOpen}
      />
    </div>
  );
}
