import type { Check } from "../types.ts";
import { acceptanceCriteria } from "./acceptance-criteria.ts";
import { openQuestions } from "./open-questions.ts";
import { verification } from "./verification.ts";

/** The checks a verdict is derived from, in display order. ⚠ Adding one is a SPEC change. */
export const DEFAULT_CHECKS: readonly Check[] = [acceptanceCriteria, verification, openQuestions];
