import {
  users,
  folders,
  charts,
  locations,
  type User,
  type UpsertUser,
  type Folder,
  type InsertFolder,
  type Chart,
  type InsertChart,
  type Location,
  type InsertLocation,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Folder operations
  getFoldersByUserId(userId: string): Promise<Folder[]>;
  createFolder(folder: InsertFolder & { userId: string }): Promise<Folder>;
  updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<boolean>;
  
  // Location operations
  getLocationById(id: string): Promise<Location | undefined>;
  searchLocations(query: string): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Chart operations
  getChartsByUserId(userId: string): Promise<Chart[]>;
  getChartsByFolderId(folderId: string): Promise<Chart[]>;
  getChart(id: string): Promise<Chart | undefined>;
  createChart(chart: InsertChart & { userId: string }): Promise<Chart>;
  updateChart(id: string, updates: Partial<Chart>): Promise<Chart | undefined>;
  deleteChart(id: string): Promise<boolean>;
  searchChartsByName(userId: string, query: string): Promise<Chart[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private folders: Map<string, Folder>;
  private charts: Map<string, Chart>;
  private locations: Map<string, Location>;

  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.charts = new Map();
    this.locations = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      ...userData,
      id: userData.id || randomUUID(),
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    } as User;
    this.users.set(user.id, user);
    return user;
  }

  // Folder operations
  async getFoldersByUserId(userId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(folder => folder.userId === userId);
  }

  async createFolder(folderData: InsertFolder & { userId: string }): Promise<Folder> {
    const folder: Folder = {
      ...folderData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.folders.set(folder.id, folder);
    return folder;
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (!folder) return undefined;
    
    const updatedFolder = { ...folder, ...updates, updatedAt: new Date() };
    this.folders.set(id, updatedFolder);
    return updatedFolder;
  }

  async deleteFolder(id: string): Promise<boolean> {
    return this.folders.delete(id);
  }

  // Location operations
  async getLocationById(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async searchLocations(query: string): Promise<Location[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.locations.values()).filter(location =>
      location.name.toLowerCase().includes(lowerQuery) ||
      location.displayName.toLowerCase().includes(lowerQuery)
    );
  }

  async createLocation(locationData: InsertLocation): Promise<Location> {
    const location: Location = {
      ...locationData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.locations.set(location.id, location);
    return location;
  }

  // Chart operations
  async getChartsByUserId(userId: string): Promise<Chart[]> {
    return Array.from(this.charts.values()).filter(chart => chart.userId === userId);
  }

  async getChartsByFolderId(folderId: string): Promise<Chart[]> {
    return Array.from(this.charts.values()).filter(chart => chart.folderId === folderId);
  }

  async getChart(id: string): Promise<Chart | undefined> {
    return this.charts.get(id);
  }

  async createChart(chartData: InsertChart & { userId: string }): Promise<Chart> {
    const chart: Chart = {
      ...chartData,
      notes: chartData.notes || null,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.charts.set(chart.id, chart);
    return chart;
  }

  async updateChart(id: string, updates: Partial<Chart>): Promise<Chart | undefined> {
    const chart = this.charts.get(id);
    if (!chart) return undefined;
    
    const updatedChart = { ...chart, ...updates, updatedAt: new Date() };
    this.charts.set(id, updatedChart);
    return updatedChart;
  }

  async deleteChart(id: string): Promise<boolean> {
    return this.charts.delete(id);
  }

  async searchChartsByName(userId: string, query: string): Promise<Chart[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.charts.values()).filter(
      chart => chart.userId === userId && 
      chart.clientName.toLowerCase().includes(lowerQuery)
    );
  }
}

export const storage = new MemStorage();
