const { spawn } = require("child_process");
const fs = require("fs");

async function main() {
	const token = fs.readFileSync(process.env.VAULT_TOKEN_FILE, "utf8").trim();
	const res = await fetch(`${process.env.VAULT_ADDR}/v1/secret/data/app`, {
		headers: { "X-Vault-Token": token },
	});
	if (!res.ok) {
		console.error(`vault: lecture des secrets impossible (HTTP ${res.status})`);
		process.exit(1);
	}
	const secrets = (await res.json()).data.data;
	const [cmd, ...args] = process.argv.slice(2);
	const child = spawn(cmd, args, { stdio: "inherit", env: { ...process.env, ...secrets } });
	child.on("exit", (code) => process.exit(code ?? 1));
}

main();
