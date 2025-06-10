import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // トリムして空白チェック
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim().toLowerCase(); // 小文字で正規化
    const trimmedPassword = password?.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: '名前、メールアドレス、パスワードは必須です' },
        { status: 400 }
      );
    }

    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの重複確認（事前に小文字化）
    const existingUser = await prisma.user.findUnique({
      where: { 
        email: trimmedEmail
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(trimmedPassword, 12);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        password: hashedPassword,
      },
    });

    // パスワードを除いてレスポンス
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'アカウントが正常に作成されました',
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'アカウント作成に失敗しました' },
      { status: 500 }
    );
  }
} 