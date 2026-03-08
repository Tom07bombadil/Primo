import { z } from "zod";

export const criterionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean().default(true),
  evidenceHints: z.array(z.string()).default([]),
});

export const policySchema = z.object({
  policyName: z.string().min(1),
  policyVersion: z.string().min(1).default("draft"),
  criteria: z.array(criterionSchema).min(1),
});

export const extractedFactSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  sourceDocument: z.string().min(1),
});

export const evaluateRequestSchema = z.object({
  request: z.object({
    memberId: z.string().min(1),
    patientName: z.string().min(1),
    diagnosisCodes: z.array(z.string()).default([]),
    procedureCodes: z.array(z.string()).default([]),
    serviceRequested: z.string().min(1),
  }),
  policy: policySchema,
  clinicalFacts: z.array(extractedFactSchema).default([]),
});

export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;

export type CriteriaEvaluation = {
  criterionId: string;
  description: string;
  required: boolean;
  status: "Met" | "Not Met" | "Insufficient Evidence";
  matchedEvidence: extractedFact[];
  rationale: string;
};

export type extractedFact = z.infer<typeof extractedFactSchema>;

export type EvaluateResponse = {
  decision: "APPROVED" | "DENIED" | "MANUAL_REVIEW";
  confidenceScore: number;
  policyName: string;
  policyVersion: string;
  criteriaEvaluation: CriteriaEvaluation[];
  missingCriteria: string[];
  auditTrail: {
    timestamp: string;
    requestMemberId: string;
    policyCriteriaCount: number;
    factsProcessed: number;
  };
  explanation: string;
};
