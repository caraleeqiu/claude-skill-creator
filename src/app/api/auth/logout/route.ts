import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// 退出登录 - 清除认证 cookies
export async function POST() {
  try {
    const cookieStore = await cookies();

    // 删除 token cookie
    cookieStore.delete("github_token");

    // 删除 user info cookie
    cookieStore.delete("github_user");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
