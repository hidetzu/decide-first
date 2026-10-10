import type { Check } from "../types.ts";
import { acceptanceCriteria } from "./acceptance-criteria.ts";
import { goal } from "./goal.ts";
import { hasBody } from "./has-body.ts";
import { issueOpen } from "./issue-open.ts";
import { openQuestions } from "./open-questions.ts";
import { scope } from "./scope.ts";
import { verification } from "./verification.ts";

/** The checks a verdict is derived from, in display order. ⚠ Adding one is a SPEC change. */
export const DEFAULT_CHECKS: readonly Check[] = [goal, scope, acceptanceCriteria, verification, openQuestions, issueOpen, hasBody];
