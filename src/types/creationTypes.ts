export interface StreamChatResponse {
  type: 'text' | 'mindmap_update' | 'suggested_replies';
  content?: string;
  mindmapData?: Record<string, unknown>;
  suggestions?: string[];
}

export interface MaterialGenerationRequest {
  types: string[]; // 'ppt', 'doc', 'video', 'html'
}

export interface MindMapCrudRequest {
  action: 'add' | 'update' | 'delete' | 'query';
  nodeData?: Record<string, unknown>;
  nodeId?: string;
}

export interface MindMapCrudResponse {
  mindmapData: Record<string, unknown>;
}

export interface MaterialUrlResponse {
  url: string;
}
