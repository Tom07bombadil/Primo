import { z } from "zod";

const requiredEnv = ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "IBM_BOB_URL", "IBM_BOB_API_KEY"] as const;

export type JiraIssue = {
  key: string;
  fields: {
    summary?: string;
    description?: unknown;
    status?: { name?: string };
    priority?: { name?: string };
    assignee?: { displayName?: string };
    reporter?: { displayName?: string };
    updated?: string;
    created?: string;
    comment?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type GeneratedPrDraft = {
  issueKey: string;
  branchName: string;
  summary: string;
  implementationPlan: string[];
  proposedCode: string;
  testPlan: string[];
  prTitle: string;
  prBody: string;
};

const generatedPrDraftSchema = z.object({
  branchName: z.string().min(1),
  summary: z.string().min(1),
  implementationPlan: z.array(z.string()).min(1),
  proposedCode: z.string().min(1),
  testPlan: z.array(z.string()).default([]),
  prTitle: z.string().min(1),
  prBody: z.string().min(1),
});

function getConfig() {
  const missing = requiredEnv.filter((variable) => !process.env[variable]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    jiraBaseUrl: process.env.JIRA_BASE_URL!.replace(/\/$/, ""),
    jiraEmail: process.env.JIRA_EMAIL!,
    jiraApiToken: process.env.JIRA_API_TOKEN!,
    ibmBobUrl: process.env.IBM_BOB_URL!.replace(/\/$/, ""),
    ibmBobApiKey: process.env.IBM_BOB_API_KEY!,
    ibmBobModel: process.env.IBM_BOB_MODEL ?? "ibm/bob",
  };
}

function parseJsonFromModelOutput(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch) {
      return JSON.parse(fencedMatch[1]);
    }
    throw new Error("IBM bob response was not valid JSON.");
  }
}

export async function jiraRequest(path: string, init: RequestInit = {}) {
  const { jiraBaseUrl, jiraEmail, jiraApiToken } = getConfig();
  const jiraAuthHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;

  const response = await fetch(`${jiraBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: jiraAuthHeader,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jira API error (${response.status}): ${body}`);
  }

  return response.json();
}

export async function callIbmBob(systemPrompt: string, userPrompt: string) {
  const { ibmBobUrl, ibmBobApiKey, ibmBobModel } = getConfig();
  const response = await fetch(`${ibmBobUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ibmBobApiKey}`,
    },
    body: JSON.stringify({
      model: ibmBobModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`IBM bob API error (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "IBM bob returned an empty response.";
}

export async function getJiraIssue(issueKey: string): Promise<JiraIssue> {
  const issue = await jiraRequest(
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description,comment,status,priority,assignee,reporter,issuetype,updated,created`
  );

  return issue as JiraIssue;
}

export async function generatePrDraftFromJiraIssue(input: {
  issueKey: string;
  repositoryContext: string;
  implementationNotes?: string;
}) {
  const issue = await getJiraIssue(input.issueKey);

  const modelOutput = await callIbmBob(
    "You are IBM bob, a senior staff engineer. Produce actionable implementation drafts from Jira tickets.",
    [
      "Create a software implementation draft from the Jira issue context below.",
      "Return JSON ONLY, with fields: branchName, summary, implementationPlan (string[]), proposedCode, testPlan (string[]), prTitle, prBody.",
      "Keep proposedCode concise but concrete (include filenames and code snippets).",
      `Repository context:\n${input.repositoryContext}`,
      input.implementationNotes ? `Additional implementation notes:\n${input.implementationNotes}` : "",
      `Jira issue payload:\n${JSON.stringify(issue, null, 2)}`,
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  const parsed = generatedPrDraftSchema.parse(parseJsonFromModelOutput(modelOutput));

  const draft: GeneratedPrDraft = {
    issueKey: input.issueKey,
    branchName: parsed.branchName,
    summary: parsed.summary,
    implementationPlan: parsed.implementationPlan,
    proposedCode: parsed.proposedCode,
    testPlan: parsed.testPlan,
    prTitle: parsed.prTitle,
    prBody: parsed.prBody,
  };

  return { issue, draft };
}
