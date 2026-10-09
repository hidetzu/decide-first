import { createDecideFirstServer } from "./server.ts";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "127.0.0.1";
createDecideFirstServer({ token: process.env.GITHUB_TOKEN }).listen(PORT, HOST, () => console.log(`decide-first: http://${HOST}:${PORT}/`));
