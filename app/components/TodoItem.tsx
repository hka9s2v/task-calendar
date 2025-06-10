'use client';

import React, { useState } from 'react';
import { Todo } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle.trim() !== todo.title) {
      onEdit(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 md:p-6 border-l-4 ${
      todo.completed ? 'border-green-400 bg-green-50' : 'border-blue-400'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* チェックボックス */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onToggle(todo.id)}
            className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
              todo.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
          >
            {todo.completed && (
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* タスク内容 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-blue-900 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className={`text-lg md:text-xl font-medium transition-all duration-200 ${
                todo.completed 
                  ? 'text-green-700 line-through opacity-75' 
                  : 'text-blue-900'
              }`}>
                {todo.title}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-sm text-blue-600">
                <span className="flex items-center">
                  <span className="mr-1">📅</span>
                  作成: {formatDate(todo.createdAt)}
                </span>
                {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
                  <span className="flex items-center">
                    <span className="mr-1">✏️</span>
                    更新: {formatDate(todo.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        {!isEditing && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 md:p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="編集"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="p-2 md:p-3 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 完了ステータスバッジ */}
      {todo.completed && (
        <div className="mt-4 flex justify-start">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-green-100 text-green-800">
            <span className="mr-1">✅</span>
            完了済み
          </span>
        </div>
      )}
    </div>
  );
}; 