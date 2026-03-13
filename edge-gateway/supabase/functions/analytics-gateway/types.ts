// types.ts
export interface Project {
  id: number;
  name: string;
  api_key: string;
}

export interface LogEntry {
  region: string;
  latency: number;
  project_id: number;
}
