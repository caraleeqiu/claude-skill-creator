import { NextResponse } from "next/server";

// GitHub OAuth 登录入口
export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID." },
      { status: 500 }
    );
  }

  // 获取当前域名
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const callbackUrl = `${baseUrl}/api/auth/github/callback`;

  // 构建 GitHub OAuth URL
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  githubAuthUrl.searchParams.set("scope", "repo");
  githubAuthUrl.searchParams.set("state", baseUrl);

  return NextResponse.redirect(githubAuthUrl.toString());
}
