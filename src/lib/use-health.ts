"use client";

import * as React from "react";
import { fetchHealth } from "./api-client";

export interface HealthState {
  ok: boolean;
  hasApiKey: boolean;
  defaultModel: string;
  loaded: boolean;
}

export function useHealth(): HealthState & { refresh: () => void; mock: boolean; setMock: (v: boolean) => void } {
  const [state, setState] = React.useState<HealthState>({
    ok: false,
    hasApiKey: false,
    defaultModel: "s2.1-pro-free",
    loaded: false,
  });
  const [mock, setMock] = React.useState(false);

  const refresh = React.useCallback(() => {
    fetchHealth()
      .then((h) => setState({ ...h, loaded: true }))
      .catch(() =>
        setState((s) => ({ ...s, loaded: true, ok: false, hasApiKey: false })),
      );
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh, mock, setMock };
}
