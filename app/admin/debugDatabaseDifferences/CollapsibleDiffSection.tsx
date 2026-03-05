"use client";

import React, { useState } from "react";

const getDifferenceLabel = (count: number): string => {
  return `${count} item${count === 1 ? "" : "s"} different`;
};

const CollapsibleDiffSection = ({
  title,
  numberOfItemsDifferent,
  children,
  defaultExpanded = false,
}: {
  title: string;
  numberOfItemsDifferent: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section style={{ marginBottom: 16, border: "1px solid #444", borderRadius: 6 }}>
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          background: "transparent",
          color: "inherit",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
          fontWeight: 600,
          textAlign: "left",
        }}
      >
        <span>{title}</span>
        <span style={{ fontWeight: 400 }}>
          {getDifferenceLabel(numberOfItemsDifferent)} {isExpanded ? "▲" : "▼"}
        </span>
      </button>
      {isExpanded && <div style={{ padding: "0 12px 12px 12px" }}>{children}</div>}
    </section>
  );
};

export default CollapsibleDiffSection;
