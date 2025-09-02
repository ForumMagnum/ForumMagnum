import React from "react";

const _requestStatusManager = React.cache(() => {
  let status: number|null = null;
  let waiters: Array<(v: number) => void> = [];

  const getStatus = async (): Promise<number> => {
    if (status !== null) return status;
    return new Promise<number>((resolve) => {
      waiters.push(resolve);
    });
  };

  const setStatus = (s: number): void => {
    const firstSet = (status === null);
    status = s;

    if (firstSet) {
      for (const resolve of waiters) {
        resolve(status);
      }
      waiters = [];
    }
  };

  return { getStatus, setStatus };
});

export function setRequestStatus(status: number) {
  _requestStatusManager().setStatus(status);
}

export async function getRequestStatus() {
  return _requestStatusManager().getStatus();
}
