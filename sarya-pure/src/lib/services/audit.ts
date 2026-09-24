import "server-only";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/security/request";
import type { Prisma } from "@/generated/prisma/client";

type AuditInput = {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
};

function toJson(v: unknown): Prisma.InputJsonValue | undefined {
  if (v === undefined || v === null) return undefined;
  return JSON.parse(JSON.stringify(v, (_k, val) => (typeof val === "bigint" ? val.toString() : val))) as Prisma.InputJsonValue;
}

/** Records sensitive admin activity. Never throws — auditing must not break the operation. */
export async function audit(input: AuditInput) {
  try {
    let ip: string | null = null;
    try {
      ip = await getClientIp();
    } catch {
      ip = null;
    }
    await db.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        before: toJson(input.before),
        after: toJson(input.after),
        ip,
      },
    });
  } catch (e) {
    console.error("[audit] failed to write audit log", e);
  }
}
