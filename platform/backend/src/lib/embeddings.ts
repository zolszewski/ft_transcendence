import { env, pipeline } from "@huggingface/transformers";

env.cacheDir = process.env.MODEL_CACHE_DIR ?? "/opt/model-cache";

const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
let embedder: any = null;

async function getEmbedder() {
	if (!embedder)
		embedder = await pipeline("feature-extraction", MODEL_NAME);
	return embedder;
}

export async function computeEmbedding(text: string): Promise<number[]> {
	const extractor = await getEmbedder();
	const output = await extractor(text, { pooling: "mean", normalize: true });
	return Array.from(output.data as Float32Array);
}
