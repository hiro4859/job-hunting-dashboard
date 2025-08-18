// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // ✅ Production のときだけ認証を有効化
  const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (!isProd) {
    return NextResponse.next();
  }

  const user = process.env.BASIC_AUTH_USER ?? "";
  const pass = process.env.BASIC_AUTH_PASS ?? "";
  if (!user || !pass) {
    // 環境変数が未設定ならスキップ
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");

  if (!auth?.startsWith("Basic ")) {
    return new Response("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
    });
  }

  const [, encoded] = auth.split(" ");
  const [inUser, inPass] = Buffer.from(encoded, "base64").toString("utf8").split(":");

  if (inUser === user && inPass === pass) {
    // 認証成功
    return NextResponse.next();
  }

  // 認証失敗
  return new Response("Forbidden", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}

// ✅ 静的ファイルや画像には認証をかけない設定
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
