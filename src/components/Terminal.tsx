import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, LYRIC_TREATMENT, type LyricTreatment } from "../theme";
import { clamp, mulberry32, range } from "../lib/rand";
import { energyAt } from "../lib/energy";
import { pace, RATE } from "../data/timeline";

const HAIRLINE = "rgba(255,255,255,0.10)";

const BARS = 64;
const barSeed = mulberry32(4242);
const BAR_SHAPE = range(BARS).map((i) => {
  const t = i / (BARS - 1);
  return (
    0.22 +
    0.78 * Math.abs(Math.sin(t * Math.PI * 3.1)) * (0.45 + barSeed() * 0.55)
  );
});

/**
 * The strip along the very top of her vision: her own process header. It is
 * always there, even when she is dreaming.
 */
export const TopBar: React.FC<{
  title?: string;
  host?: string;
  stage?: string;
  clock?: string;
  opacity?: number;
  /** the state word at the right end: RUNNING / WARN / ERROR */
  status?: string;
  /** when the machine is in trouble, its own name goes red */
  alarm?: boolean;
  /** the clock only counts while he is here */
  clockLabel?: string;
  /** when the name is being retyped, the raw string so far */
  titleDraft?: string;
  /** a block cursor at the end of the name while it is being edited */
  titleCursor?: boolean;
}> = ({
  title = "CAT.REINCARNATION;",
  host = "?@deepsea:~$",
  stage = "M03 / RENDER",
  clock = "00:47.0 / 02:48.0",
  opacity = 1,
  status,
  alarm = false,
  clockLabel,
  titleDraft,
  titleCursor = false,
}) => {
  const frame = useCurrentFrame();
  const pulse = 0.72 + 0.28 * Math.sin(pace(frame) * 0.16);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 46,
        borderBottom: `1px solid ${HAIRLINE}`,
        display: "flex",
        alignItems: "center",
        padding: "0 34px",
        fontFamily: FONT.mono,
        fontSize: 17,
        letterSpacing: 1.4,
        color: "rgba(255,255,255,0.72)",
        opacity,
      }}
    >
      <span
        style={{
          color: alarm ? "#ff6b5e" : "rgba(255,255,255,0.9)",
          textShadow: alarm ? "0 0 18px rgba(255,90,80,0.45)" : "none",
        }}
      >
        {titleDraft ?? title}
        {titleCursor ? (
          <span
            style={{
              display: "inline-block",
              width: 9,
              height: 15,
              marginLeft: 3,
              verticalAlign: "-2px",
              background: alarm ? "#ff6b5e" : "rgba(226,244,255,0.9)",
              opacity: Math.floor(pace(frame) / 8) % 2 === 0 ? 0.95 : 0.15,
            }}
          />
        ) : null}
      </span>
      <span style={{ marginLeft: 46, color: "rgba(255,255,255,0.34)" }}>{host}</span>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          height: 22,
        }}
      >
        {BAR_SHAPE.map((value, index) => {
          // the strip is the song itself: it is nearly flat until the band
          // comes in on the downbeat at 23.0 s
          const level = energyAt("all", frame);
          const h =
            value *
            (0.16 + 1.25 * level) *
            (0.6 + 0.4 * Math.abs(Math.sin(pace(frame) * 0.05 + index)));
          return (
            <div
              key={index}
              style={{
                width: 2,
                height: Math.max(2, h * 20),
                background: "rgba(255,255,255,0.42)",
              }}
            />
          );
        })}
      </div>

      <span
        style={{
          color: alarm ? "#ffd166" : "rgba(255,255,255,0.52)",
          opacity: pulse,
        }}
      >
        {stage}
      </span>
      <span style={{ marginLeft: 40, color: "rgba(255,255,255,0.86)" }}>{clockLabel ?? clock}</span>
      {status ? (
        <span
          style={{
            marginLeft: 34,
            letterSpacing: 1.6,
            color:
              status === "ERROR" || status === "WARN"
                ? "#ff6b5e"
                : "rgba(160,230,190,0.9)",
          }}
        >
          {status}
        </span>
      ) : null}
    </div>
  );
};

const READOUT_WORDS = ["READOUT", "GRAPH", "MPNN", "BOND", "C=C"];

/**
 * The column that never stops scrolling on the right edge — her vital signs,
 * printed whether or not anyone is looking.
 */
export const ReadoutColumn: React.FC<{
  opacity?: number;
  /** index of the row currently lit up */
  highlight?: number;
}> = ({ opacity = 1, highlight = 17 }) => {
  const rows = range(64);
  return (
    <div
      style={{
        position: "absolute",
        right: 22,
        top: 68,
        width: 108,
        fontFamily: FONT.mono,
        fontSize: 13,
        lineHeight: "15.4px",
        letterSpacing: 0.6,
        opacity,
      }}
    >
      {rows.map((index) => {
        const active = index === highlight;
        return (
          <div
            key={index}
            style={{
              color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.17)",
              border: active ? `1px solid rgba(255,255,255,0.6)` : "1px solid transparent",
              padding: "0 3px",
            }}
          >
            {READOUT_WORDS[index % READOUT_WORDS.length]}
          </div>
        );
      })}
    </div>
  );
};

export type StdoutToken = { text: string; id: number };

/**
 * The three degrees of "set like the cover signs its name": the words get
 * larger and further apart, the halo gets softer, then the boxes and the token
 * ids go away and a hairline is drawn under the line.
 */
const TREATMENTS: Record<
  LyricTreatment,
  {
    size: number;
    tracking: number;
    glow: number;
    box: number;
    idSize: number;
    idAlpha: number;
    /** the ids stay in the layout so the words cannot move, but are not drawn */
    hideIds: boolean;
    rule: boolean;
    cnSize: number;
    cnTracking: number;
  }
> = {
  now: { size: 42, tracking: 2, glow: 26, box: 0.16, idSize: 12.5, idAlpha: 0.3, hideIds: false, rule: false, cnSize: 27, cnTracking: 7 },
  soft: { size: 48, tracking: 6, glow: 42, box: 0.07, idSize: 12.5, idAlpha: 0.18, hideIds: false, rule: false, cnSize: 30, cnTracking: 9 },
  cover: { size: 50, tracking: 10, glow: 52, box: 0, idSize: 12.5, idAlpha: 0, hideIds: true, rule: true, cnSize: 31, cnTracking: 11 },
};

/**
 * The song's words are not a subtitle track in this film — they are her output
 * stream. Every line she sings is generated, token by token, with the token ids
 * printed underneath, exactly the way the harness prints them.
 */
export const StdoutBar: React.FC<{
  tokens: StdoutToken[];
  translation: string;
  label?: string;
  opacity?: number;
  cursor?: boolean;
  /** frame the line starts being emitted on */
  startFrame?: number;
  /** characters per frame */
  speed?: number;
  /** the machine cannot keep its own language straight: box the token in red */
  alarm?: boolean;
  /** the last line she ever sings is printed in his colour */
  warm?: boolean;
  /** the film's own name, typed into the stream and taken back out */
  titleLine?: { text: string; visible: number } | null;
}> = ({
  tokens,
  translation,
  label = "stdout · tokens",
  opacity = 1,
  cursor = true,
  startFrame = 0,
  speed = 0.46,
  alarm = false,
  warm = false,
  titleLine = null,
}) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(pace(frame) / 14) % 2 === 0;
  // she does not print the line, she generates it: character by character,
  // token by token, and the token id only lands once the token is finished
  const total = tokens.reduce((n, token) => n + token.text.length, 0);
  const revealed = clamp(Math.round(((frame - startFrame) / RATE) * speed), 0, total);
  const typed = total === 0 || revealed >= total;
  const T = TREATMENTS[LYRIC_TREATMENT];
  // the translation belongs to the line, so it arrives with it and leaves with
  // it, rather than waiting for the Japanese to finish typing
  const translationIn = total === 0 ? 1 : clamp((frame - startFrame) / RATE / 12);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 150,
        borderTop: `1px solid ${HAIRLINE}`,
        background:
          "linear-gradient(to bottom, rgba(4,6,12,0) 0%, rgba(4,6,12,0.86) 34%, rgba(4,6,12,0.96) 100%)",
        padding: "14px 40px 0",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 13,
          letterSpacing: 2.4,
          color: "rgba(255,255,255,0.34)",
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          // anchored at the bottom, so the words keep their place when the
          // type gets bigger and grow upward instead of sinking
          alignItems: "flex-end",
          gap: 26,
          marginTop: 10,
          height: 84,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: 42,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1,
          }}
        >
          &gt;
        </span>
        {titleLine ? (
          <span
            style={{
              fontFamily: FONT.latin,
              fontWeight: 300,
              fontSize: 40,
              letterSpacing: 10,
              color: "#f4faff",
              textShadow:
                "0 0 24px rgba(200,232,255,0.7), 0 0 80px rgba(120,180,255,0.45)",
              whiteSpace: "pre",
            }}
          >
            {titleLine.text.slice(0, titleLine.visible)}
            <span style={{ opacity: blink ? 0.9 : 0.08 }}>▌</span>
          </span>
        ) : null}
        {titleLine ? null : tokens.map((token, index) => {
          const offset = tokens
            .slice(0, index)
            .reduce((n, other) => n + other.text.length, 0);
          const shown = clamp(revealed - offset, 0, token.text.length);
          if (shown === 0) return null;
          const typing = cursor && shown > 0 && shown < token.text.length;
          const boxed = alarm && typing;
          return (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "4px 8px 2px",
              border: boxed
                ? "1px solid rgba(255,107,94,0.9)"
                : T.box > 0
                  ? `1px solid rgba(146,186,226,${T.box})`
                  : "none",
              background: boxed ? "rgba(255,107,94,0.12)" : "transparent",
              boxShadow: boxed ? "0 0 22px rgba(255,90,80,0.35)" : "none",
            }}
          >
            <span
              style={{
                fontFamily: FONT.jp,
                fontSize: T.size,
                lineHeight: 1.15,
                letterSpacing: T.tracking,
                color: warm ? "#ffd7a8" : C.white,
                textShadow: warm
                  ? `0 0 ${T.glow}px rgba(255,190,120,0.5), 0 0 ${T.glow * 2.7}px rgba(255,170,90,0.28)`
                  : `0 0 ${T.glow}px rgba(168,216,240,0.5), 0 0 ${T.glow * 2.7}px rgba(120,170,230,0.28)`,
                whiteSpace: "pre",
              }}
            >
              {token.text.slice(0, shown)}
              {typing ? (
                <span style={{ opacity: blink ? 0.9 : 0.07 }}>▌</span>
              ) : null}
            </span>
            {T.idSize > 0 ? (
              <span
                style={{
                  fontFamily: FONT.mono,
                  fontSize: T.idSize,
                  letterSpacing: 0.8,
                  color: boxed
                    ? "rgba(255,150,140,0.8)"
                    : `rgba(255,255,255,${T.idAlpha})`,
                  marginTop: 6,
                  visibility: T.hideIds ? "hidden" : "visible",
                  opacity: shown >= token.text.length ? 1 : 0,
                }}
              >
                {token.id}
              </span>
            ) : null}
          </div>
          );
        })}
        {cursor && !titleLine && (typed || revealed === 0) && tokens.length > 0 ? (
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 42,
              lineHeight: 1,
              color: "rgba(255,255,255,0.5)",
              paddingBottom: 22,
              opacity: blink ? 0.9 : 0.07,
            }}
          >
            ▌
          </span>
        ) : null}
        {tokens.length === 0 && !titleLine ? (
          <span
            style={{
              fontFamily: FONT.mono,
              fontSize: 42,
              lineHeight: 1,
              color: "rgba(255,255,255,0.5)",
              paddingBottom: 22,
              opacity: blink ? 0.95 : 0.08,
            }}
          >
            ▌
          </span>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          right: 46,
          bottom: 26,
          fontFamily: FONT.serifCn,
          fontWeight: 300,
          fontSize: T.cnSize,
          letterSpacing: T.cnTracking,
          color: "rgba(212,228,248,0.62)",
          textShadow: "0 0 22px rgba(130,180,235,0.35)",
          // the translation arrives once the line has been generated
          opacity: translationIn,
          translate: `0px ${(1 - translationIn) * 8}px`,
        }}
      >
        {translation}
      </div>

      {/* the hairline the cover signs its name with */}
      {T.rule && !titleLine && tokens.length > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 40,
            right: "40%",
            bottom: 26,
            height: 1,
            opacity: translationIn,
            background:
              "linear-gradient(to right, transparent 0%, rgba(198,228,255,0.46) 10%, rgba(198,228,255,0.46) 90%, transparent 100%)",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: -3.5,
              width: 7,
              height: 7,
              transform: "translateX(-50%) rotate(45deg)",
              background: "rgba(216,240,255,0.92)",
              boxShadow: "0 0 14px rgba(180,222,255,0.85)",
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

/** A faint engineering grid: the floor of the machine she lives in. */
export const TerminalGrid: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
    <AbsoluteFill
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 54px)",
      }}
    />
    <AbsoluteFill
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, rgba(255,255,255,0.032) 0px, rgba(255,255,255,0.032) 1px, transparent 1px, transparent 160px)",
      }}
    />
  </AbsoluteFill>
);
