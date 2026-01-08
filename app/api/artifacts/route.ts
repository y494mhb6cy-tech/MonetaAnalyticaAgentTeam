import { NextResponse } from "next/server";
import { getStore } from "../../../lib/store";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({ artifacts: store.artifacts, runs: store.runs, tasks: store.tasks, chains: store.chains });
}
