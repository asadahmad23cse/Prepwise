import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

export async function getOrCreateDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await db.user.findUnique({ where: { clerkId } });

  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    user = await db.user.create({
      data: {
        clerkId,
        email:
          clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
        creditBalance: 10,
      },
    });
  }

  return user;
}
