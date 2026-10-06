import { Router } from "express";
import { checkServices } from "../services/health.service";

const router = Router();

router.get("/health", async (_req, res) => {
	const report = await checkServices();
	res.status(report.status === "ok" ? 200 : 503).json(report);
});

router.get("/status", async (_req, res) => {
	const report = await checkServices();
	const rows = Object.entries(report.services)
		.map(([name, s]) => `<tr><td>${name}</td><td class="${s.status}">${s.status}</td><td>${s.latencyMs} ms</td></tr>`)
		.join("");
	res.status(report.status === "ok" ? 200 : 503).type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="30"><title>Status</title>
<style>body{font-family:sans-serif;margin:2rem}.ok{color:green}.down{color:red}</style></head>
<body><h1>Status: ${report.status}</h1>
<table border="1" cellpadding="6"><tr><th>Service</th><th>State</th><th>Latency</th></tr>${rows}</table>
<p>Checked at ${report.checkedAt}</p></body></html>`);
});

export default router;