// Runs the Nitro server across multiple worker processes (one per CPU core,
// capped) instead of a single process. Node's event loop already keeps
// individual requests from blocking each other while awaiting I/O (OpenAI
// calls, DB queries), but CPU-bound work (JSON parsing, ZIP compression,
// bcrypt) still runs on one thread — clustering gives that work its own
// process so it can never stall requests handled by another worker.
import cluster from "node:cluster";
import os from "node:os";

const MAX_WORKERS = 4;
const numWorkers = Math.max(1, Math.min(os.cpus().length, Number(process.env.WEB_CONCURRENCY) || MAX_WORKERS));

if (cluster.isPrimary) {
  console.log(`[cluster] starting ${numWorkers} worker(s)`);
  for (let i = 0; i < numWorkers; i++) cluster.fork();
  cluster.on("exit", (worker, code, signal) => {
    console.error(`[cluster] worker ${worker.process.pid} exited (${signal || code}), restarting…`);
    cluster.fork();
  });
} else {
  await import("./.output/server/index.mjs");
}
