import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

/** Browser client; talks to /api/auth on the current origin. */
export const authClient = createAuthClient({ plugins: [magicLinkClient()] });
