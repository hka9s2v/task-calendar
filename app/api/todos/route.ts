import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// 配列を文字列に変換するヘルパー関数
function arrayToString(arr: number[]): string {
  return arr.join(',');
}

// 文字列を配列に変換するヘルパー関数
function stringToArray(str: string): number[] {
  return str.split(',').map(Number).filter(n => !isNaN(n));
}

// タスクが今日実行すべきかチェックする関数
function shouldShowToday(todo: any): boolean {
  if (!todo.isRecurring) {
    // 一回限りのタスクは期日が今日以前かつ未完了なら表示
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today && !todo.completed;
    }
    return !todo.completed;
  }

  const today = new Date();
  const todayDay = today.getDay(); // 0=日曜日, 1=月曜日, ...
  const todayDate = today.getDate(); // 1-31
  
  // 最後に完了した日をチェック
  if (todo.lastCompleted) {
    const lastCompleted = new Date(todo.lastCompleted);
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    // 今日既に完了している場合は表示しない
    if (lastCompleted >= todayStart) {
      return false;
    }
  }

  switch (todo.repeatType) {
    case 'daily':
      return true;
    
    case 'weekly':
      if (todo.weekDays && Array.isArray(todo.weekDays) && todo.weekDays.length > 0) {
        return todo.weekDays.includes(todayDay);
      }
      return false;
    
    case 'monthly':
      return todo.monthDay === todayDate;
    
    case 'biweekly':
      if (todo.biweeklyStart) {
        const startDate = new Date(todo.biweeklyStart);
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % 14 === 0;
      }
      return false;
    
    default:
      return false;
  }
}

// GET /api/todos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    let todos = await prisma.todo.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // weekDaysを文字列から配列に変換
    const todosWithArrays = todos.map(todo => ({
      ...todo,
      weekDays: todo.weekDays ? stringToArray(todo.weekDays) : null
    }));

    if (filter === 'today') {
      return NextResponse.json(todosWithArrays.filter(shouldShowToday));
    } else if (filter === 'upcoming') {
      return NextResponse.json(todosWithArrays.filter(todo => !shouldShowToday(todo)));
    }

    return NextResponse.json(todosWithArrays);
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

// POST /api/todos
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, repeatType, weekDays, monthDay, biweeklyStart, dueDate } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        userId: session.user.id,
        repeatType: repeatType || null,
        weekDays: weekDays && Array.isArray(weekDays) && weekDays.length > 0 ? arrayToString(weekDays) : null,
        monthDay: monthDay || null,
        biweeklyStart: biweeklyStart ? new Date(biweeklyStart) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        isRecurring: Boolean(repeatType),
      },
    });

    // レスポンス時にweekDaysを配列に変換
    const responseData = {
      ...todo,
      weekDays: todo.weekDays ? stringToArray(todo.weekDays) : null
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Failed to create todo:', error);
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
} 