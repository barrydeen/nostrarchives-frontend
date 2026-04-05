import { NextRequest, NextResponse } from "next/server";
import { nip19 } from "nostr-tools";

/**
 * Proxy that resolves bare Nostr entities in the URL path.
 * e.g. /npub1...  -> /profiles/<hex>
 *      /nevent1... -> /notes/<hex>
 */

export function proxy(request: NextRequest) {
  const segment = request.nextUrl.pathname.slice(1);

  if (!segment || segment.includes("/")) {
    return NextResponse.next();
  }

  try {
    const decoded = nip19.decode(segment);

    switch (decoded.type) {
      case "npub":
        return NextResponse.redirect(
          new URL(`/profiles/${decoded.data}`, request.url),
        );
      case "nprofile":
        return NextResponse.redirect(
          new URL(`/profiles/${decoded.data.pubkey}`, request.url),
        );
      case "note":
        return NextResponse.redirect(
          new URL(`/notes/${decoded.data}`, request.url),
        );
      case "nevent":
        return NextResponse.redirect(
          new URL(`/notes/${decoded.data.id}`, request.url),
        );
      case "naddr":
        return NextResponse.redirect(
          new URL(`/profiles/${decoded.data.pubkey}`, request.url),
        );
      default:
        return NextResponse.next();
    }
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/:entity((?:npub1|nprofile1|note1|nevent1|naddr1).+)"],
};
