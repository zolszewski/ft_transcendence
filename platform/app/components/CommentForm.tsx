"use client";

import type { FormEvent } from "react";

type CommentFormProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  error?: string;
  submitting?: boolean;
  placeholder?: string;
  submitLabel?: string;
  submittingLabel?: string;
};

export default function CommentForm({
  id = "comment",
  label = "Ajouter un commentaire",
  value,
  onChange,
  onSubmit,
  error,
  submitting = false,
  placeholder = "Rédigez votre retour…",
  submitLabel = "Publier le commentaire",
  submittingLabel = "Publication…",
}: CommentFormProps) {
  return (
    <form onSubmit={onSubmit} className="section-divider">
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        className="field-textarea"
        placeholder={placeholder}
      />

      {error ? <p className="mt-2 form-error">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || value.trim().length === 0}
        className="btn-nav mt-4 text-sm font-semibold"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
