import { computeEmbedding } from "../src/lib/embeddings";

const start = Date.now();

computeEmbedding("La civilisation perse au Ve siecle avant notre ere")
	.then((vector) => {
		console.log("OK - embedding length:", vector.length);
		console.log("First 5 values:", vector.slice(0, 5));
		console.log("Time (ms):", Date.now() - start);
		process.exit(0);
	})
	.catch((error) => {
		console.error("FAILED:", error);
		process.exit(1);
	});
