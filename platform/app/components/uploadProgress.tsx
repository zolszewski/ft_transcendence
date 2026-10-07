"use client";

type UploadProgressProps = {
  percent: number | null;
  label?: string;
};

export default function UploadProgress({ percent, label = "Téléversement" }: UploadProgressProps) {
  if (percent === null) return null;

  return (
    <div className="mb-6" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-600">
        {label}… {percent}%
      </p>
    </div>
  );
}