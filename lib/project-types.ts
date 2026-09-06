export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  workspaceDir: string;
  detectedStack: Array<{ name: string; confidence: 'high' | 'medium'; evidence: string[] }>;
  fileCount: number;
  createdAt: string;
  updatedAt: string;
}
