import { TodoList } from './components/TodoList';
import { AuthButton } from './components/AuthButton';
import { AuthGuard } from './components/AuthGuard';
import Link from 'next/link';

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダーセクション */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex justify-between items-center mb-6">
              <div></div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900">
                📅 Task Calendar
              </h1>
              <AuthButton />
            </div>
            <p className="text-lg md:text-xl text-blue-600 max-w-2xl mx-auto">
              効率的なタスク管理で、毎日をもっと生産的に。
              繰り返しタスクも簡単設定で継続的な習慣作りをサポートします。
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/calendar"
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                📊 達成状況カレンダー
              </Link>
            </div>
          </div>

          {/* TodoListコンポーネント */}
          <TodoList />
        </div>
      </div>
    </AuthGuard>
  );
} 