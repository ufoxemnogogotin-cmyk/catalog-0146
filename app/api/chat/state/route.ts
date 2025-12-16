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

function roomKey(roomId: string) {
  return `chat:room:${roomId}:messages`;
}

function safeRoomId(v: string | null) {
  const r = (v || "default").trim();
  return r.length ? r : "default";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = safeRoomId(searchParams.get("roomId"));
  const key = roomKey(roomId);

  const messages = (await kv.get<Msg[]>(key)) ?? [];

  return NextResponse.json(
    { roomId, messages },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const action = body?.action as string | undefined;
  const roomId = safeRoomId(body?.roomId ?? null);
  const key = roomKey(roomId);

  // join/leave можеш да ги оставиш “no-op” (не пречат)
  if (action === "join" || action === "leave") {
    return NextResponse.json({ ok: true });
  }

  if (action === "append") {
    const msg = body?.message as Msg | undefined;
    if (!msg?.id || !msg?.from || !msg?.type || !msg?.ts) {
      return NextResponse.json({ error: "Bad message payload" }, { status: 400 });
    }

    const current = (await kv.get<Msg[]>(key)) ?? [];

    // защита от duplicate по id
    if (!current.some((m) => m.id === msg.id)) {
      const next = [...current, msg]
        .sort((a, b) => a.ts - b.ts)
        .slice(-MAX_MESSAGES);

      // set + TTL (изтрива се автоматично след 10 дни без активност)
      await kv.set(key, next, { ex: TTL_SECONDS });
    } else {
      // ако е duplicate – пак “освежаваме” TTL, за да не се губи стаята рано
      await kv.expire(key, TTL_SECONDS);
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
