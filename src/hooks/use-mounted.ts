import * as React from "react";

const emptySubscribe = () => () => {};

/**
 * True hanya setelah hydration di client — menghindari mismatch SSR
 * untuk nilai yang bergantung pada preferensi browser (mis. tema).
 */
export function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
