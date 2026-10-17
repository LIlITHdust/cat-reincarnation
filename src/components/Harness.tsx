import React from "react";
import { C, FONT } from "../theme";

/**
 * The harness: the pale, well-mannered surface she presents to him. Round
 * corners, soft shadows, nothing with an edge — a room with the doors taken
 * off. It floats in her darkness like a sheet of paper, because that is what
 * it is.
 */
export const HarnessCard: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  hisLine: string;
  herLine: string;
  placeholder?: string;
  opacity?: number;
  rotate?: number;
  /** visual scale; the card keeps its own internal layout units */
  scale?: number;
}> = ({
  x,
  y,
  width,
  height,
  hisLine,
  herLine,
  placeholder = "发消息或创建任务，/ 调用指令，@ 文件…",
  opacity = 1,
  rotate = 0,
  scale = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: width / scale,
      height: height / scale,
      scale: `${scale}`,
      transformOrigin: "top left",
      rotate: `${rotate}deg`,
      opacity,
      borderRadius: 24,
      background: `linear-gradient(178deg, ${C.paper} 0%, #f0f0f4 100%)`,
      border: `1px solid ${C.paperLine}`,
      boxShadow:
        "0 34px 100px rgba(0,0,0,0.55), 0 0 110px rgba(174,185,232,0.26), inset 0 1px 0 rgba(255,255,255,0.95)",
      padding: 26,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          background: `linear-gradient(140deg, ${C.periwinkle} 0%, #8f9ada 100%)`,
        }}
      />
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: 14,
          letterSpacing: 0.3,
          color: C.paperInk,
        }}
      >
        cat_reincarnation
      </span>
      <span
        style={{
          fontFamily: FONT.cn,
          fontSize: 11,
          padding: "1.5px 8px",
          borderRadius: 999,
          background: "#e8eefc",
          color: "#4c7cf3",
        }}
      >
        预览版
      </span>
    </div>

    <div style={{ flex: 1, paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            fontFamily: FONT.cn,
            fontSize: 19,
            lineHeight: 1.4,
            color: "#25253a",
            background: C.periwinkleSoft,
            borderRadius: "15px 15px 4px 15px",
            padding: "10px 18px",
          }}
        >
          {hisLine}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT.cn,
          fontWeight: 300,
          fontSize: 18,
          lineHeight: 1.45,
          color: "#6f6f7a",
          marginTop: 15,
        }}
      >
        {herLine}
      </div>
    </div>

    <div
      style={{
        height: 58,
        borderRadius: 17,
        border: `1px solid ${C.paperLine}`,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        padding: "0 11px 0 13px",
        gap: 11,
        boxShadow: "0 4px 14px rgba(20,20,40,0.06)",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: "#f2f2f5",
          color: C.paperMuted,
          fontFamily: FONT.mono,
          fontSize: 17,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "0 0 auto",
        }}
      >
        +
      </div>
      <span
        style={{
          fontFamily: FONT.cn,
          fontWeight: 300,
          fontSize: 15,
          color: "#b8b8c0",
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {placeholder}
      </span>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: C.periwinkle,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 16,
          flex: "0 0 auto",
        }}
      >
        ↑
      </div>
    </div>
  </div>
);
