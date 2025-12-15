"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { FiMessageSquare, FiSend, FiX, FiTrash2, FiImage } from "react-icons/fi";
import * as Ably from "ably";

type Msg = {
  id: string;
  from: string; // clientId
  type: "text" | "image";
  text?: string;
  imageDataUrl?: string;
  ts: number;
};

const CLIENT_ID_KEY = "sevato_chat_client_id_v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getOrCreateClientId() {
  try {
    const saved = sessionStorage.getItem(CLIENT_ID_KEY);
    if (saved) return saved;
    const fresh = `c_${uid()}`;
    sessionStorage.setItem(CLIENT_ID_KEY, fresh);
    return fresh;
  } catch {
    return `c_${uid()}`;
  }
}

async function apiState(payload: any) {
  await fetch("/api/chat/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default function ChatWidget({ roomId = "default" }: { roomId?: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [ably, setAbly] = useState<Ably.Realtime | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const clientId = useMemo(() => getOrCreateClientId(), []);
  const channelName = `chat:${roomId}`;

  // ✅ Create Ably ONLY on client (after mount). Avoids Vercel/SSR build errors.
  useEffect(() => {
    const base = window.location.origin;

    const rt = new Ably.Realtime({
      authUrl: `${base}/api/ably/token?roomId=${encodeURIComponent(roomId)}&clientId=${encodeURIComponent(clientId)}`,
      clientId,
    });

    setAbly(rt);

    return () => {
      try {
        rt.close();
      } catch {}
    };
  }, [roomId, clientId]);

  // 1) JOIN room + load history
  useEffect(() => {
    let alive = true;

    (async () => {
      await apiState({ action: "join", roomId, clientId });

      const res = await fetch(`/api/chat/state?roomId=${encodeURIComponent(roomId)}`);
      const data = await res.json();

      if (!alive) return;
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    })();

    return () => {
      alive = false;
    };
  }, [roomId, clientId]);

  // 2) LEAVE room on tab close
  useEffect(() => {
    const onUnload = () => {
      try {
        const blob = new Blob([JSON.stringify({ action: "leave", roomId, clientId })], {
          type: "application/json",
        });
        navigator.sendBeacon("/api/chat/state", blob);
      } catch {
        fetch("/api/chat/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "leave", roomId, clientId }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [roomId, clientId]);

  // 3) Subscribe realtime
  useEffect(() => {
    if (!ably) return;

    let mounted = true;
    const ch = ably.channels.get(channelName);

    ch.subscribe("msg", (msg) => {
      if (!mounted) return;
      const data = msg.data as Msg;

      setMessages((prev) => {
        if (prev.some((x) => x.id === data.id)) return prev;
        return [...prev, data].sort((a, b) => a.ts - b.ts).slice(-50);
      });
    });

    return () => {
      mounted = false;
      try {
        ch.unsubscribe();
      } catch {}
    };
  }, [ably, channelName]);

  // 4) autoscroll
  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages]);

  async function publishAndStore(payload: Msg) {
    await apiState({ action: "append", roomId, message: payload });

    if (!ably) return; // ✅ guard
    const ch = ably.channels.get(channelName);
    await ch.publish("msg", payload);
  }

  async function sendText() {
    const t = input.trim();
    if (!t) return;

    const msg: Msg = { id: uid(), from: clientId, type: "text", text: t, ts: Date.now() };

    setMessages((prev) => [...prev, msg].slice(-50));
    setInput("");

    try {
      await publishAndStore(msg);
    } catch (e) {
      console.error(e);
    }
  }

  async function onPickImage(file: File) {
    if (file.size > 800 * 1024) {
      alert("Снимката е твърде голяма (max ~800KB за тест).");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const url = String(reader.result || "");
      const msg: Msg = { id: uid(), from: clientId, type: "image", imageDataUrl: url, ts: Date.now() };

      setMessages((prev) => [...prev, msg].slice(-50));

      try {
        await publishAndStore(msg);
      } catch (e) {
        console.error(e);
      }
    };
    reader.readAsDataURL(file);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendText();
  }

  function clearLocalOnly() {
    setMessages([]);
    setInput("");
  }

  const canSend = input.trim().length > 0;

  return (
    <>
      <button
        type="button"
        className={clsx("cw-fab", open && "cw-fabHidden")}
        onClick={() => setOpen(true)}
        aria-label="Отвори чат"
      >
        <FiMessageSquare size={20} />
      </button>

      <div className={clsx("cw-panelWrap", open ? "cw-open" : "cw-closed")}>
        <div className="cw-panel" role="dialog" aria-label="Чат">
          <div className="cw-head">
            <div className="cw-title">Чат</div>
            <div className="cw-actions">
              <button type="button" className="cw-iconBtn" onClick={clearLocalOnly} title="Изтрий (само при теб)">
                <FiTrash2 />
              </button>
              <button type="button" className="cw-iconBtn" onClick={() => setOpen(false)} title="Затвори">
                <FiX />
              </button>
            </div>
          </div>

          <div className="cw-body">
            {messages.length === 0 ? (
              <div className="cw-empty">Пиши тук 👇 (историята живее докато има отворени табове)</div>
            ) : (
              <div className="cw-msgs">
                {messages.map((m) => {
                  const mine = m.from === clientId;
                  return (
                    <div key={m.id} className={clsx("cw-msg", mine ? "cw-me" : "cw-visitor")}>
                      {m.type === "text" && <div className="cw-bubble">{m.text}</div>}
                      {m.type === "image" && (
                        <div className="cw-bubble cw-imgBubble">
                          <img className="cw-img" src={m.imageDataUrl} alt="image" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="cw-foot">
            <input
              className="cw-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Напиши съобщение…"
            />

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="cw-file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onPickImage(f);
                e.currentTarget.value = "";
              }}
            />

            <button type="button" className="cw-iconBtn" onClick={() => fileRef.current?.click()} title="Снимка">
              <FiImage />
            </button>

            <button
              type="button"
              className={clsx("cw-send", !canSend && "cw-sendDisabled")}
              onClick={sendText}
              disabled={!canSend}
              title="Изпрати"
            >
              <FiSend />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cw-fab{
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 60;
          width: 52px;
          height: 52px;
          border-radius: 999px;
          border: 2px solid #111;
          background: #fff;
          color: #111;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow: 0 14px 40px rgba(0,0,0,.35);
          cursor:pointer;
        }
        .cw-fabHidden{ display:none; }

        .cw-panelWrap{
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 61;
          width: min(360px, calc(100vw - 36px));
          transform-origin: bottom right;
        }
        .cw-closed{ pointer-events:none; opacity:0; transform: translateY(10px) scale(.98); }
        .cw-open{ pointer-events:auto; opacity:1; transform: translateY(0) scale(1); transition: all .14s ease; }

        .cw-panel{
          border: 2px solid #111;
          border-radius: 14px;
          overflow:hidden;
          background:#fff;
          box-shadow: 0 30px 120px rgba(0,0,0,.45);
          display:flex;
          flex-direction: column;
          height: 520px;
          color:#111;
        }

        .cw-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 10px 12px;
          border-bottom: 2px solid #111;
        }
        .cw-title{ font-weight: 700; letter-spacing: .2px; }
        .cw-actions{ display:flex; gap: 8px; }

        .cw-iconBtn{
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 2px solid #111;
          background:#fff;
          color:#111;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }

        .cw-body{ flex:1; padding: 10px; overflow:auto; background:#fff; }
        .cw-empty{ font-size: 13px; opacity: .7; padding: 10px; color:#111; }

        .cw-msgs{ display:flex; flex-direction: column; gap: 10px; }
        .cw-msg{ display:flex; }
        .cw-me{ justify-content:flex-end; }
        .cw-visitor{ justify-content:flex-start; }

        .cw-bubble{
          max-width: 80%;
          border: 2px solid #111;
          border-radius: 12px;
          padding: 8px 10px;
          font-size: 13px;
          line-height: 1.25;
          background:#fff;
          color:#111;
        }
        .cw-imgBubble{ padding: 6px; }
        .cw-img{ width: 220px; max-width: 100%; border-radius: 10px; display:block; }

        .cw-foot{
          border-top: 2px solid #111;
          padding: 10px;
          display:flex;
          gap: 8px;
          align-items:center;
          background:#fff;
        }
        .cw-input{
          flex:1;
          height: 40px;
          border-radius: 12px;
          border: 2px solid #111;
          padding: 0 10px;
          outline: none;
          font-size: 13px;
          color:#111;
        }
        .cw-file{ display:none; }

        .cw-send{
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 2px solid #111;
          background:#111;
          color:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }
        .cw-sendDisabled{ opacity: .4; cursor:not-allowed; }

        @media (max-width: 760px){
          .cw-panel{ height: 70vh; }
        }
      `}</style>
    </>
  );
}
