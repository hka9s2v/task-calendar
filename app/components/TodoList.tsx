'use client';

import React, { useState, useEffect } from 'react';
import { Todo, CreateTodoRequest } from '../types/todo';
import { TodoItem } from './TodoItem';

export const TodoList = () => {
  const [todayTodos, setTodayTodos] = useState<Todo[]>([]);
  const [upcomingTodos, setUpcomingTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly' | 'monthly' | 'biweekly' | ''>('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState<number>(1);
  const [biweeklyStart, setBiweeklyStart] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      
      // 今日のタスクと今後のタスクを並行取得
      const [todayResponse, upcomingResponse] = await Promise.all([
        fetch('/api/todos?filter=today'),
        fetch('/api/todos?filter=upcoming')
      ]);

      if (!todayResponse.ok || !upcomingResponse.ok) {
        throw new Error('Failed to fetch todos');
      }

      const todayData = await todayResponse.json();
      const upcomingData = await upcomingResponse.json();

      setTodayTodos(Array.isArray(todayData) ? todayData : []);
      setUpcomingTodos(Array.isArray(upcomingData) ? upcomingData : []);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch todos');
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim()) {
      try {
        const requestData: CreateTodoRequest = {
          title: newTodoTitle.trim()
        };

        if (repeatType) {
          requestData.repeatType = repeatType;
          
          switch (repeatType) {
            case 'weekly':
              if (selectedWeekDays.length > 0) {
                requestData.weekDays = selectedWeekDays;
              }
              break;
            case 'monthly':
              requestData.monthDay = monthDay;
              break;
            case 'biweekly':
              if (biweeklyStart) {
                requestData.biweeklyStart = biweeklyStart;
              }
              break;
          }
        }

        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          throw new Error('Failed to add todo');
        }

        // フォームをリセット
        setNewTodoTitle('');
        setRepeatType('');
        setSelectedWeekDays([]);
        setMonthDay(1);
        setBiweeklyStart('');
        setShowAdvanced(false);
        
        // タスクリストを再取得
        fetchTodos();
      } catch (error) {
        console.error('Failed to add todo:', error);
        setError(error instanceof Error ? error.message : 'Failed to add todo');
      }
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to toggle todo');
      }
      // タスクリストを再取得
      fetchTodos();
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      setError(error instanceof Error ? error.message : 'Failed to toggle todo');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }
      fetchTodos();
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete todo');
    }
  };

  const editTodo = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) {
        throw new Error('Failed to edit todo');
      }
      fetchTodos();
    } catch (error) {
      console.error('Failed to edit todo:', error);
      setError(error instanceof Error ? error.message : 'Failed to edit todo');
    }
  };

  const handleWeekDayToggle = (day: number) => {
    setSelectedWeekDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const getWeekDayName = (day: number) => {
    const names = ['日', '月', '火', '水', '木', '金', '土'];
    return names[day];
  };

  const getRepeatTypeLabel = (todo: Todo) => {
    if (!todo.isRecurring) return '一回限り';
    
    switch (todo.repeatType) {
      case 'daily':
        return '毎日';
      case 'weekly':
        if (todo.weekDays && Array.isArray(todo.weekDays) && todo.weekDays.length > 0) {
          const days = todo.weekDays.map(getWeekDayName);
          return `毎週 ${days.join('・')}曜日`;
        }
        return '毎週';
      case 'monthly':
        return `毎月${todo.monthDay}日`;
      case 'biweekly':
        return '隔週';
      default:
        return '不明';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="mt-4 text-blue-600 font-medium text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg" role="alert">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-red-800 font-medium">エラーが発生しました</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalTodos = todayTodos.length + upcomingTodos.length;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      {/* タスク追加フォーム */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-6 flex items-center">
          <span className="mr-3">➕</span>
          新しいタスクを追加
        </h2>
        
        <form onSubmit={addTodo} className="space-y-6">
          {/* タスクタイトル */}
          <div>
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="タスクの内容を入力してください..."
              className="w-full px-4 py-3 md:py-4 text-lg border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-blue-300"
            />
          </div>

          {/* 繰り返し設定 */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <label className="text-blue-900 font-medium">繰り返し設定:</label>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                {showAdvanced ? '簡易モード' : '詳細設定'}
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setRepeatType('')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      repeatType === '' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    一回限り
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType('daily')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      repeatType === 'daily' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    毎日
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType('weekly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      repeatType === 'weekly' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    毎週
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatType('monthly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      repeatType === 'monthly' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    毎月
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setRepeatType('biweekly')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      repeatType === 'biweekly' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    隔週（2週間ごと）
                  </button>
                </div>

                {/* 毎週の曜日選択 */}
                {repeatType === 'weekly' && (
                  <div>
                    <label className="block text-blue-800 font-medium mb-2">曜日を選択:</label>
                    <div className="grid grid-cols-7 gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleWeekDayToggle(day)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            selectedWeekDays.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {getWeekDayName(day)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 毎月の日付選択 */}
                {repeatType === 'monthly' && (
                  <div>
                    <label className="block text-blue-800 font-medium mb-2">日付を選択:</label>
                    <select
                      value={monthDay}
                      onChange={(e) => setMonthDay(Number(e.target.value))}
                      className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}日</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 隔週の開始日選択 */}
                {repeatType === 'biweekly' && (
                  <div>
                    <label className="block text-blue-800 font-medium mb-2">開始日を選択:</label>
                    <input
                      type="date"
                      value={biweeklyStart}
                      onChange={(e) => setBiweeklyStart(e.target.value)}
                      className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 md:py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <span className="flex items-center justify-center">
              <span className="mr-2">📝</span>
              タスクを追加
            </span>
          </button>
        </form>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 text-center">
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{totalTodos}</div>
          <div className="text-blue-800 font-medium mt-1">総タスク数</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 text-center">
          <div className="text-2xl md:text-3xl font-bold text-orange-500">{todayTodos.length}</div>
          <div className="text-blue-800 font-medium mt-1">今日のタスク</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 text-center">
          <div className="text-2xl md:text-3xl font-bold text-green-500">{upcomingTodos.length}</div>
          <div className="text-blue-800 font-medium mt-1">今後のタスク</div>
        </div>
      </div>

      {/* 今日のタスク */}
      {todayTodos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 flex items-center">
            <span className="mr-3">🗓️</span>
            今日のタスク ({todayTodos.length})
          </h3>
          <div className="space-y-3">
            {todayTodos.map((todo) => (
              <div key={todo.id} className="relative">
                <TodoItem
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                />
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getRepeatTypeLabel(todo)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 今後のタスク */}
      {upcomingTodos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 flex items-center">
            <span className="mr-3">📅</span>
            今後のタスク ({upcomingTodos.length})
          </h3>
          <div className="space-y-3">
            {upcomingTodos.map((todo) => (
              <div key={todo.id} className="relative">
                <TodoItem
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                />
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {getRepeatTypeLabel(todo)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状態 */}
      {totalTodos === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center">
          <div className="text-6xl md:text-8xl mb-6">📝</div>
          <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-4">
            まだタスクがありません
          </h3>
          <p className="text-blue-600 text-lg mb-6">
            上のフォームから最初のタスクを追加してみましょう！
          </p>
          <div className="inline-block bg-blue-100 text-blue-800 px-6 py-3 rounded-full font-medium">
            💡 繰り返し機能でルーティンを効率化しよう
          </div>
        </div>
      )}
    </div>
  );
}; 