"use client";

import React, { useCallback, useMemo, useState } from "react";

const CopyDropIndexSqlButton = ({ sql, disabledText }: { sql: string; disabledText?: string }) => {
  const [copied, setCopied] = useState(false);

  const isDisabled = useMemo(() => sql.trim().length === 0, [sql]);

  const onCopy = useCallback(async () => {
    if (isDisabled) {
      return;
    }
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }, [isDisabled, sql]);

  return (
    <button type="button" onClick={onCopy} disabled={isDisabled} style={{ padding: "8px 10px" }}>
      {isDisabled ? (disabledText ?? "No unused indexes to copy") : copied ? "Copied" : "Copy DROP INDEX SQL"}
    </button>
  );
};

export default CopyDropIndexSqlButton;

