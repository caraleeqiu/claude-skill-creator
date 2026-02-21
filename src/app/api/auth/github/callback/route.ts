import { NextResponse } from "next/server";

// GitHub OAuth 回调
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
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
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
    });

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

    // 重定向回首页，带上 token 和用户信息（通过 URL hash，不会发送到服务器）
    const redirectUrl = `${baseUrl}/#token=${accessToken}&user=${encodeURIComponent(userData.login || "")}&avatar=${encodeURIComponent(userData.avatar_url || "")}`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_failed`);
  }
}
