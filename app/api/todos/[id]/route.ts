import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// 文字列を配列に変換するヘルパー関数
function stringToArray(str: string): number[] {
  return str.split(',').map(Number).filter(n => !isNaN(n));
}

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/todos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const todo = await prisma.todo.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id 
      },
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // weekDaysを文字列から配列に変換
    const responseData = {
      ...todo,
      weekDays: todo.weekDays ? stringToArray(todo.weekDays) : null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch todo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
      { status: 500 }
    );
  }
}

// PATCH /api/todos/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, completed } = body;

    // 現在のタスクを取得（ユーザーのものかチェック）
    const currentTodo = await prisma.todo.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id 
      },
    });

    if (!currentTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    // 更新データを準備
    const updateData: any = {};
    
    if (title !== undefined) {
      updateData.title = title;
    }
    
    if (completed !== undefined) {
      updateData.completed = completed;
      
      // 完了にする場合、完了履歴を記録
      if (completed) {
        const now = new Date();
        updateData.lastCompleted = now;
        
        // 完了履歴テーブルに記録
        await prisma.completionHistory.upsert({
          where: {
            todoId_year_month_day: {
              todoId: params.id,
              year: now.getFullYear(),
              month: now.getMonth() + 1,
              day: now.getDate()
            }
          },
          update: {
            completedAt: now
          },
          create: {
            todoId: params.id,
            userId: session.user.id,
            completedAt: now,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate()
          }
        });
        
        // 繰り返しタスクの場合は完了状態をリセット
        if (currentTodo.isRecurring) {
          updateData.completed = false;
        }
      }
    }

    const todo = await prisma.todo.update({
      where: { id: params.id },
      data: updateData,
    });

    // weekDaysを文字列から配列に変換
    const responseData = {
      ...todo,
      weekDays: todo.weekDays ? stringToArray(todo.weekDays) : null
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to update todo:', error);
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // タスクがユーザーのものかチェック
    const todo = await prisma.todo.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id 
      },
    });

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      );
    }

    await prisma.todo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Failed to delete todo:', error);
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    );
  }
} 