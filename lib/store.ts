import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { StoreData, TaskRabbit, Chain, Run, Artifact } from "./types";

const STORE_PATH = path.join("/tmp", "moneta-analytica-store.json");
const SEED_PATH = path.join(process.cwd(), "data", "seed.json");

async function ensureStore(): Promise<StoreData> {
  try {
    const data = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(data) as StoreData;
  } catch {
    const seed = await fs.readFile(SEED_PATH, "utf8");
    const parsed = JSON.parse(seed) as StoreData;
    await fs.writeFile(STORE_PATH, JSON.stringify(parsed, null, 2), "utf8");
    return parsed;
  }
}

async function saveStore(store: StoreData) {
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function getStore() {
  return ensureStore();
}

export async function upsertTask(task: TaskRabbit) {
  const store = await ensureStore();
  const index = store.tasks.findIndex((item) => item.id === task.id);
  if (index >= 0) {
    store.tasks[index] = task;
  } else {
    store.tasks.push(task);
  }
  await saveStore(store);
  return task;
}

export async function upsertChain(chain: Chain) {
  const store = await ensureStore();
  const index = store.chains.findIndex((item) => item.id === chain.id);
  if (index >= 0) {
    store.chains[index] = chain;
  } else {
    store.chains.push(chain);
  }
  await saveStore(store);
  return chain;
}

export async function addRun(run: Run) {
  const store = await ensureStore();
  store.runs.unshift(run);
  await saveStore(store);
  return run;
}

export async function addArtifacts(artifacts: Artifact[]) {
  const store = await ensureStore();
  store.artifacts.unshift(...artifacts);
  await saveStore(store);
  return artifacts;
}

export function newId(prefix: string) {
  return `${prefix}_${nanoid(10)}`;
}
