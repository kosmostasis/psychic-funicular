/** Admin-assisted identity linking — no automated cross-platform fusion. */

import type { Source } from "./events.js";
export type { Source };

export interface PlatformIdentity {
  source: Source;
  platformUserId: string;
  handle: string;
  profileUrl?: string;
}

export interface IdentityLink {
  link_id: string;
  /** Canonical or primary handle chosen by admin. */
  primary_handle: string;
  identities: PlatformIdentity[];
  /** Who linked and when. */
  created_by: string;
  created_at: string; // ISO
  /** Evidence: e.g. "User stated in Discord #intro" or link to profile. */
  evidence: string;
  /** Audit: last modified. */
  updated_at: string;
  updated_by?: string;
}
