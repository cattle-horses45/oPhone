export interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  is_human: boolean;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  sender_type: 'user' | 'bot' | 'human';
  content: string;
  created_at: string;
}

export interface ChatSessionCreate {
  title?: string;
}

export interface ChatMessageCreate {
  content: string;
}
