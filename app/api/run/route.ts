import { NextResponse } from "next/server";
import { addArtifacts, addRun, getStore, newId } from "../../../lib/store";
import { estimateCostBand, stringifyMarkdown } from "../../../lib/run-utils";
import { buildDocx, buildPdf } from "../../../lib/artifacts";
import { runTaskWithProvider } from "../../../lib/ai";
import { Mode, RunInput, StructuredOutput } from "../../../lib/types";

type RunRequest = {
  taskId?: string;
  chainId?: string;
  mode: Mode;
  inputs: RunInput[];
  deepModeEnabled?: boolean;
};

function ensureInputs(inputs: RunInput[]) {
  return inputs.filter((input) => input.value.trim().length > 0);
}

function countInputChars(inputs: RunInput[]) {
  return inputs.reduce((total, input) => total + input.value.length, 0);
}

function combineChainOutputs(chainName: string, outputs: StructuredOutput[]) {
  return {
    title: `Chain: ${chainName}`,
    sections: outputs.flatMap((output) => [
      {
        heading: output.title,
        bullets: output.sections.flatMap((section) => section.bullets),
        narrative: output.sections.map((section) => section.narrative).join(" ")
      }
    ]),
    risks: outputs.flatMap((output) => output.risks),
    next_actions: outputs.flatMap((output) => output.next_actions),
    contract_alignment: outputs[0]?.contract_alignment
  } as StructuredOutput;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunRequest;
    const inputs = ensureInputs(body.inputs || []);

    if (!inputs.length) {
      return NextResponse.json({ error: "Provide at least one input." }, { status: 400 });
    }

    if (body.mode === "deep" && !body.deepModeEnabled) {
      return NextResponse.json({ error: "Deep mode is disabled in Settings." }, { status: 400 });
    }

    const store = await getStore();
    const inputChars = countInputChars(inputs);
    const estimatedCostBand = estimateCostBand(inputChars);

    let output: StructuredOutput | null = null;
    let runName = "Moneta Analytica Output";

    if (body.taskId) {
      const task = store.tasks.find((item) => item.id === body.taskId);
      if (!task) {
        return NextResponse.json({ error: "Task not found." }, { status: 404 });
      }
      runName = task.name;
      output = await runTaskWithProvider(task, inputs, body.mode);
    }

    if (body.chainId) {
      const chain = store.chains.find((item) => item.id === body.chainId);
      if (!chain) {
        return NextResponse.json({ error: "Chain not found." }, { status: 404 });
      }
      const outputs: StructuredOutput[] = [];
      for (const step of chain.steps) {
        const task = store.tasks.find((item) => item.id === step.taskId);
        if (!task) {
          continue;
        }
        outputs.push(await runTaskWithProvider(task, inputs, step.modeOverride || body.mode));
      }
      output = combineChainOutputs(chain.name, outputs);
      runName = chain.name;
    }

    if (!output) {
      return NextResponse.json({ error: "Select a task or chain." }, { status: 400 });
    }

    const runId = newId("run");
    const run = {
      id: runId,
      taskId: body.taskId,
      chainId: body.chainId,
      mode: body.mode,
      inputs,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "completed" as const,
      outputArtifactIds: [],
      stats: {
        inputChars,
        estimatedCostBand
      }
    };

    const [docxBuffer, pdfBuffer] = await Promise.all([buildDocx(output), buildPdf(output)]);
    const baseName = `Moneta Analytica — ${runName} — ${new Date().toISOString().slice(0, 10)}`;

    const artifacts = [
      {
        id: newId("artifact"),
        runId,
        name: baseName,
        type: "docx" as const,
        pathOrDataUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuffer.toString("base64")}`,
        createdAt: new Date().toISOString()
      },
      {
        id: newId("artifact"),
        runId,
        name: baseName,
        type: "pdf" as const,
        pathOrDataUrl: `data:application/pdf;base64,${Buffer.from(pdfBuffer).toString("base64")}`,
        createdAt: new Date().toISOString()
      },
      {
        id: newId("artifact"),
        runId,
        name: baseName,
        type: "json" as const,
        pathOrDataUrl: `data:application/json;base64,${Buffer.from(JSON.stringify(output, null, 2)).toString("base64")}`,
        createdAt: new Date().toISOString()
      }
    ];

    run.outputArtifactIds = artifacts.map((artifact) => artifact.id);

    await addRun(run);
    await addArtifacts(artifacts);

    return NextResponse.json({
      run,
      artifacts,
      output,
      markdown: stringifyMarkdown(output)
    });
  } catch (error) {
    return NextResponse.json({ error: "Unable to run task." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
