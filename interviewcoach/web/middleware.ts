import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/features",
  "/pricing",
  "/reviews",
  "/faq",
  "/desktop",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  const session = await auth();

  if (!session.userId) {
    return session.redirectToSignIn();
  }

  if (isAdminRoute(request)) {
    const role = (session.sessionClaims?.metadata as { role?: string })?.role;
    if (role !== "admin") {
      return Response.redirect(new URL("/dashboard", request.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
