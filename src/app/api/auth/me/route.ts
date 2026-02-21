import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// 获取当前登录用户信息
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("github_user");
    const tokenCookie = cookieStore.get("github_token");

    if (!userCookie || !tokenCookie) {
      return NextResponse.json(null, { status: 401 });
    }

    // 验证 token 是否仍然有效
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
        "User-Agent": "Claude-Skill-Creator",
      },
    });

    if (!userResponse.ok) {
      // Token 无效，清除 cookies
      cookieStore.delete("github_token");
      cookieStore.delete("github_user");
      return NextResponse.json(null, { status: 401 });
    }

    const userData = await userResponse.json();

    return NextResponse.json({
      login: userData.login,
      avatar: userData.avatar_url,
    });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
