import Ably from "ably";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing ABLY_API_KEY in .env.local" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") || "anon";
  const roomId = searchParams.get("roomId") || "default";

  const rest = new Ably.Rest({ key: apiKey });

  // token only for конкретната "стая"
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId,
capability: JSON.stringify({
  [`chat:${roomId}`]: ["publish", "subscribe"],
}),

  });

  return NextResponse.json(tokenRequest);
}
