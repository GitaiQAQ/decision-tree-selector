import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type EvidenceFailureKind =
  | "assertion"
  | "timeout"
  | "storybook_startup"
  | "process_crash"
  | "network";

export interface EvidenceFailureContext {
  phase: "before_caseid" | "after_caseid";
  kind: EvidenceFailureKind;
}

export interface EvidenceClassification {
  eligible: boolean;
  reason: string;
}

export function classifyEvidenceFailure(
  context: EvidenceFailureContext,
): EvidenceClassification {
  if (context.kind === "timeout") {
    if (context.phase === "before_caseid") {
      return { eligible: false, reason: "timeout before caseId resolution" };
    }
    return { eligible: true, reason: "timeout after caseId resolution" };
  }

  if (context.kind === "assertion") {
    return { eligible: true, reason: "assertion failure" };
  }

  return { eligible: false, reason: "infrastructure failure" };
}

export interface BuildEvidencePathsInput {
  caseId: string;
  repoRoot: string;
  cwd?: string;
}

export function buildEvidencePaths(input: BuildEvidencePathsInput): {
  artifactRoot: string;
  screenshotPath: string;
  metadataPath: string;
} {
  const artifactRoot = join(input.repoRoot, "artifacts", "phase1-evidence");
  return {
    artifactRoot,
    screenshotPath: join(artifactRoot, `${input.caseId}.png`),
    metadataPath: join(artifactRoot, `${input.caseId}.json`),
  };
}

export interface CaptureStorybookEvidenceInput {
  caseId: string;
  storyId: string;
  fixture: unknown;
  errorMessage: string;
  repoRoot: string;
  storybookBaseUrl: string;
}

export async function captureStorybookEvidence(
  input: CaptureStorybookEvidenceInput,
): Promise<{ screenshotPath: string; metadataPath: string }> {
  const paths = buildEvidencePaths({
    caseId: input.caseId,
    repoRoot: input.repoRoot,
  });

  await mkdir(paths.artifactRoot, { recursive: true });

  const url = `${input.storybookBaseUrl.replace(/\/$/, "")}/iframe.html?id=${input.storyId}`;

  const metadata = {
    caseId: input.caseId,
    storyId: input.storyId,
    fixture: input.fixture,
    errorMessage: input.errorMessage,
    storyUrl: url,
    screenshotPath: paths.screenshotPath,
  };

  try {
    const playwright = await import("playwright");
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.screenshot({ path: paths.screenshotPath, fullPage: true });
    await browser.close();
  } catch {
    await writeFile(paths.screenshotPath, "", "utf8");
  }

  await writeFile(paths.metadataPath, JSON.stringify(metadata, null, 2), "utf8");

  return {
    screenshotPath: paths.screenshotPath,
    metadataPath: paths.metadataPath,
  };
}
