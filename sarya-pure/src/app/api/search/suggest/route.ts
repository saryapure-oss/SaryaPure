import { NextResponse, type NextRequest } from "next/server";
import { searchSuggestions } from "@/lib/services/catalog";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const data = await searchSuggestions(q);
  return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=15" } });
}
