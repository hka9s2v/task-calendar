export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 繰り返し設定
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'biweekly' | null;
  dueDate?: string | null;
  weekDays?: string | null; // "1,3,5" for 月水金
  monthDay?: number | null; // 1-31
  biweeklyStart?: string | null;
  
  // 完了履歴管理
  lastCompleted?: string | null;
  isRecurring: boolean;
}

export interface CreateTodoRequest {
  title: string;
  repeatType?: 'daily' | 'weekly' | 'monthly' | 'biweekly';
  weekDays?: number[]; // [1, 3, 5] for 月水金
  monthDay?: number; // 1-31
  biweeklyStart?: string;
} 