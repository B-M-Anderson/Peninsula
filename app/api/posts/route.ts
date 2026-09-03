import { NextResponse } from "next/server";
import { getPosts } from "../../lib/posts";

// JSON view of the merged "Recent posts" list. The homepage no longer fetches
// this (it renders the same data on the server); it stays for anything
// external that wants the feed. Always computed at request time: the feed
// fetches inside getPosts() are cached for 15 minutes by Next's data cache, and
// a failed fetch is not cached, so a hiccup never bakes an empty list.
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getPosts();
  return NextResponse.json(
    { posts },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } }
  );
}
