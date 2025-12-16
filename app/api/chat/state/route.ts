import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = {
  id: string;
  from: string;
  type: "text" | "image";
  text?: string;
  imageDataUrl?: string;
  ts: number;
};

const TTL_SECONDS = 10 * 24 * 60 * 60; // 10 дни
const MAX_MESSAGES = 200;

const keyMessages = (roomId: string) => `chat:room:${roomId}:messages`;

function safeRoomId(v: string | null) {
  const r = (v || "default").trim();
  return r.length ? r : "default";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = safeRoomId(searchParams.get("roomId"));
  const key = keyMessages(roomId);

  const messages = (await kv.get<Msg[]>(key)) ?? [];

  return NextResponse.json(
    { roomId, messages },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const action = body?.action as string | undefined;
  const roomId = safeRoomId(body?.roomId ?? null);
  const key = keyMessages(roomId);

  if (action === "join" || action === "leave") {
    return NextResponse.json({ ok: true });
  }

  if (action === "clear") {
    await kv.del(key); // chat:room:${roomId}:messages
    return NextResponse.json({ ok: true });
  }

  if (action === "append") {
    const msg = body?.message as Msg | undefined;
    if (!msg?.id || !msg?.from || !msg?.type || !msg?.ts) {
      return NextResponse.json({ error: "Bad message payload" }, { status: 400 });
    }

    const current = (await kv.get<Msg[]>(key)) ?? [];

    if (!current.some((m) => m.id === msg.id)) {
      const next = [...current, msg]
        .sort((a, b) => a.ts - b.ts)
        .slice(-MAX_MESSAGES);

      await kv.set(key, next, { ex: TTL_SECONDS });
    } else {
      await kv.expire(key, TTL_SECONDS);
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
