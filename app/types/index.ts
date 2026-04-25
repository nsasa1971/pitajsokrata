export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  turnNumber?: number;
  isFinal?: boolean;
  insights?: string[];
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  isActive: boolean;
}

export interface SokratResponse {
  message: string;
  turn_number: number;
  is_final: boolean;
  insights: string[];
}