import { NextResponse } from "next/server";

// GitHub OAuth 回调
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?error=oauth_not_configured", request.url));
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
      return NextResponse.redirect(new URL(`/?error=${tokenData.error}`, request.url));
    }

    const accessToken = tokenData.access_token;

    // 获取用户信息
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    // 重定向回首页，带上 token 和用户信息（通过 URL hash，不会发送到服务器）
    const redirectUrl = new URL(state, request.url);
    redirectUrl.hash = `token=${accessToken}&user=${encodeURIComponent(userData.login)}&avatar=${encodeURIComponent(userData.avatar_url || "")}`;

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url));
  }
}
