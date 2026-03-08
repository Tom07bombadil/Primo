import type { CriteriaEvaluation, EvaluateRequest, EvaluateResponse, extractedFact } from "@shared/schema";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const matchEvidence = (criterionText: string, evidenceHints: string[], facts: extractedFact[]): extractedFact[] => {
  const criterionTokens = new Set(normalize(criterionText).split(" ").filter((token) => token.length > 3));
  const hints = evidenceHints.map(normalize).filter(Boolean);

  return facts.filter((fact) => {
    const factText = `${fact.label} ${fact.value}`;
    const normalizedFact = normalize(factText);

    if (hints.some((hint) => normalizedFact.includes(hint))) {
      return true;
    }

    let overlap = 0;
    for (const token of Array.from(criterionTokens)) {
      if (normalizedFact.includes(token)) {
        overlap += 1;
      }
    }

    return overlap >= Math.min(2, criterionTokens.size);
  });
};

export const evaluatePriorAuthorization = (input: EvaluateRequest): EvaluateResponse => {
  const criteriaEvaluation: CriteriaEvaluation[] = input.policy.criteria.map((criterion) => {
    const matchedEvidence = matchEvidence(criterion.description, criterion.evidenceHints, input.clinicalFacts);

    if (matchedEvidence.length > 0) {
      return {
        criterionId: criterion.id,
        description: criterion.description,
        required: criterion.required,
        status: "Met",
        matchedEvidence,
        rationale: `Found ${matchedEvidence.length} evidence item(s) supporting this criterion.`,
      };
    }

    return {
      criterionId: criterion.id,
      description: criterion.description,
      required: criterion.required,
      status: input.clinicalFacts.length === 0 ? "Insufficient Evidence" : "Not Met",
      matchedEvidence: [],
      rationale:
        input.clinicalFacts.length === 0
          ? "No clinical facts were submitted for evidence matching."
          : "No supporting evidence found in submitted clinical facts.",
    };
  });

  const requiredCriteria = criteriaEvaluation.filter((item) => item.required);
  const requiredMet = requiredCriteria.filter((item) => item.status === "Met").length;
  const requiredNotMet = requiredCriteria.filter((item) => item.status === "Not Met").length;
  const requiredInsufficient = requiredCriteria.filter((item) => item.status === "Insufficient Evidence").length;

  let decision: EvaluateResponse["decision"] = "MANUAL_REVIEW";

  if (requiredNotMet > 0) {
    decision = "DENIED";
  } else if (requiredInsufficient > 0) {
    decision = "MANUAL_REVIEW";
  } else if (requiredMet === requiredCriteria.length) {
    decision = "APPROVED";
  }

  const confidenceScore = Math.max(
    45,
    Math.min(
      99,
      Math.round((requiredMet / Math.max(1, requiredCriteria.length)) * 100 - requiredInsufficient * 8 - requiredNotMet * 15),
    ),
  );

  const missingCriteria = requiredCriteria
    .filter((item) => item.status !== "Met")
    .map((item) => `${item.criterionId}: ${item.description}`);

  const explanationByDecision: Record<EvaluateResponse["decision"], string> = {
    APPROVED: `All mandatory criteria in policy "${input.policy.policyName}" are met by submitted evidence.`,
    DENIED: `One or more mandatory criteria in policy "${input.policy.policyName}" were not met.`,
    MANUAL_REVIEW: `Submitted documentation is insufficient for an automatic determination against policy "${input.policy.policyName}".`,
  };

  return {
    decision,
    confidenceScore,
    policyName: input.policy.policyName,
    policyVersion: input.policy.policyVersion,
    criteriaEvaluation,
    missingCriteria,
    explanation: explanationByDecision[decision],
    auditTrail: {
      timestamp: new Date().toISOString(),
      requestMemberId: input.request.memberId,
      policyCriteriaCount: input.policy.criteria.length,
      factsProcessed: input.clinicalFacts.length,
    },
  };
};
