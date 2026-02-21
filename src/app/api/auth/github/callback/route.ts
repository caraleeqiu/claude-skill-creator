import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GitHub OAuth 回调 - 使用 httpOnly cookie 存储 token
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // 获取基础 URL
  const baseUrl = state || `${url.protocol}//${url.host}`;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/?error=oauth_not_configured`);
  }

  try {
    // 用 code 换取 access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("OAuth token error:", tokenData);
      return NextResponse.redirect(`${baseUrl}/?error=${tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/?error=no_token`);
    }

    // 获取用户信息
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Claude-Skill-Creator",
      },
    });

    const userData = await userResponse.json();

    // 创建用户信息对象 (不包含 token)
    const userInfo = {
      login: userData.login || "",
      avatar: userData.avatar_url || "",
    };

    // 设置 httpOnly cookie 存储 token (服务端使用)
    const cookieStore = await cookies();

    // Token cookie - httpOnly, secure, sameSite
    cookieStore.set("github_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    // User info cookie - 可被客户端读取用于显示
    cookieStore.set("github_user", JSON.stringify(userInfo), {
      httpOnly: false, // 允许客户端读取
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    // 重定向回首页
    return NextResponse.redirect(baseUrl);
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_failed`);
  }
}
