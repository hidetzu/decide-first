// Usage: node src/cli.ts <issue-url>   (exit 0 READY, 1 not READY, 2 could not judge)
import { assess } from "./app.ts";
import { render } from "./render-text.ts";

const url = process.argv[2];
if (!url) {
  console.error("使い方: node src/cli.ts https://github.com/owner/repo/issues/123");
  process.exit(2);
}
const result = await assess(url, { token: process.env.GITHUB_TOKEN });
if (!result.ok) {
  console.error(result.message);
  process.exit(2);
}
console.log(render(result.evaluation));
process.exit(result.evaluation.verdict === "READY" ? 0 : 1);
