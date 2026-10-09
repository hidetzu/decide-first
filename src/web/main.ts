import { createIssueReadyServer } from "./server.ts";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "127.0.0.1";
createIssueReadyServer({ token: process.env.GITHUB_TOKEN }).listen(PORT, HOST, () => console.log(`issue-ready: http://${HOST}:${PORT}/`));
