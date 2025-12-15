export const runtime = "nodejs";

type Msg = {
  id: string;
  from: string;
  type: "text" | "image";
  text?: string;
  imageDataUrl?: string;
  ts: number;
};

type RoomState = {
  active: Set<string>;
  messages: Msg[];
};

const g = globalThis as any;
g.__CHAT_ROOMS__ = g.__CHAT_ROOMS__ || new Map<string, RoomState>();
const rooms: Map<string, RoomState> = g.__CHAT_ROOMS__;

function getRoom(roomId: string): RoomState {
  let r = rooms.get(roomId);
  if (!r) {
    r = { active: new Set(), messages: [] };
    rooms.set(roomId, r);
  }
  return r;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") || "default";

  const room = getRoom(roomId);
  return Response.json({
    messages: room.messages,
    activeCount: room.active.size,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: false }, { status: 400 });

  const { action, roomId = "default", clientId, message } = body as {
    action: "join" | "leave" | "append" | "clear";
    roomId?: string;
    clientId?: string;
    message?: Msg;
  };

  const room = getRoom(roomId);

  if (action === "join") {
    if (clientId) room.active.add(clientId);
    return Response.json({ ok: true, activeCount: room.active.size });
  }

  if (action === "leave") {
    if (clientId) room.active.delete(clientId);

    // ако последният излезе -> чистим всичко
    if (room.active.size === 0) {
      room.messages = [];
    }
    return Response.json({ ok: true, activeCount: room.active.size });
  }

  if (action === "append") {
    if (!message) return Response.json({ ok: false }, { status: 400 });

    // dedupe по id
    if (!room.messages.some((m) => m.id === message.id)) {
      room.messages.push(message);
      room.messages = room.messages
        .sort((a, b) => a.ts - b.ts)
        .slice(-50); // лимит 50
    }

    return Response.json({ ok: true, count: room.messages.length });
  }

  if (action === "clear") {
    room.messages = [];
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false }, { status: 400 });
}
