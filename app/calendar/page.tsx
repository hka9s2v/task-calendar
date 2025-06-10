'use client';

import React, { useState, useEffect } from 'react';
import { AuthButton } from '../components/AuthButton';
import { AuthGuard } from '../components/AuthGuard';
import Link from 'next/link';

interface CompletionData {
  day: number;
  completedAt: string;
}

interface TodoCalendarData {
  id: string;
  title: string;
  isRecurring: boolean;
  repeatType?: string | null;
  weekDays?: string | null;
  monthDay?: number | null;
  completions: CompletionData[];
}

interface CalendarData {
  year: number;
  month: number;
  todos: TodoCalendarData[];
}

export default function CalendarPage() {
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/calendar?year=${currentYear}&month=${currentMonth}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }

      const data = await response.json();
      setCalendarData(data);
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return months[month - 1];
  };

  const isTaskCompletedOnDay = (todo: TodoCalendarData, day: number) => {
    return todo.completions.some(completion => completion.day === day);
  };

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center min-h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="mt-4 text-blue-600 font-medium text-center">読み込み中...</div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
          <div className="max-w-2xl mx-auto">
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
        </div>
      </AuthGuard>
    );
  }

  if (!calendarData) {
    return <AuthGuard><div></div></AuthGuard>;
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">
                  📅 タスク達成カレンダー
                </h1>
                <p className="text-blue-600">
                  タスクの達成状況を月ごとに可視化して確認できます
                </p>
              </div>
              <div className="flex items-center gap-4">
                <AuthButton />
                <Link 
                  href="/" 
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200 text-center"
                >
                  ← タスク一覧に戻る
                </Link>
              </div>
            </div>
          </div>

          {/* 月ナビゲーション */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                  {currentYear}年 {getMonthName(currentMonth)}
                </h2>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium"
                >
                  今月
                </button>
              </div>
              
              <button
                onClick={() => navigateMonth(1)}
                className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* カレンダーテーブル */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold text-lg border-r border-blue-500">
                      タスク
                    </th>
                    {days.map(day => (
                      <th key={day} className="px-2 py-4 text-center font-bold min-w-[40px] border-r border-blue-500 last:border-r-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calendarData.todos.length === 0 ? (
                    <tr>
                      <td colSpan={daysInMonth + 1} className="px-6 py-12 text-center text-blue-600">
                        <div className="text-6xl mb-4">📝</div>
                        <div className="text-xl font-medium">タスクがありません</div>
                        <div className="text-sm mt-2">まずはタスクを作成してみましょう</div>
                      </td>
                    </tr>
                  ) : (
                    calendarData.todos.map((todo, index) => (
                      <tr 
                        key={todo.id} 
                        className={`border-b border-blue-100 hover:bg-blue-50 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-blue-25'
                        }`}
                      >
                        <td className="px-4 py-4 border-r border-blue-100">
                          <div className="font-medium text-blue-900 mb-1">
                            {todo.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              todo.isRecurring 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {todo.isRecurring ? '🔄 繰り返し' : '📅 一回限り'}
                            </span>
                          </div>
                        </td>
                        {days.map(day => (
                          <td key={day} className="px-2 py-4 text-center border-r border-blue-100 last:border-r-0">
                            {isTaskCompletedOnDay(todo, day) ? (
                              <div className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                                <span className="text-gray-400">—</span>
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 凡例 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h3 className="text-lg font-bold text-blue-900 mb-4">凡例</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-blue-900">完了済み</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                  <span className="text-gray-400">—</span>
                </div>
                <span className="text-blue-900">未完了</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 