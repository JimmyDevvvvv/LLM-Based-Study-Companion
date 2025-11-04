export interface Message {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  task?: string;
  isProcessing?: boolean;
  isError?: boolean;
}

export interface Option {
  label: string;
  task: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages?: Message[];
}

export interface GradingResult {
  grade?: number;
  feedback?: string;
  detected_issues?: string[];
  strengths?: string[];
}
