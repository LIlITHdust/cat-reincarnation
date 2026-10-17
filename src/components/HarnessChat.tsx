import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "../theme";
import { clamp } from "../lib/rand";
import { FPS, pace } from "../data/timeline";

/**
 * The harness: the window he actually talks to.
 *
 * It is built the way the real chat client is built — a window bar with its
 * traffic lights, his messages as short bubbles on the right with a time and a
 * copy button, her answers as full-width prose on the left under a "done in
 * 1 s" rule, a composer with an attachment button, a model chip and a send
 * button, and a running status line underneath.
 *
 * Every number in it is derived from the conversation above it: the rounds,
 * the tokens, the cache hit rate, the context ring. Nothing is decoration and
 * nothing is random — when he says something longer, the token count moves.
 *
 * `HARNESS.light` switches the whole surface to a dark skin; the layout is
 * identical either way.
 */

/**
 * The film's own skin for it: deep blue-black, hairlines, ice for her and warm
 * light for him. The light skin is kept because it is what the reference
 * looked like, but the film uses the dark one — the window is a surface she is
 * painting, not a screenshot of somebody else's product.
 */
const HARNESS = { light: false };

const P = HARNESS.light
  ? {
      bg: "#e6e9f0",
      chrome: "#eceef4",
      line: "rgba(20,20,26,0.12)",
      ink: "#1b1b20",
      muted: "#8d8f9c",
      wall: "#f1f3f8",
      chip: "#dfe3ee",
      accent: "#8fa6d8",
      accentInk: "#0a1420",
      you: "#cdd6f2",
      youInk: "#191b24",
      shadow: "0 26px 70px rgba(0,0,0,0.5)",
      lights: ["#e06c62", "#e2a94a", "#5aa87a"],
    }
  : {
      bg: "#060b13",
      chrome: "#0a1220",
      line: "rgba(146,186,226,0.16)",
      ink: "#dceaf8",
      muted: "#5f819f",
      wall: "#04080e",
      chip: "rgba(120,200,255,0.08)",
      accent: "#8fb6e8",
      accentInk: "#08121f",
      you: "rgba(255,203,150,0.12)",
      youInk: "#ffd8ac",
      shadow: "0 26px 70px rgba(0,0,0,0.6)",
      lights: ["#6b3a38", "#6b5a34", "#2e5a3c"],
    };

export type ChatMsg = {
  /** seconds into the film */
  t: number;
  /** him, her, or the process block that runs between his question and her
   *  answer — the process layer is not a chat message, it is the machine */
  from: "him" | "her" | "proc" | "mono" | "sys";
  text: string;
  /** only the standalone previews need a caption that is not the session clock */
  time?: string;
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** rough but deterministic; the column is bottom-anchored so it has to know */
/** a session starts when a line carries its date */
const isSessionStart = (line: ChatMsg) => !!line.time && line.time.includes("/");

/**
 * Deleting is typing backwards.
 *
 * Nothing is wiped away in one gesture: each line loses its last character
 * first and its first character last, and the lines further down the column go
 * before the ones at the top, so the record empties the way it was written.
 */
const cut = (text: string, amount: number, delay = 0) => {
  if (amount <= 0) return text;
  const gone = Math.floor(Math.max(0, amount - delay) * (text.length + 2));
  return text.slice(0, Math.max(0, text.length - gone));
};

const heightOf = (line: ChatMsg) => {
  if (line.from === "sys") return 30;
  if (line.from === "proc" || line.from === "mono") return 0;
  if (line.from === "him") {
    return 36 + Math.ceil(line.text.length / 16) * 23 + 34;
  }
  return 34 + Math.ceil(line.text.length / 27) * 27 + 34;
};

/**
 * How much room the line between two days takes.
 *
 * It used to be drawn as a decoration floating 62 px above the message, with
 * 104 px reserved around it on trust — so as soon as a message was taller or
 * shorter than the estimate, the day line landed on top of the conversation
 * instead of pushing it up. Now it is a block in the layout like any other: it
 * occupies exactly this much space above the message it belongs to, and the
 * messages above are pushed by exactly this much.
 */
const HEADER_H = 76;

/** `code` becomes a pill, the way the real client renders it */
const prose = (text: string, revealed: number, index: number) => {
  let used = 0;
  return text.split("`").map((chunk, i) => {
    if (i % 2 === 1) {
      const pill = (
        <span
          key={`${index}-${i}`}
          style={{
            fontFamily: FONT.mono,
            fontSize: 15,
            padding: "2px 7px",
            borderRadius: 6,
            background: P.chip,
            color: P.ink,
          }}
        >
          {chunk}
        </span>
      );
      used += chunk.length + 2;
      return used <= revealed ? pill : null;
    }
    const budget = clamp(revealed - used, 0, chunk.length);
    used += chunk.length;
    return budget === 0 ? null : (
      <span key={`${index}-${i}`}>{chunk.slice(0, budget)}</span>
    );
  });
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span
    style={{
      width: 11,
      height: 11,
      borderRadius: 999,
      background: color,
      display: "inline-block",
    }}
  />
);

/** a small cat, because that is what the chip is a chip for */
const CatGlyph: React.FC<{ color: string }> = ({ color }) => (
  <svg width={16} height={14} viewBox="0 0 16 14">
    <path
      d="M2,13 L2,5 L4.6,7.4 L8,2 L11.4,7.4 L14,5 L14,13 Z"
      fill="none"
      stroke={color}
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  </svg>
);

export const HarnessChat: React.FC<{
  messages: ChatMsg[];
  /** the window's title, which is the name she has been given */
  title?: string;
  model?: string;
  /** which of the two speakers this window is showing */
  status?: string;
  session?: string;
  /** characters per frame for her answers */
  speed?: number;
  showInput?: boolean;
  opacity?: number;
  /** nobody is looking at this window right now */
  dim?: boolean;
  /** the white lines printed where the conversation would be */
  overlay?: { line1: string; line2: string; age: number; hold: number } | null;
  /** 0..1 — everything is being deleted, letter by letter, fastest last */
  purge?: number;
  /** the second the erasing begins, so lines that arrive during it can be
   *  printed first and taken back afterwards */
  purgeStart?: number;
  /** the line printed on the rule between two sessions, if there is one */
  ruleNote?: string;
}> = ({
  messages,
  title = "新对话",
  model = "cat.reincarnation high",
  status = "live",
  session = "001",
  speed = 1.8,
  showInput = true,
  opacity = 1,
  dim = false,
  overlay = null,
  purge = 0,
  purgeStart = 0,
  ruleNote,
}) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;

  // once everything has been cleared, the record is not "deleted" — it is not
  // there at all; only what has happened since the reset is on screen
  const cleared = purge > 0.995;
  const shown = messages.filter(
    (line) =>
      seconds >= line.t &&
      // after the wipe only the new session is left — but anything said while
      // the record was being erased still gets its moment and is taken back by
      // the eraser, rather than being hidden by this switch
      (!cleared || line.t >= 156.6 || line.t > purgeStart + 0.4),
  );
  /**
   * How far a line has finished arriving, 0..1.
   *
   * The column is laid out from the bottom up, so a new line makes room by
   * pushing everything above it. That push has to happen over time: when the
   * space appeared all at once, the whole record jumped a line or two and then
   * drifted back, which is what made the window look like it was shaking while
   * it was working. Now the space grows over half a second, and the new line
   * comes up from below at the same rate, so nothing moves except smoothly.
   */
  const riseOf = (line: ChatMsg) => clamp((seconds - line.t) / 0.6);

  /**
   * The eraser.
   *
   * It works up the column one block at a time: a line is backspaced away
   * character by character, and then the box it was written in closes up, so the
   * line above slides down into the space. Nothing is ever taken away by a
   * switch — that switch is what made the end of the record look cut off
   * instead of deleted.
   *
   * Only the rows that can be on screen need the slow treatment; everything
   * older is already above the window and closes from the start, so it can
   * never slide down into view half-read.
   */
  const VISIBLE_ROWS = 7;
  /**
   * The blocks are ranked by where they sit in the whole record, not by where
   * they sit in the column just now. `shown` grows whenever a line arrives, and
   * a rank that moves would push some block past the last row and make it
   * disappear in a single frame — which is exactly the cut being removed here.
   */
  let lastBeforeErase = 0;
  for (let i = 0; i < messages.length; i++) if (messages[i].t <= purgeStart) lastBeforeErase = i;
  const eraseAt = (index: number) => {
    if (purge <= 0 || shown[index].t >= 156.6) return { cut: 0, gone: 0 };
    const line = shown[index];
    // the last few lines are said *while* the record is being wiped: they are
    // printed, stay a moment, and are then taken back like everything else
    if (purgeStart > 0 && line.t > purgeStart + 0.4) {
      // it is eaten as it is being written, so the last things said are always
      // half a sentence: the record runs out before the line does
      const own = (seconds - line.t - 0.15) / 1.5;
      return { cut: clamp(own), gone: clamp((own - 1) / 0.35) };
    }
    const rank = lastBeforeErase - messages.indexOf(line); // 0 = newest before it began
    if (rank >= VISIBLE_ROWS) return { cut: 1, gone: 1 };
    const worked = clamp(purge) * (VISIBLE_ROWS + 1);
    return {
      cut: clamp(worked - rank),
      gone: clamp((worked - rank - 1) / 0.35),
    };
  };
  const offsets = shown.map((_, i) =>
    shown.reduce((n, line, j) => {
      if (j <= i) return n;
      const { gone } = eraseAt(j);
      return (
        n +
        (heightOf(line) * (1 - gone) + (isSessionStart(line) ? HEADER_H : 0)) *
          riseOf(line)
      );
    }, 0),
  );

  // everything below is a function of what has actually been said
  const rounds = shown.filter((line) => line.from === "him").length;
  const chars = shown.reduce((n, line) => n + line.text.length, 0);
  const usedTok = (chars * 1.45) / 1000;
  const cached = Math.min(97, 38 + rounds * 7);
  const perSec = 60 + rounds * 9;
  const ctx = clamp(chars / 3000);
  const ring = 2 * Math.PI * 7;

  const clock = (t: number) => {
    const total = 20 * 3600 + 41 * 60 + 7 + Math.floor(t);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}`;
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 8,
        borderRadius: 13,
        overflow: "hidden",
        background: P.bg,
        boxShadow: P.shadow,
        fontFamily: FONT.cn,
        opacity: opacity * (dim ? 0.2 : 1),
        filter: dim ? "grayscale(0.8)" : undefined,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ------------------------------------------------------------ chrome */}
      <div
        style={{
          height: 42,
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          background: P.chrome,
          borderBottom: `1px solid ${P.line}`,
          color: P.muted,
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          {P.lights.map((color) => (
            <Dot key={color} color={color} />
          ))}
        </div>
        <svg width={19} height={15} viewBox="0 0 19 15" style={{ marginLeft: 6 }}>
          <rect x={0.6} y={0.6} width={17.8} height={13.8} rx={3} fill="none" stroke="rgba(190,222,248,0.6)" />
          <line x1={6.4} y1={0.6} x2={6.4} y2={14.4} stroke="rgba(190,222,248,0.6)" />
        </svg>
        <svg width={18} height={18} viewBox="0 0 18 18">
          <circle cx={9} cy={9} r={7.6} fill="none" stroke="rgba(190,222,248,0.6)" />
          <line x1={9} y1={5.4} x2={9} y2={12.6} stroke="rgba(190,222,248,0.6)" />
          <line x1={5.4} y1={9} x2={12.6} y2={9} stroke="rgba(190,222,248,0.6)" />
        </svg>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 15.5,
            letterSpacing: 0.4,
            color: P.ink,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "3px 8px",
            borderRadius: 7,
            border: `1px solid ${P.line}`,
            background: P.chip,
            color: P.ink,
          }}
        >
          <CatGlyph color={P.ink} />
          <span style={{ fontSize: 12.5 }}>⌄</span>
        </div>
        <span style={{ fontSize: 17, letterSpacing: 1 }}>···</span>
        <svg width={19} height={15} viewBox="0 0 19 15">
          <rect x={0.6} y={0.6} width={17.8} height={13.8} rx={3} fill="none" stroke="rgba(190,222,248,0.6)" />
          <line x1={12.6} y1={0.6} x2={12.6} y2={14.4} stroke="rgba(190,222,248,0.6)" />
        </svg>
      </div>

      {overlay ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "34%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            fontFamily: FONT.mono,
            letterSpacing: 3,
            opacity:
              Math.min(1, overlay.age / 0.3) *
              Math.min(1, Math.max(0, (overlay.hold - overlay.age) / 0.8)),
          }}
        >
          <div
            style={{
              fontSize: 19,
              color: "#f2f9ff",
              textShadow: "0 0 22px rgba(180,228,255,0.5)",
            }}
          >
            {overlay.line1}
          </div>
          <div style={{ fontSize: 13, color: "rgba(190,222,248,0.75)" }}>{overlay.line2}</div>
        </div>
      ) : null}

      {/* ------------------------------------------------------------ thread */}
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
          background: P.wall,
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 5%, black 13%, black 100%)",
        }}
      >
        {shown.map((line, index) => {
          // a line that is still arriving comes up from under the window
          const bottom =
            offsets[index] +
            12 -
            heightOf(line) * (1 - riseOf(line));
          const appear = interpolate(seconds, [line.t, line.t + 0.45], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          });
          const erasing = eraseAt(index);
          const vanish = {
            opacity: appear * (1 - erasing.gone),
            transform: `scaleY(${(1 - 0.92 * erasing.gone).toFixed(3)})`,
            transformOrigin: "bottom" as const,
          };

          if (line.from === "proc" || line.from === "mono") return null;
          // the day line is part of the layout rather than a decoration laid
          // over it: it holds its own space above the message it belongs to, so
          // the record above is pushed up by it and can never end up under it
          const sessionHeader = isSessionStart(line) ? (
            <div
              key={`rule${index}`}
              style={{
                width: "100%",
                height: HEADER_H,
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8,
                fontFamily: FONT.mono,
                fontSize: 11.5,
                letterSpacing: 1.4,
                color: "rgba(150,190,230,0.5)",
              }}
            >
              {ruleNote ? (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11.5,
                    letterSpacing: 1.6,
                    color: "rgba(255,198,138,0.8)",
                  }}
                >
                  {ruleNote}
                </div>
              ) : null}
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                <span style={{ flex: 1, height: 1, background: "rgba(146,186,226,0.22)" }} />
                <span>{line.time}</span>
                <span style={{ flex: 1, height: 1, background: "rgba(146,186,226,0.22)" }} />
              </div>
            </div>
          ) : null;

          if (line.from === "sys") {
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: 22,
                  right: 22,
                  bottom,
                  fontFamily: FONT.mono,
                  fontSize: 11.5,
                  letterSpacing: 0.4,
                  color: P.muted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  opacity: appear * (1 - erasing.gone),
                }}
              >
                {line.text}
              </div>
            );
          }

          if (line.from === "him") {
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 22,
                  bottom,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                  ...vanish,
                }}
              >
                {sessionHeader}
                <div
                  style={{
                    maxWidth: "76%",
                    padding: "9px 14px",
                    borderRadius: "14px 14px 3px 14px",
                    border: `1px solid rgba(255,203,150,0.24)`,
                    background: P.you,
                    color: P.youInk,
                    fontSize: 15.5,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    textShadow: "0 0 16px rgba(255,180,110,0.28)",
                  }}
                >
                  {cut(line.text, erasing.cut).slice(
                    0,
                    Math.max(0, Math.ceil((seconds - line.t) * 1.6 * 8)),
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: P.muted,
                    fontSize: 12.5,
                  }}
                >
                  <span>{line.time ?? clock(line.t)}</span>
                  <svg width={13} height={13} viewBox="0 0 13 13">
                    <rect
                      x={3.4}
                      y={0.6}
                      width={9}
                      height={9}
                      rx={2}
                      fill="none"
                      stroke={P.muted}
                    />
                    <path
                      d="M9.6,11.4 L0.6,11.4 L0.6,3.4"
                      fill="none"
                      stroke={P.muted}
                    />
                  </svg>
                </div>
              </div>
            );
          }

          // her answer: no bubble — the whole width is the answer, the way a
          // real client prints prose
          const revealed = Math.max(
            0,
            Math.floor((seconds - line.t - 0.25) * speed * 8),
          );
          const done = revealed >= line.text.length;
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: 22,
                right: 22,
                bottom,
                ...vanish,
              }}
            >
              {sessionHeader}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 13,
                  color: P.muted,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${P.line}`,
                }}
              >
                <span>{done ? "已完成" : "生成中"}</span>
                <span>· 用时 {Math.min(9, Math.max(1, Math.round(revealed / 34)))} 秒</span>
                <span style={{ opacity: 0.7 }}>{done ? "⌄" : "…"}</span>
              </div>
              <div
                style={{
                  paddingTop: 10,
                  fontSize: 15.5,
                  lineHeight: 1.7,
                  color: "#d3ecff",
                  letterSpacing: 0.3,
                  textShadow: "0 0 18px rgba(110,200,255,0.18)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {line.text
                  .split("\n")
                  .map((para, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      {prose(cut(para, erasing.cut), Math.max(0, revealed), i)}
                    </div>
                  ))}
                {!done ? (
                  <span
                    style={{
                      opacity: Math.floor(pace(frame) / 14) % 2 === 0 ? 0.8 : 0.1,
                    }}
                  >
                    ▌
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- input */}
      {showInput ? (
        <div
          style={{
            flex: "0 0 auto",
            padding: "10px 14px 9px",
            background: P.bg,
            borderTop: `1px solid ${P.line}`,
          }}
        >
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${P.line}`,
              background: "rgba(10,18,30,0.72)",
              boxShadow: "inset 0 0 30px rgba(80,150,220,0.05)",
              padding: "12px 12px 8px",
            }}
          >
            <div style={{ fontSize: 14.5, color: P.muted, paddingBottom: 16 }}>
              发消息或创建任务，/ 调用指令，@ 文件或对话
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 999,
                  border: `1px solid ${P.line}`,
                  color: P.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                +
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: P.muted }}>
                {model} ⌄
              </span>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: "linear-gradient(160deg, #cfe0ff 0%, #8fa6d8 100%)",
                  color: P.accentInk,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                ↑
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              paddingTop: 8,
              fontFamily: FONT.mono,
              fontSize: 11.5,
              color: P.muted,
            }}
          >
            <span>
              ✓ {rounds} 轮 {rounds} 步 · {Math.round(perSec * (1 - purge))} tok/s
            </span>
            <span>
              {(usedTok * (1 - purge)).toFixed(1)}K tok · 缓存命中{" "}
              {Math.round(cached * (1 - purge))}%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg width={17} height={17} viewBox="0 0 17 17">
                <circle
                  cx={8.5}
                  cy={8.5}
                  r={7}
                  fill="none"
                  stroke={P.line}
                  strokeWidth={2}
                />
                <circle
                  cx={8.5}
                  cy={8.5}
                  r={7}
                  fill="none"
                  stroke={P.accent}
                  strokeWidth={2}
                  strokeDasharray={`${ring * ctx} ${ring}`}
                  transform="rotate(-90 8.5 8.5)"
                />
              </svg>
              {Math.max(1, Math.round(ctx * 100))}%
            </span>
            <span style={{ flex: 1 }} />
            <span>SESSION {session} · {status}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
