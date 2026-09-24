export function statusTone(status: string): "green" | "gold" | "red" | "gray" | "blue" {
  if (status === "DELIVERED" || status === "CONFIRMED") return "green";
  if (status === "CANCELLED") return "red";
  if (status.startsWith("REFUND")) return "gold";
  if (["SHIPPED", "OUT_FOR_DELIVERY", "PACKED", "PROCESSING"].includes(status)) return "blue";
  return "gray";
}
