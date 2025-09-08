import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertFolderSchema, insertChartSchema, insertLocationSchema } from "@shared/schema";
import { geocodingService } from "./geocoding";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Folder routes
  app.get('/api/folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folders = await storage.getFoldersByUserId(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Failed to fetch folders" });
    }
  });

  app.post('/api/folders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder({ ...folderData, userId });
      res.status(201).json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      } else {
        console.error("Error creating folder:", error);
        res.status(500).json({ message: "Failed to create folder" });
      }
    }
  });

  app.put('/api/folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFolder(id, updates);
      if (!folder) {
        res.status(404).json({ message: "Folder not found" });
        return;
      }
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid folder data", errors: error.errors });
      } else {
        console.error("Error updating folder:", error);
        res.status(500).json({ message: "Failed to update folder" });
      }
    }
  });

  app.delete('/api/folders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFolder(id);
      if (!deleted) {
        res.status(404).json({ message: "Folder not found" });
        return;
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  // Chart routes
  app.get('/api/charts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { folderId, search } = req.query;
      
      let charts;
      if (search) {
        charts = await storage.searchChartsByName(userId, search as string);
      } else if (folderId && folderId !== 'undefined') {
        charts = await storage.getChartsByFolderId(folderId as string);
      } else {
        charts = await storage.getChartsByUserId(userId);
      }
      
      res.json(charts);
    } catch (error) {
      console.error("Error fetching charts:", error);
      res.status(500).json({ message: "Failed to fetch charts" });
    }
  });

  app.get('/api/charts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const chart = await storage.getChart(id);
      if (!chart) {
        res.status(404).json({ message: "Chart not found" });
        return;
      }
      res.json(chart);
    } catch (error) {
      console.error("Error fetching chart:", error);
      res.status(500).json({ message: "Failed to fetch chart" });
    }
  });

  app.post('/api/charts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chartData = insertChartSchema.parse(req.body);
      const chart = await storage.createChart({ ...chartData, userId });
      res.status(201).json(chart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid chart data", errors: error.errors });
      } else {
        console.error("Error creating chart:", error);
        res.status(500).json({ message: "Failed to create chart" });
      }
    }
  });

  app.put('/api/charts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertChartSchema.partial().parse(req.body);
      const chart = await storage.updateChart(id, updates);
      if (!chart) {
        res.status(404).json({ message: "Chart not found" });
        return;
      }
      res.json(chart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid chart data", errors: error.errors });
      } else {
        console.error("Error updating chart:", error);
        res.status(500).json({ message: "Failed to update chart" });
      }
    }
  });

  app.delete('/api/charts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteChart(id);
      if (!deleted) {
        res.status(404).json({ message: "Chart not found" });
        return;
      }
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting chart:", error);
      res.status(500).json({ message: "Failed to delete chart" });
    }
  });

  // Location routes
  app.get('/api/locations/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.json([]);
        return;
      }

      // Сначала ищем в локальной базе
      const localResults = await storage.searchLocations(query as string);
      
      // Если найдено менее 3 результатов, ищем через геокодинг API
      if (localResults.length < 3) {
        const geoResults = await geocodingService.searchPlaces(query as string, 5);
        
        // Создаем локации для новых результатов
        const newLocations = [];
        for (const result of geoResults) {
          try {
            const timezone = await geocodingService.getTimezone(result.latitude, result.longitude);
            
            const location = await storage.createLocation({
              name: result.name,
              displayName: result.displayName,
              latitude: result.latitude.toString(),
              longitude: result.longitude.toString(),
              timezone: timezone.timezone,
              utcOffset: timezone.utcOffset,
              country: result.country || null,
              region: result.region || null,
            });
            
            newLocations.push(location);
          } catch (error) {
            console.error('Error creating location:', error);
          }
        }
        
        // Объединяем результаты, избегая дубликатов
        const allResults = [...localResults];
        for (const newLoc of newLocations) {
          const isDuplicate = allResults.some(existing => 
            Math.abs(parseFloat(existing.latitude) - parseFloat(newLoc.latitude)) < 0.01 &&
            Math.abs(parseFloat(existing.longitude) - parseFloat(newLoc.longitude)) < 0.01
          );
          if (!isDuplicate) {
            allResults.push(newLoc);
          }
        }
        
        res.json(allResults.slice(0, 10));
      } else {
        res.json(localResults.slice(0, 10));
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      res.status(500).json({ message: "Failed to search locations" });
    }
  });

  app.get('/api/locations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const location = await storage.getLocationById(id);
      if (!location) {
        res.status(404).json({ message: "Location not found" });
        return;
      }
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  // Stats route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [folders, charts] = await Promise.all([
        storage.getFoldersByUserId(userId),
        storage.getChartsByUserId(userId)
      ]);

      const thisMonth = new Date();
      thisMonth.setMonth(thisMonth.getMonth());
      const chartsThisMonth = charts.filter(chart => 
        chart.createdAt && new Date(chart.createdAt) >= thisMonth
      ).length;

      res.json({
        totalCharts: charts.length,
        totalFolders: folders.length,
        totalClients: new Set(charts.map(chart => chart.clientName)).size,
        thisMonth: chartsThisMonth
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
