const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "En attente de validation",
  PUBLISHED: "Publié",
  REJECTED: "Rejeté",
  PENDING: "En attente",
  APPROVED: "Approuvé",
};

export function articleStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statsCountLabel(key: string): string {
  return STATUS_LABELS[key] ?? key.charAt(0) + key.slice(1).toLowerCase();
}
