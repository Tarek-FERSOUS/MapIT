import {
  Asset,
  Problem,
  Relationship,
  UserSettings
} from "@/types/api";

// Mock data generators
const generateMockAssets = (): Asset[] => [
  {
    id: "asset-1",
    name: "Production DB Server",
    type: "server",
    ipAddress: "192.168.1.10",
    location: "Data Center A",
    status: "online",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "asset-2",
    name: "Web Server VM",
    type: "vm",
    ipAddress: "192.168.1.20",
    location: "Cloud",
    status: "online",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "asset-3",
    name: "Network Switch",
    type: "network-device",
    ipAddress: "192.168.1.1",
    location: "Data Center A",
    status: "online",
    lastUpdated: new Date().toISOString()
  }
];

const generateMockProblems = (): Problem[] => [
  {
    id: "prob-1",
    title: "High CPU Usage on Web Server",
    description: "CPU utilization consistently above 85%",
    affectedAssets: ["asset-2"],
    severity: "high",
    status: "in-progress",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    solution:
      "Increase VM resources and optimize application queries. Consider load balancing."
  },
  {
    id: "prob-2",
    title: "Database Connection Pool Exhaustion",
    description: "Connection pool reaching capacity during peak hours",
    affectedAssets: ["asset-1"],
    severity: "critical",
    status: "open",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const generateMockRelationships = (): Relationship[] => [
  {
    id: "rel-1",
    sourceAssetId: "asset-2",
    targetAssetId: "asset-1",
    relationshipType: "depends-on",
    label: "connects to"
  },
  {
    id: "rel-2",
    sourceAssetId: "asset-3",
    targetAssetId: "asset-1",
    relationshipType: "communicates-with",
    label: "routes traffic"
  }
];

const generateMockSettings = (): UserSettings => ({
  notifications: {
    email: true,
    inApp: true,
    critical: true
  },
  theme: "light"
});

export const mockAdapters = {
  assets: generateMockAssets(),
  problems: generateMockProblems(),
  relationships: generateMockRelationships(),
  settings: generateMockSettings()
};

export class MockApiService {
  static getAssets = async (): Promise<Asset[]> => mockAdapters.assets;

  static getAssetById = async (id: string): Promise<Asset | undefined> =>
    mockAdapters.assets.find((a) => a.id === id);

  static getProblems = async (): Promise<Problem[]> => mockAdapters.problems;

  static getProblemById = async (id: string): Promise<Problem | undefined> =>
    mockAdapters.problems.find((p) => p.id === id);

  static getRelationships = async (): Promise<Relationship[]> =>
    mockAdapters.relationships;

  static getRelationshipsByAsset = async (
    assetId: string
  ): Promise<Relationship[]> =>
    mockAdapters.relationships.filter(
      (r) => r.sourceAssetId === assetId || r.targetAssetId === assetId
    );

  static getSettings = async (): Promise<UserSettings> =>
    mockAdapters.settings;

  static updateSettings = async (
    settings: Partial<UserSettings>
  ): Promise<UserSettings> => ({
    ...mockAdapters.settings,
    ...settings
  });
}
