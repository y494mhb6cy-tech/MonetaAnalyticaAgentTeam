import { NextResponse } from "next/server";
import { getStore, upsertTask } from "../../../lib/store";
import { TaskRabbit } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({ tasks: store.tasks, contractDefaults: store.contractDefaults });
}

export async function POST(request: Request) {
  const body = (await request.json()) as TaskRabbit;
  await upsertTask(body);
  return NextResponse.json({ task: body });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as TaskRabbit;
  await upsertTask(body);
  return NextResponse.json({ task: body });
}
