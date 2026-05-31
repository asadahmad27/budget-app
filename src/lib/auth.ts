import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { seedUserDefaults } from "@/lib/budget";

export async function registerUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      name: input.name?.trim() || null,
      onboardingCompleted: false,
    },
  });

  await seedUserDefaults(user.id);
  return user;
}

export async function verifyUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email: normalized } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    onboardingCompleted: user.onboardingCompleted,
  };
}

export async function deleteUserAccount(userId: string, password: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Account not found");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Incorrect password");
  }

  await db.user.delete({ where: { id: userId } });
}
