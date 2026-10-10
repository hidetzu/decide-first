// Usage: node src/cli.ts <issue-url>   (exit 0 READY, 1 not READY, 2 could not judge)
import { runCli } from "./cli-run.ts";

const r = await runCli(process.argv[2], { token: process.env.GITHUB_TOKEN });
if (r.out) console.log(r.out);
if (r.err) console.error(r.err);
process.exit(r.code);
