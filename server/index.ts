import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { evaluateRequestSchema } from "@shared/schema";
import { evaluatePriorAuthorization } from "./decisionEngine";
import { generatePrDraftFromJiraIssue, getJiraIssue } from "./integrations.jiraIbmBob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "prior-auth-decision-system" });
});

app.post("/api/evaluate", (req, res) => {
  const parsed = evaluateRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request payload",
      issues: parsed.error.issues,
    });
  }

  const result = evaluatePriorAuthorization(parsed.data);
  return res.json(result);
});

app.get("/api/jira/issue/:issueKey", async (req, res) => {
  try {
    const issue = await getJiraIssue(req.params.issueKey);
    return res.json(issue);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to fetch Jira issue",
    });
  }
});

app.post("/api/jira/generate-pr-draft", async (req, res) => {
  const body = req.body as {
    issueKey?: string;
    repositoryContext?: string;
    implementationNotes?: string;
  };

  if (!body.issueKey || !body.repositoryContext) {
    return res.status(400).json({
      message: "issueKey and repositoryContext are required",
    });
  }

  try {
    const output = await generatePrDraftFromJiraIssue({
      issueKey: body.issueKey,
      repositoryContext: body.repositoryContext,
      implementationNotes: body.implementationNotes,
    });
    return res.json(output);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to generate PR draft",
    });
  }
});

const port = Number(process.env.PORT ?? 5000);

async function start() {
  if (process.env.NODE_ENV === "development") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "../client"),
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "../dist/public")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "../dist/public/index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
