// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const SKIP_PATHS = [
  "/favicon.ico", "/robots.txt", "/sitemap.xml",
];

function shouldSkip(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/public/")) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (SKIP_PATHS.includes(pathname)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  if (shouldSkip(req)) return NextResponse.next();

  const USER = process.env.BASIC_AUTH_USER || "friend";
  const PASS = process.env.BASIC_AUTH_PASSWORD || "mypassword";

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, value] = auth.split(" ");
    if (scheme === "Basic" && value) {
      const [user, pass] = Buffer.from(value, "base64").toString().split(":");
      if (user === USER && pass === PASS) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": "Basic realm=\"Secure Area\"" },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|public).*)",
  ],
};
