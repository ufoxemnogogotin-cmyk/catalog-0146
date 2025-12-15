"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Inter } from "next/font/google";

import { useSearchParams } from "next/navigation";
import ChatWidget from "@/app/components/ChatWidget";

const inter = Inter({ subsets: ["latin", "cyrillic"], weight: ["500"] });

const EUR_RATE = 1.95583;


type Item = {
  name: string;
  ref: string;
  priceBgn: number;
  sizeMm: number;
  image: string;
  movement: "Автоматичен" | "Кварцов";
  material: string;
  coating?: string;
};

const items: Item[] = [
  // HUBLOT UNICO - M06
  {
    name: "HUBLOT UNICO",
    ref: "CAT-0146-01",
    priceBgn: 1325,
    sizeMm: 44,
    image: "/models/m06.png",
    movement: "Автоматичен",
    material: "Керамика",
  },
  // SUPEROCEAN - M05
  {
    name: "SUPEROCEAN",
    ref: "CAT-0146-02",
    priceBgn: 1147,
    sizeMm: 46,
    image: "/models/m05.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана 904L",
  },
  // DAYTONA - M04
  {
    name: "DAYTONA",
    ref: "CAT-0146-03",
    priceBgn: 1460,
    sizeMm: 40,
    image: "/models/m04.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана",
    coating: "18K златно покритие (PVD)",
  },
  // DATEJUST BS - M02
  {
    name: "DATEJUST BS",
    ref: "CAT-0146-04",
    priceBgn: 1182,
    sizeMm: 41,
    image: "/models/m02.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана 904L",
  },
  // DATEJUST BR - M03 (40mm)
  {
    name: "DATEJUST BR",
    ref: "CAT-0146-05",
    priceBgn: 1286,
    sizeMm: 40,
    image: "/models/m03.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана",
    coating: "18K розово златно покритие (PVD)",
  },
  // DATEJUST SS - M01
  {
    name: "DATEJUST SS",
    ref: "CAT-0146-06",
    priceBgn: 1182,
    sizeMm: 41,
    image: "/models/m01.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана",
  },
  // DATEJUST R LOGO - M07
  {
    name: "DATEJUST R LOGO",
    ref: "CAT-0146-07",
    priceBgn: 550,
    sizeMm: 39,
    image: "/models/m07.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана 316L",
  },
  // S MOD R LOGO - M03
  {
    name: "S MOD R LOGO",
    ref: "CAT-0146-08",
    priceBgn: 550,
    sizeMm: 39,
    image: "/models/m03.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана 316L",
  },
  // S MOD R LOGO - M01
  {
    name: "S MOD R LOGO",
    ref: "CAT-0146-09",
    priceBgn: 550,
    sizeMm: 39,
    image: "/models/m01.png",
    movement: "Автоматичен",
    material: "Неръждаема стомана 316L",
  },
  // S MOD R LOGO CAT-0146-10 - M04 (mega quartz)
  {
    name: "S MOD R LOGO",
    ref: "CAT-0146-10",
    priceBgn: 550,
    sizeMm: 39,
    image: "/models/m04.png",
    movement: "Кварцов",
    material: "Неръждаема стомана 316L",
  },
];

function formatEURFromBGN(bgn: number) {
  return (bgn / EUR_RATE).toFixed(2);
}

function SizeInline({ mm }: { mm: number }) {
  return (
    <span className="sizeInline">
      <span className="oSymbol">Ø</span>
      {mm} mm
    </span>
  );
}

export default function CatalogPage() {
const searchParams = useSearchParams();
const chatId = searchParams.get("chat") || "default";

  const [open, setOpen] = useState<Item | null>(null);

  // lock scroll + ESC close (but no "ESC text")
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const modalParams = useMemo(() => {
    if (!open) return [];
    const params: Array<{ label: string; value: string; isSize?: boolean }> = [
      { label: "Размер", value: `${open.sizeMm} mm`, isSize: true },
      { label: "Механизъм", value: open.movement },
      { label: "Материал", value: open.material },
    ];
    if (open.coating) params.push({ label: "Покритие", value: open.coating });
    return params;
  }, [open]);

  const count = modalParams.length;
  const paramsRightOnDesktop = count === 3; // keep your "3 params -> right" desktop vibe

  return (
    <main className={`${inter.className} wrap`}>
      <header className="header">
        <div>
          <div className="title">Индивидуална поръчка</div>
          <div className="subtitle">Заявка #0146</div>
        </div>
      </header>

      <section className="grid">
        {items.map((it) => (
          <button
            key={it.ref}
            className="card"
            onClick={() => setOpen(it)}
            type="button"
            aria-label={`Отвори ${it.name}`}
          >
            <div className="cardTop">
              <div className="cardName">{it.name}</div>
              <div className="cardSizeTopRight">
                <SizeInline mm={it.sizeMm} />
              </div>
            </div>

            <div className="imgBox">
              <img className="img" src={it.image} alt={it.name} />
            </div>

            <div className="cardBottom">
              <div className="price">
                {it.priceBgn} лв. <span className="slash">/</span>{" "}
                <span className="eur">{formatEURFromBGN(it.priceBgn)} €</span>
              </div>
              <div className="ref">Ref: {it.ref}</div>
            </div>
          </button>
        ))}
      </section>

      {open && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal">
            <div className="modalTop">
              <div className="modalTitle">{open.name}</div>
              <button className="closeBtn" onClick={() => setOpen(null)} aria-label="Затвори" type="button">
                ×
              </button>
            </div>

            <div className="modalBody">
              <img className="modalImg" src={open.image} alt={open.name} />
            </div>

            <div className={`modalBottom ${paramsRightOnDesktop ? "paramsRight" : ""}`}>
              {/* LEFT: price + ref */}
              <div className="modalLeft">
                <div className="modalPriceRow">
                  <div className="modalPrice">
                    {open.priceBgn} лв. <span className="slash">/</span>{" "}
                    <span className="eur">{formatEURFromBGN(open.priceBgn)} €</span>
                  </div>

                  {/* mobile: ref to the right of the price */}
                  <div className="modalRefInline">{open.ref}</div>
                </div>

                {/* desktop: ref below price */}
                <div className="modalRefBelow">{open.ref}</div>
              </div>

              {/* PARAMS */}
              <div
                className={[
                  "params",
                  count === 4 ? "twoCols" : "oneCol",
                  paramsRightOnDesktop ? "desktopRight" : "",
                ].join(" ")}
              >
                {modalParams.map((p) => (
                  <div key={p.label} className="param">
                    <div className="paramLabel">{p.label}</div>
                    <div className="paramValue">
                      {p.isSize ? (
                        <>
                          <span className="oSymbol">Ø</span>
                          {p.value}
                        </>
                      ) : (
                        p.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
<ChatWidget roomId={chatId} />   
      <style>{`
        :root{
          --line:#111;
        }

        .wrap{
          max-width: 1120px;
          margin: 0 auto;
          padding: 26px 16px 70px;
          color: #fff;
        }

        .header{
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          margin-bottom: 16px;
        }

        .title{ font-size: 26px; font-weight: 500; letter-spacing: .2px; }
        .subtitle{ opacity: .8; margin-top: 6px; font-weight: 500; }

        /* GRID (старият) */
        .grid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        @media (max-width: 900px){
          .grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px){
          .grid{ grid-template-columns: 1fr; }
        }

        /* CARD */
        .card{
          text-align:left;
          border: 2px solid var(--line);
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          color: #000;
          padding: 0;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(0,0,0,.35);
          transition: transform .12s ease, box-shadow .12s ease;
        }
        .card:hover{
          transform: translateY(-2px);
          box-shadow: 0 14px 40px rgba(0,0,0,.42);
        }

        .cardTop{
          padding: 10px 12px;
          border-bottom: 2px solid var(--line);
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 10px;
        }

        .cardName{
          font-weight: 500;
          letter-spacing: .6px;
          text-transform: uppercase;
          font-size: 15px;
        }

        .cardSizeTopRight{
          font-weight: 500;
          font-size: 13px;
          opacity: .95;
          white-space: nowrap;
        }

        .oSymbol{
          display:inline-block;
          margin-right: 3px; /* +3px spacing after Ø */
        }

        .imgBox{
          height: 280px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: #fff;
        }

        .img{
          max-height: 235px;
          max-width: 88%;
          object-fit: contain;
          transform: scale(1.10); /* +10% */
        }

        .cardBottom{
          display:flex;
          justify-content:space-between;
          align-items:flex-end;
          padding: 10px 12px;
          border-top: 2px solid var(--line);
          gap: 10px;
        }

        .price{
          font-weight: 500;
          font-size: 18px;
          letter-spacing: .2px;
          white-space: nowrap;
        }

        .slash{ opacity: .5; padding: 0 4px; }
        .eur{ opacity: .92; }

        .ref{
          font-weight: 500;
          font-size: 12px;
          opacity: .75;
          white-space: nowrap;
        }

        /* MODAL */
        .overlay{
          position: fixed;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 18px;
          background: rgba(0,0,0,.35);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 50;
        }

        .modal{
          width: min(900px, 96vw);
          background: #fff;
          color: #000;
          border: 2px solid var(--line);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 30px 120px rgba(0,0,0,.55);
        }

        .modalTop{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 12px 14px;
          border-bottom: 2px solid var(--line);
        }

        .modalTitle{
          font-weight: 500;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .closeBtn{
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 2px solid var(--line);
          background: #fff;
          font-size: 20px;
          line-height: 0;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .modalBody{
          height: 520px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: #fff;
        }

        .modalImg{
          max-height: 470px;
          max-width: 92%;
          object-fit: contain;
          transform: scale(1.10);
        }

        .modalBottom{
          border-top: 2px solid var(--line);
          padding: 12px 14px;
          display:flex;
          gap: 18px;
          align-items:flex-start;
          justify-content:space-between;
        }

        .modalLeft{
          min-width: 260px;
        }

        .modalPriceRow{
          display:flex;
          align-items:baseline;
          gap: 12px;
          flex-wrap: nowrap;
        }

        .modalPrice{
          font-weight: 500;
          font-size: 20px;
          letter-spacing: .2px;
          white-space: nowrap;
        }

        .modalRefBelow{
          margin-top: 8px;
          font-weight: 500;
          opacity: .75;
          font-size: 13px;
        }

        .modalRefInline{
          display:none;
          font-weight: 500;
          opacity: .75;
          font-size: 13px;
          white-space: nowrap;
        }

        /* PARAMS core rules */
        .params{
          flex: 1;
          display:grid;
          align-items:start;
          justify-items:start;
          row-gap: 10px; /* rows distance = 10px */
          column-gap: 20px;
        }

        .params.oneCol{
          grid-template-columns: 1fr;
        }

        /* mobile = 1 col ALWAYS; desktop can become 2 cols for 4 params */
        .params.twoCols{
          grid-template-columns: 1fr; /* phone default */
        }

        .param{
          display:flex;
          align-items:baseline;
          justify-content:flex-start;
          gap: 10px; /* label ↔ value = 10px */
          text-align:left;
        }

        .paramLabel{
          min-width: 92px;
          font-weight: 500;
          opacity: .65;
          font-size: 13px;
          white-space: nowrap;
        }

        .paramValue{
          font-weight: 500;
          font-size: 13px;
        }

        /* 3 params on desktop -> push params area to the right (your vibe) */
        .modalBottom.paramsRight{
          align-items: flex-start;
        }
        .params.desktopRight{
          max-width: 420px;
          margin-left: auto;
        }

        /* DESKTOP: 4 params -> 2x2 */
        @media (min-width: 761px){
          .params.twoCols{
            grid-template-columns: repeat(2, minmax(0, 1fr)); /* 2x2 on desktop */
          }
        }

        /* MOBILE modal layout */
        @media (max-width: 760px){
          .modal{
            width: min(520px, 96vw);
          }

          .modalBody{
            height: 420px;
          }

          .modalImg{
            max-height: 360px;
          }

          .modalBottom{
            flex-direction: column;
            gap: 12px;
          }

          /* price smaller so price+ref fits */
          .modalPrice{
            font-size: 18px;
          }

          .modalRefInline{ display:block; }
          .modalRefBelow{ display:none; }

          /* phone: params start from LEFT under price, stacked */
          .params{
            width: 100%;
            justify-items: start;
          }
          .params.oneCol,
          .params.twoCols{
            grid-template-columns: 1fr; /* always stacked on phone */
          }
        }

        @media (max-width: 420px){
          .modalPriceRow{
            gap: 10px;
          }
          .modalRefInline{
            font-size: 12px;
          }
        }
      `}</style>
</main>
  );
}
