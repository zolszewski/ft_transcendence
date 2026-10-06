"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { User } from "@/lib/types";
import { apiClient } from "@/lib/apiClient";
import { validateUpload } from "@/lib/validateUpload";
import { Upload, Edit2, Check, X, User as UserIcon } from "lucide-react";
import TwoFactorSection from "@/components/TwoFactorSection";
interface UserProfileSectionProps {
  user: User;
  isOwner?: boolean;
  onUserUpdated?: (updatedUser: User) => void;
}

export default function UserProfileSection({
  user,
  isOwner = false,
  onUserUpdated,
}: UserProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");

  const [name, setName] = useState(user.name ?? "");
  const [faculty, setFaculty] = useState(user.faculty ?? "");
  const [specialization, setSpecialization] = useState(user.specialization ?? "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarFocus, setAvatarFocus] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    position: { x: number; y: number };
  } | null>(null);

  // Sync state when incoming user changes
  useEffect(() => {
    setName(user.name ?? "");
    setFaculty(user.faculty ?? "");
    setSpecialization(user.specialization ?? "");
    setIsEditing(false);
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarUrl("");
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const displayAvatarUrl =
    avatarUrl ||
    user.avatarUrl ||
    (user.avatarId ? `/api/uploads/${user.avatarId}` : "") ||
    (user.avatar?.id ? `/api/uploads/${user.avatar.id}` : "");


  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!isEditing || !displayAvatarUrl) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      position: avatarFocus,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || !displayAvatarUrl || !isEditing) return;
    e.preventDefault();
    const bounds = e.currentTarget.getBoundingClientRect();
    setAvatarFocus({
      x: Math.max(
        0,
        Math.min(100, drag.position.x - ((e.clientX - drag.x) / bounds.width) * 100)
      ),
      y: Math.max(
        0,
        Math.min(100, drag.position.y - ((e.clientY - drag.y) / bounds.height) * 100)
      ),
    });
  }

  function stopDrag(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    const err = await validateUpload(file, "image");
    if (err) {
      setFileError(`Avatar: ${err}`);
      return;
    }
    setFileError("");
    setAvatarFile(file);
    setAvatarFocus({ x: 50, y: 50 });
  }

  const handleCancel = () => {
    setName(user.name ?? "");
    setFaculty(user.faculty ?? "");
    setSpecialization(user.specialization ?? "");
    setAvatarFile(null);
    setFileError("");
    setFormError("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      let newAvatarId = user.avatarId;

      if (avatarFile) {
        const uploadRes = await apiClient.uploads.image(avatarFile, "PUBLIC");
        if (!uploadRes.success) {
          throw new Error(uploadRes.error || "Failed to upload avatar image");
        }
        newAvatarId = uploadRes.data.id;
      }

      const endpoint = isOwner ? "/api/users/me" : `/api/users/${user.id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          faculty,
          specialization,
          ...(avatarFile && newAvatarId ? { avatarId: newAvatarId } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      const updatedUser: User = await response.json();
      setAvatarFile(null);
      onUserUpdated?.(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "An error occurred while saving."
      );
    } finally {
      setSaving(false);
    }
  };

  const formattedMemberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="mb-6 rounded-none border border-border bg-card p-6 shadow-sm">
      {fileError ? <p className="alert-banner-error">{fileError}</p> : null}
      {formError ? <p className="alert-banner-error">{formError}</p> : null}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Avatar & Core Info */}
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative flex flex-col items-center">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              className={`relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted/40 ${
                isEditing && displayAvatarUrl
                  ? "cursor-grab active:cursor-grabbing"
                  : ""
              }`}
            >
              {displayAvatarUrl ? (
                <img
                  src={displayAvatarUrl}
                  alt={user.name}
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-cover"
                  style={{
                    objectPosition: `${avatarFocus.x}% ${avatarFocus.y}%`,
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <UserIcon size={40} />
                </div>
              )}
            </div>

            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="btn-nav-sm mt-2 inline-flex items-center gap-1 text-xs"
                >
                  <Upload size={12} />
                  Change
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </>
            ) : null}
          </div>

          <div className="w-full text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Name</label>
                  <input
                    type="text"
                    className="field-input text-base font-bold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <h2 className="text-2xl font-bold">{user.name}</h2>
            )}

            {/* Email displayed strictly when viewing your own profile */}
            {isOwner && user.email ? (
              <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
            ) : null}

            <p className="mt-1 text-xs text-muted-foreground">
              Member since: <span className="font-medium text-foreground">{formattedMemberSince}</span>
            </p>
          </div>
        </div>

        {/* Action Button: Visible only to profile owners */}
        {isOwner ? (
          <div className="flex justify-end">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-nav inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="btn-nav inline-flex items-center gap-1"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-nav inline-flex items-center gap-1"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Academic Fields */}
      <div className="section-divider mt-6 grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
        <div>
          <span className="block text-xs font-semibold uppercase text-muted-foreground">
            Faculty
          </span>
          {isEditing ? (
            <input
              type="text"
              className="field-input mt-1"
              placeholder="e.g. Science & Technology"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
            />
          ) : (
            <p className="mt-1 text-sm font-medium">
              {user.faculty || <span className="text-muted-foreground italic font-normal">Not specified</span>}
            </p>
          )}
        </div>

        <div>
          <span className="block text-xs font-semibold uppercase text-muted-foreground">
            Specialization
          </span>
          {isEditing ? (
            <input
              type="text"
              className="field-input mt-1"
              placeholder="e.g. Computer Science"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
          ) : (
            <p className="mt-1 text-sm font-medium">
              {user.specialization || (
                <span className="text-muted-foreground italic font-normal">Not specified</span>
              )}
            </p>
          )}
        </div>
      </div>
      {/* Two-Factor Authentication */}
      {isOwner ? (
        <TwoFactorSection
          enabled={user.twoFactorEnabled}
          onChanged={(enabled) => {
            onUserUpdated?.({
              ...user,
              twoFactorEnabled: enabled,
            });
          }}
        />
      ) : null}
    </div>
  );
}