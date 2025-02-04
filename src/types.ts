export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface NileDatabase {
  id: string;
  name: string;
  region: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NileError {
  error: string;
  message: string;
  status: number;
} 