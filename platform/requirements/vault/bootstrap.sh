#!/bin/sh
set -eu

export VAULT_ADDR=http://vault:8200
KEYS=/keys
SHARED=/shared

echo "waiting for the vault"
until wget -q -O /dev/null "$VAULT_ADDR/v1/sys/health?uninitcode=200&sealedcode=200"; do
	sleep 2
done

if vault status -format=json | grep -q '"initialized": false'; then
	vault operator init -key-shares=1 -key-threshold=1 > "$KEYS/init.txt"
	sed -n 's/^Unseal Key 1: //p' "$KEYS/init.txt" > "$KEYS/unseal.key"
	sed -n 's/^Initial Root Token: //p' "$KEYS/init.txt" > "$KEYS/root.token"
	chmod 600 "$KEYS"/*
	echo "initialized vault"
fi

if vault status -format=json | grep -q '"sealed": true'; then
	vault operator unseal "$(cat "$KEYS/unseal.key")" > /dev/null
	echo "unlocked vault"
fi

export VAULT_TOKEN="$(cat "$KEYS/root.token")"

if ! vault secrets list | grep -q '^secret/'; then
	vault secrets enable -path=secret kv-v2
fi

cat > /tmp/backend-policy.hcl <<'EOF'
path "secret/data/app" {
  capabilities = ["read"]
}
EOF
vault policy write backend /tmp/backend-policy.hcl > /dev/null

if [ ! -f "$SHARED/backend.token" ]; then
	vault token create -policy=backend -period=768h -field=token > "$SHARED/backend.token"
	echo "backend token created"
fi

if ! vault kv get secret/app > /dev/null 2>&1; then
	vault kv put secret/app \
		SESSION_SECRET="${SESSION_SECRET:?SESSION_SECRET is missing from .env}" \
		GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:?GITHUB_CLIENT_ID is missing from .env}" \
		GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:?GITHUB_CLIENT_SECRET is missing from .env}" \
		DATABASE_URL="${DATABASE_URL:?DATABASE_URL is missing from .env}" > /dev/null
	echo "secrets put in the vault"
fi

echo "bootstrap finished"
