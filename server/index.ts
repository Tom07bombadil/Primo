import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { evaluateRequestSchema } from "@shared/schema";
import { evaluatePriorAuthorization } from "./decisionEngine";

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
