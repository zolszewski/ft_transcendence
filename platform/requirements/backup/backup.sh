#!/bin/sh
set -eu
INTERVAL=${BACKUP_INTERVAL:-3600}
RETRY=${BACKUP_RETRY:-60}
KEEP=${BACKUP_KEEP:-7}
mkdir -p /backups
until pg_isready -q; do
	echo "waiting for postgresql..."
	sleep 2
done
while true; do
	FILE="/backups/academic-$(date +%Y%m%d-%H%M%S).sql.gz"
	if pg_dump --clean --if-exists -f /tmp/dump.sql && gzip -c /tmp/dump.sql > "$FILE"; then
		echo "backup written: $FILE"
		ls -1t /backups/academic-*.sql.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
		sleep "$INTERVAL"
	else
		echo "Backup FAILED, retrying in ${RETRY}s" >&2
		rm -f "$FILE"
		sleep "$RETRY"
	fi
done
