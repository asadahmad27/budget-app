import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicPaths = ["/login", "/register"];
const onboardingPath = "/onboarding";

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "budget-app-dev-secret-change-in-production",
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isOnboarding = pathname.startsWith(onboardingPath);
  const token = request.cookies.get("budget_session")?.value;

  let isAuthenticated = false;
  let onboardingCompleted: boolean | undefined;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      isAuthenticated = true;
      if (typeof payload.onboardingCompleted === "boolean") {
        onboardingCompleted = payload.onboardingCompleted;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  const needsOnboarding = onboardingCompleted === false;

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && needsOnboarding && !isOnboarding) {
    return NextResponse.redirect(new URL(onboardingPath, request.url));
  }

  if (isAuthenticated && !needsOnboarding && isOnboarding) {
    return NextResponse.redirect(new URL("/months", request.url));
  }

  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(
      new URL(needsOnboarding ? onboardingPath : "/months", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
