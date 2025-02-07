export interface ToolResult {
  [key: string]: unknown;
  content: Array<{
    type: 'text';
    text: string;
    [key: string]: unknown;
  }>;
  isError?: boolean;
}

export interface NileDatabase {
  apiHost: string;
  id: string;
  name: string;
  region: 'AWS_US_WEST_2' | 'AWS_EU_CENTRAL_1';
  status: 'PENDING' | 'REQUESTED' | 'BUILT' | 'READY';
  workspace: {
    name: string;
    slug: string;
    created?: string;
    id?: string;
    stripe_customer_id?: string;
  };
  dbHost?: string;
}

export interface NileError {
  error: string;
  message: string;
  status: number;
}

export interface DatabaseCredential {
  id: string;
  username: string;
  password?: string;  // Only present in create response
  created: string;
}

export interface SqlQueryResult {
  rows: Record<string, any>[];
  rowCount: number | null;
  fields: Array<{
    name: string;
    dataTypeID: number;
  }>;
}

export interface SqlQueryError extends NileError {
  code?: string;
  position?: string;
  detail?: string;
  hint?: string;
} 