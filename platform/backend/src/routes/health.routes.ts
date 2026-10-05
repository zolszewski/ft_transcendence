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
<html lang="fr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="30"><title>Statut</title>
<style>body{font-family:sans-serif;margin:2rem}.ok{color:green}.down{color:red}</style></head>
<body><h1>Statut : ${report.status}</h1>
<table border="1" cellpadding="6"><tr><th>Service</th><th>État</th><th>Latence</th></tr>${rows}</table>
<p>Vérifié à ${report.checkedAt}</p></body></html>`);
});

export default router;