import { useEffect } from "react";
import { initTelemetry, teardownTelemetry } from "../telemetry/envTelemetry";

export function useInitTelemetry() {
  useEffect(() => {
    initTelemetry();
    return () => teardownTelemetry();
  }, []);
}

export default useInitTelemetry;
