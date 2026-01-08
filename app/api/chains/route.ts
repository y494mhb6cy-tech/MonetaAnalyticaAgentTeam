import { NextResponse } from "next/server";
import { getStore, upsertChain } from "../../../lib/store";
import { Chain } from "../../../lib/types";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({ chains: store.chains });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Chain;
  await upsertChain(body);
  return NextResponse.json({ chain: body });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Chain;
  await upsertChain(body);
  return NextResponse.json({ chain: body });
}
