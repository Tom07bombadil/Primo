import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const requiredEnv = ["JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "IBM_BOB_URL", "IBM_BOB_API_KEY"] as const;

for (const variable of requiredEnv) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const jiraBaseUrl = process.env.JIRA_BASE_URL!.replace(/\/$/, "");
const jiraEmail = process.env.JIRA_EMAIL!;
const jiraApiToken = process.env.JIRA_API_TOKEN!;
const ibmBobUrl = process.env.IBM_BOB_URL!.replace(/\/$/, "");
const ibmBobApiKey = process.env.IBM_BOB_API_KEY!;
const ibmBobModel = process.env.IBM_BOB_MODEL ?? "ibm/bob";

const jiraAuthHeader = `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;

async function jiraRequest(path: string, init: RequestInit = {}) {
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

async function callIbmBob(systemPrompt: string, userPrompt: string) {
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

const server = new McpServer({
  name: "jira-ibm-bob",
  version: "1.0.0",
});

server.registerTool(
  "jira_list_projects",
  {
    title: "List Jira projects",
    description: "Lists projects available to the authenticated Jira user.",
    inputSchema: {},
  },
  async () => {
    const projects = await jiraRequest("/rest/api/3/project/search");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(projects.values ?? projects, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "jira_search_issues",
  {
    title: "Search Jira issues",
    description: "Searches Jira issues with JQL.",
    inputSchema: {
      jql: z.string().min(1),
      maxResults: z.number().int().min(1).max(100).default(20),
    },
  },
  async ({ jql, maxResults }) => {
    const query = new URLSearchParams({
      jql,
      maxResults: String(maxResults),
      fields: "summary,status,assignee,priority,issuetype,updated",
    });

    const issues = await jiraRequest(`/rest/api/3/search?${query.toString()}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(issues, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "jira_get_issue",
  {
    title: "Get Jira issue",
    description: "Fetches detailed Jira issue data by issue key.",
    inputSchema: {
      issueKey: z.string().min(1),
    },
  },
  async ({ issueKey }) => {
    const issue = await jiraRequest(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(issue, null, 2),
        },
      ],
    };
  }
);

server.registerTool(
  "jira_summarize_with_ibm_bob",
  {
    title: "Summarize Jira issue with IBM bob",
    description: "Reads a Jira issue, then asks IBM bob for summary, risks, and next steps.",
    inputSchema: {
      issueKey: z.string().min(1),
      prompt: z
        .string()
        .optional()
        .default("Summarize this issue and provide suggested next actions for the engineering team."),
    },
  },
  async ({ issueKey, prompt }) => {
    const issue = await jiraRequest(
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description,comment,status,priority,assignee,reporter,issuetype,updated,created`
    );

    const ibmResponse = await callIbmBob(
      "You are IBM bob, a project management assistant specialized in Jira issue triage.",
      `${prompt}\n\nIssue payload:\n${JSON.stringify(issue, null, 2)}`
    );

    return {
      content: [
        {
          type: "text",
          text: ibmResponse,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start jira-ibm-bob MCP server", error);
  process.exit(1);
});
