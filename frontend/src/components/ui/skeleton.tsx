"use client";

import * as React from "react";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        backgroundColor: "var(--line)",
        borderRadius: "8px",
        ...props.style
      }}
      {...props}
    />
  );
}

export { Skeleton };
