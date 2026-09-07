export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed';

export interface TinyProject {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  budget?: number;
  startDate?: string;
  deadline?: string;
  managerId?: string;
  peopleIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  project: TinyProject;
  openTasks: number;
  riskCount: number;
  healthScore?: number;
}
