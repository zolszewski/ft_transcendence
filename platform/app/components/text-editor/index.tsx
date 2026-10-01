"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import DOMPurify from "dompurify";
import type { ChangeEvent } from "react";
import Menu from "./menu";
import { Upload, FileText, X } from "lucide-react";
import { validateUpload } from "@/lib/validateUpload";


export type TextEditorHandle = {
  getData: () => { title: string; content: string };
  getMiniatureFocus: () => { x: number; y: number };
  image: File | null;
  clearImage: () => void;
  imageRemoved: boolean;
  pdf: File | null;
  clearPdf: () => void;
  pdfRemoved: boolean;
};

type TextEditorProps = {
  initialData?: { title: string; content: string };
  initialImageUrl?: string;
  initialPdfUrl?: string;
  initialMiniatureFocus?: { x: number; y: number };
  onChange?: (data: { title: string; content: string }) => void;
  onImageUpload: (file: File) => Promise<string | null>;
};

const TextEditor = forwardRef<TextEditorHandle, TextEditorProps>(
  function TextEditor(
    {
      initialData,
      initialImageUrl,
      initialPdfUrl,
      initialMiniatureFocus,
      onChange,
      onImageUpload,
    },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const hasEditedRef = useRef(false);
    const [fileError, setFileError] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [imageRemoved, setImageRemoved] = useState(false);
    const [pdf, setPdf] = useState<File | null>(null);
    const [pdfRemoved, setPdfRemoved] = useState(false);

    const [miniaturePosition, setMiniaturePosition] = useState(
      () => initialMiniatureFocus ?? { x: 50, y: 50 },
    );

    const miniatureInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const miniatureDragRef = useRef<{
      x: number;
      y: number;
      position: { x: number; y: number };
    } | null>(null);

    useEffect(() => {
      if (!image) {
        setImageUrl("");
        return;
      }
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [image]);

    useEffect(() => {
      if (hasEditedRef.current) return;
      if (titleRef.current) titleRef.current.value = initialData?.title ?? "";
      if (editorRef.current) editorRef.current.innerHTML = initialData?.content ?? "";
    }, [initialData?.content, initialData?.title]);

    useEffect(() => {
      if (hasEditedRef.current || !initialMiniatureFocus) return;
      setMiniaturePosition(initialMiniatureFocus);
    }, [initialMiniatureFocus]);

    function getEditorContent() {
      const rawEditorContent = editorRef.current?.innerHTML;
      if (!rawEditorContent) return "";
      return DOMPurify.sanitize(rawEditorContent, {
        FORBID_TAGS: ["script", "style"],
        FORBID_ATTR: ["onerror", "onclick"],
      });
    }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    const error = await validateUpload(file, "image");
    if (error) {
      setFileError(`Miniature: ${error}`);
      return; 
    }
    setFileError("");
    setImage(file);
    setMiniaturePosition({ x: 50, y: 50 });
}

  async function handlePdfChange(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0] ?? null;
  event.target.value = "";
  if (!file) return;

  const error = await validateUpload(file, "pdf");
  if (error) {
    setFileError(`PDF: ${error}`);
    return;
  }
  setFileError("");
  setPdf(file);
  setPdfRemoved(false);
}

    function removePdf() {
      setPdf(null);
      setPdfRemoved(true);
    }

    function undoRemovePdf() {
      setPdfRemoved(false);
    }

    function removeImage() {
      setImage(null);
      setImageRemoved(true);
    }

    function undoRemoveImage() {
      setImageRemoved(false);
    }

    function notifyChange() {
      hasEditedRef.current = true;
      onChange?.({
        title: titleRef.current?.value ?? "",
        content: getEditorContent(),
      });
    }

    const displayImageUrl = imageRemoved ? "" : imageUrl || initialImageUrl;

    function handleMiniaturePointerDown(event: React.PointerEvent<HTMLDivElement>) {
      if (!displayImageUrl) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      miniatureDragRef.current = { x: event.clientX, y: event.clientY, position: miniaturePosition };
    }

    function handleMiniaturePointerMove(event: React.PointerEvent<HTMLDivElement>) {
      const drag = miniatureDragRef.current;
      if (!drag || !displayImageUrl) return;
      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      setMiniaturePosition({
        x: Math.max(0, Math.min(100, drag.position.x - ((event.clientX - drag.x) / bounds.width) * 100)),
        y: Math.max(0, Math.min(100, drag.position.y - ((event.clientY - drag.y) / bounds.height) * 100)),
      });
    }

    function stopMiniatureDrag(event: React.PointerEvent<HTMLDivElement>) {
      miniatureDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }

    useImperativeHandle(ref, () => ({
      getData: () => ({
        title: titleRef.current?.value.trim() ?? "",
        content: getEditorContent(),
      }),
      getMiniatureFocus: () => miniaturePosition,
      image,
      clearImage: () => setImage(null),
      imageRemoved,
      pdf,
      clearPdf: () => setPdf(null),
      pdfRemoved,
    }));

    const miniatureInputId = "editor-miniature-file";
    const pdfInputId = "editor-pdf-file";
    
    const miniatureImage = displayImageUrl ? (
      <img
        src={displayImageUrl}
        alt="Article miniature"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        style={{
          objectPosition: `${miniaturePosition.x}% ${miniaturePosition.y}%`,
        }}
      />
    ) : (
      <span>Import an image for your article</span>
    );

    return (
      <div className="editor-panel w-full">
        <input
          ref={miniatureInputRef}
          id={miniatureInputId}
          type="file"
          name="miniature"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleImageChange}
          className="hidden"
        />
        <input
          ref={pdfInputRef}
          id={pdfInputId}
          type="file"
          name="pdf"
          accept="application/pdf"
          onChange={handlePdfChange}
          className="hidden"
        />
        {fileError ? (
          <p role="alert" className="border-b border-border px-4 py-2 text-sm text-red-600">
            {fileError}
          </p>
          ) : null}
        <div className="flex items-start gap-2 border-b border-border p-4">
          <div
            className="editor-miniature-zone editor-miniature-zone--preview"
            onPointerDown={handleMiniaturePointerDown}
            onPointerMove={handleMiniaturePointerMove}
            onPointerUp={stopMiniatureDrag}
            onPointerCancel={stopMiniatureDrag}
          >
            {miniatureImage}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => miniatureInputRef.current?.click()}
              className="editor-toolbar-btn inline-flex items-center gap-1"
              aria-label={displayImageUrl ? "Change miniature" : "Add miniature"}
            >
              <Upload size={16} aria-hidden="true" />
              {displayImageUrl ? "Change" : "Add"}
            </button>

            {displayImageUrl && !imageRemoved ? (
              <button
                type="button"
                onClick={removeImage}
                className="editor-toolbar-btn inline-flex items-center gap-1"
                aria-label="Remove miniature"
              >
                <X size={16} aria-hidden="true" />
                Remove
              </button>
            ) : imageRemoved ? (
              <button
                type="button"
                onClick={undoRemoveImage}
                className="editor-toolbar-btn text-sm"
              >
                Undo
              </button>
            ) : null}
          </div>
        </div>

        <div className="border-b border-border p-4">
          <label className="block text-left">
            <span className="editor-field-label">Title</span>
            <textarea
              ref={titleRef}
              name="title"
              placeholder="Enter your article title"
              rows={2}
              required
              className="editor-title-input"
              onInput={notifyChange}
            />
          </label>
        </div>

        <div className="flex items-center gap-2 border-b border-border p-4">
          <FileText size={18} aria-hidden="true" className="shrink-0 text-gray-500" />

          {pdf ? (
            <>
              <span className="flex-1 truncate text-sm">{pdf.name}</span>
              <button
                type="button"
                onClick={() => setPdf(null)}
                className="editor-toolbar-btn"
                aria-label="Cancel new PDF selection"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </>
          ) : pdfRemoved ? (
            <>
              <span className="flex-1 text-sm text-red-600">PDF will be removed on save</span>
              <button type="button" onClick={undoRemovePdf} className="editor-toolbar-btn text-sm">
                Undo
              </button>
            </>
          ) : initialPdfUrl ? (
            <>
              
                href={initialPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate text-sm underline"
              <a>
                Current PDF
              </a>
              <button
                type="button"
                onClick={removePdf}
                className="editor-toolbar-btn"
                aria-label="Remove PDF"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </>
          ) : (
            <span className="flex-1 text-sm text-gray-500">No PDF attached</span>
          )}

          <label
            htmlFor={pdfInputId}
            className="editor-toolbar-btn inline-flex cursor-pointer items-center gap-1"
          >
            <Upload size={16} aria-hidden="true" />
            {initialPdfUrl || pdf ? "Replace PDF" : "Attach PDF"}
          </label>
        </div>

        <Menu editorRef={editorRef} onImageUpload={onImageUpload} />
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          data-placeholder="Write your academic work here..."
          className="academic-editor editor-surface"
          onInput={notifyChange}
        />
      </div>
    );
  },
);

export default TextEditor;