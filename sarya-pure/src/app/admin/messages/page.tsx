import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { MarkReadButton } from "@/components/admin/mark-read-button";

export const metadata = { title: "Contact Messages" };

export default async function AdminMessagesPage() {
  const messages = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Contact Messages</h1>
        <p className="mt-1 text-sm text-muted">{messages.filter((m) => !m.isRead).length} unread of {messages.length}.</p>
      </div>

      {messages.length === 0 ? (
        <EmptyState title="No messages yet" />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`rounded-2xl border p-5 ${m.isRead ? "border-beige-300 bg-white" : "border-gold-500/40 bg-gold-300/10"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {m.subject} {!m.isRead && <Badge tone="gold">New</Badge>}
                  </p>
                  <p className="text-xs text-muted">
                    {m.name} · {m.email} {m.phone && `· ${m.phone}`} · {formatDate(m.createdAt.toISOString(), true)}
                  </p>
                </div>
                {!m.isRead && <MarkReadButton id={m.id} />}
              </div>
              <p className="mt-2 text-sm">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
