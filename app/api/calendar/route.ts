import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/calendar?year=2024&month=12
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month parameter' },
        { status: 400 }
      );
    }

    // ユーザーの全てのタスクと指定月の完了履歴を取得
    const todos = await prisma.todo.findMany({
      where: { userId: session.user.id },
      include: {
        completions: {
          where: {
            year,
            month,
            userId: session.user.id
          },
          orderBy: { day: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // カレンダー用データ構造に変換
    const calendarData = {
      year,
      month,
      todos: todos.map((todo: any) => ({
        id: todo.id,
        title: todo.title,
        isRecurring: todo.isRecurring,
        repeatType: todo.repeatType,
        weekDays: todo.weekDays,
        monthDay: todo.monthDay,
        completions: todo.completions.map((completion: any) => ({
          day: completion.day,
          completedAt: completion.completedAt.toISOString()
        }))
      }))
    };

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Failed to fetch calendar data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
} 