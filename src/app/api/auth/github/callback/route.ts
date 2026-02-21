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

    // 使用安全的 HTML 页面来存储 token 到 localStorage，然后重定向
    const secureHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>登录成功</title>
  <style>
    body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #f97316; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p>登录成功，正在跳转...</p>
  </div>
  <script>
    try {
      const authData = {
        token: ${JSON.stringify(accessToken)},
        login: ${JSON.stringify(userData.login || "")},
        avatar: ${JSON.stringify(userData.avatar_url || "")},
        expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8 小时过期
      };
      localStorage.setItem('github_auth', JSON.stringify(authData));
      window.location.href = ${JSON.stringify(baseUrl)};
    } catch (e) {
      console.error('Failed to store auth:', e);
      window.location.href = ${JSON.stringify(baseUrl + "/?error=storage_failed")};
    }
  </script>
</body>
</html>`;

    return new NextResponse(secureHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_failed`);
  }
}
