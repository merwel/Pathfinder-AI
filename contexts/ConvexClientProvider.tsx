"use client";

import { ReactNode, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

// Dummy WebSocket implementation when Convex deployment is not yet configured
// This prevents Convex from attempting to connect to placeholder.convex.cloud
// which triggers [CONVEX FATAL ERROR] and crashes the React app.
class DisabledWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = DisabledWebSocket.CLOSED;
  onopen: any = null;
  onclose: any = null;
  onerror: any = null;
  onmessage: any = null;

  constructor() {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return false; }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
  const isRealConvexUrl = Boolean(
    convexUrl &&
    !convexUrl.includes("placeholder") &&
    convexUrl.startsWith("https://")
  );

  const convex = useMemo(() => {
    if (!isRealConvexUrl) {
      return new ConvexReactClient("https://offline-dev.convex.cloud", {
        webSocketConstructor: DisabledWebSocket as any,
        unsavedChangesWarning: false,
      });
    }
    return new ConvexReactClient(convexUrl);
  }, [convexUrl, isRealConvexUrl]);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth as any}>
      {children}
    </ConvexProviderWithClerk>
  );
}
