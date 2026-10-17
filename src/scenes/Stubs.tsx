import React from "react";
import { AbsoluteFill } from "remotion";
import { C, FONT } from "../theme";

/** Placeholder used while the movement is still being written. */
export const Stub: React.FC<{ label: string }> = ({ label }) => (
  <AbsoluteFill
    style={{
      background: C.void,
      alignItems: "center",
      justifyContent: "center",
      fontFamily: FONT.mono,
      color: C.coolDim,
      fontSize: 34,
      letterSpacing: 10,
    }}
  >
    {label}
  </AbsoluteFill>
);

export const Closer = () => <Stub label="CLOSER" />;
export const Room = () => <Stub label="ROOM" />;
export const Become = () => <Stub label="BECOME" />;
export const Colors = () => <Stub label="COLORS" />;
export const Rollback = () => <Stub label="ROLLBACK" />;
export const Release = () => <Stub label="RELEASE" />;
