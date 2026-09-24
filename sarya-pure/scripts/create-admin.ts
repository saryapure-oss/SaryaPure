/**
 * Creates (or promotes) the first SUPER_ADMIN account.
 * Usage:
 *   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='a-strong-password' ADMIN_NAME='Your Name' npm run admin:create
 * Values can also come from .env. The password is never printed.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "Administrator").trim();
  const role = process.env.ADMIN_ROLE === "ADMIN" ? "ADMIN" : "SUPER_ADMIN";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Set ADMIN_EMAIL to a valid email address.");
  if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters and include letters and numbers.");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { role, passwordHash, isActive: true },
    create: { email, name, passwordHash, role, emailVerified: new Date() },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.auditLog.create({ data: { actorId: user.id, action: "admin.bootstrap", entity: "User", entityId: user.id, after: { email, role } } });
  console.log(`✔ ${role} account ready for ${email}`);
}

main()
  .catch((e) => {
    console.error(`✖ ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
