import type {
  User,
  Article,
  Comment,
  Review,
  ArticleDetail,
  ListResult,
  DashboardStats,
  Message,
  FriendSummary,
  FriendRequestItem,
  FriendRelationStatus,
} from "./types";
import { uploadFileWithProgress } from "./progressUpload";
import { validateUpload, validateFile } from "./validateUpload";

type ApiResponse<T> =
  | { success: true; status?: number; data: T }
  | { success: false; status: number; error: string };

type LoginResult =
  | { success: true; status?: number; data: User }
  | { success: false; status: number; error: string }
  | { requires2fa: true; status?: number };

function apiError<T>(error: string, status = 0): ApiResponse<T> {
  return { success: false, status, error };
}

function apiSuccess<T>(data: T, status?: number): ApiResponse<T> {
  return { success: true, status, data };
}


async function uploadRawFile(
  file: File,
  visibility: "PUBLIC" | "PRIVATE" = "PRIVATE",
  onProgress?: (percent: number) => void,
) {
  const kind = file.type === "application/pdf" ? "pdf" : "image";
  const validationError = await validateUpload(file, kind);
  if (validationError) {
    return { ok: false, status: 400, data: { error: validationError } as any };
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("visibility", visibility);

  const { status, data } = await uploadFileWithProgress(
    "/api/uploads",
    formData,
    onProgress ?? (() => {}),
  );
  let parsed = data;
  if (status === 413 && !parsed?.error) {
    parsed = { error: "Fichier trop volumineux." };
  }
  return { ok: status >= 200 && status < 300, status, data: parsed };
}

async function uploadArticleFiles(
  miniature: File | null | undefined,
  pdf: File | null | undefined,
  onProgress?: (percent: number) => void,
): Promise<
  | { ok: true; miniatureId?: string; documentId?: string }
  | { ok: false; status: number; error: string }
> {
  const files: { file: File; kind: "miniature" | "pdf" }[] = [];
  if (miniature) files.push({ file: miniature, kind: "miniature" });
  if (pdf) files.push({ file: pdf, kind: "pdf" });

  if (files.length === 0) {
    return { ok: true };
  }

  const totalBytes = files.reduce((sum, entry) => sum + entry.file.size, 0) || 1;
  let uploadedBytes = 0;
  let miniatureId: string | undefined;
  let documentId: string | undefined;

  for (const entry of files) {
    const startBytes = uploadedBytes;
    const up = await uploadRawFile(entry.file, "PRIVATE", (filePercent) => {
      if (!onProgress) return;
      const loaded = startBytes + (entry.file.size * filePercent) / 100;
      onProgress(Math.min(100, Math.round((loaded / totalBytes) * 100)));
    });
    if (!up.ok) {
      return { ok: false, status: up.status, error: up.data.error || "Échec du téléversement" };
    }
    uploadedBytes += entry.file.size;
    onProgress?.(Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)));
    if (entry.kind === "miniature") miniatureId = up.data.id;
    else documentId = up.data.id;
  }

  return { ok: true, miniatureId, documentId };
}

export const apiClient = {
  auth: {
    login: async (email: string, password: string) : Promise<LoginResult> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) 
          return apiError<User>(data.error || "Échec de la connexion", response.status);
        if (data.requires2fa)
          return { requires2fa: true, status: response.status };
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Impossible de se connecter au serveur");
      }
    },
    logout: async () => {
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json();
          return apiError<null>(data.error || "Échec de la déconnexion", response.status);
        }
        return apiSuccess<null>(null, response.status);
      } catch {
        return apiError<null>("Impossible de se connecter au serveur");
      }
    },
    me: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<User>(data.error || "Impossible de récupérer les informations utilisateur", response.status);
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Impossible de se connecter au serveur");
      }
    },
    createApiKey: async () => {
      try {
        const response = await fetch("/api/auth/api-keys", {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<{ apiKey: string }>(
            data.error || "Impossible de générer la clé API",
            response.status,
          );
        }
        return apiSuccess<{ apiKey: string }>(data, response.status);
      } catch {
        return apiError<{ apiKey: string }>("Impossible de se connecter au serveur");
      }
    },
    register: async (name: string, email: string, password: string) => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) return apiError<User>(data.error || "Échec de l'inscription", response.status);
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Impossible de se connecter au serveur");
      }
    },
  },
  twoFactor: {
    setup: async () => {
      try {
        const response = await fetch("/api/users/me/2fa/setup", {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<{ otpauthUrl: string; qrCode: string }>(data.error || "Impossible de démarrer la configuration 2FA", response.status);
        return apiSuccess<{ otpauthUrl: string; qrCode: string }>(data, response.status);
      } catch {
        return apiError<{ otpauthUrl: string; qrCode: string }>("Impossible de se connecter au serveur");
      }
    },
    enable: async (code: string) => {
      try {
        const response = await fetch("/api/users/me/2fa/enable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        if (!response.ok) return apiError<{ twoFactorEnabled: boolean }>(data.error || "Impossible d'activer la 2FA", response.status);
        return apiSuccess<{ twoFactorEnabled: boolean }>(data, response.status);
      } catch {
        return apiError<{ twoFactorEnabled: boolean }>("Impossible de se connecter au serveur");
      }
    },
    disable: async (password: string, code: string) => {
      try {
        const response = await fetch("/api/users/me/2fa/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password, code }),
        });
        const data = await response.json();
        if (!response.ok) return apiError<{ twoFactorEnabled: boolean }>(data.error || "Impossible de désactiver la 2FA", response.status);
        return apiSuccess<{ twoFactorEnabled: boolean }>(data, response.status);
      } catch {
        return apiError<{ twoFactorEnabled: boolean }>("Impossible de se connecter au serveur");
      }
    },
    verifyLogin: async (code: string) => {
      try {
        const response = await fetch("/api/auth/login/2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        if (!response.ok) return apiError<User>(data.error || "Code invalide", response.status);
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Impossible de se connecter au serveur");
      }
    },
  },
  dashboard: {
    mine: async (params?: {
      status?: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";
      search?: string;
      sort?: "newest" | "oldest";
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.search) queryParams.append("search", params.search);
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      try {
        const response = await fetch(`/api/articles/mine?${queryParams.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<ListResult<Article>>(data.error || "Impossible de charger les articles", response.status);
        }
        return apiSuccess<ListResult<Article>>(
          {
            data: data.articles,
            total: data.total,
            page: data.page,
            pages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1,
          },
          response.status
        );
      } catch {
        return apiError<ListResult<Article>>("Impossible de se connecter au serveur");
      }
    },
    stats: async () => {
      try {
        const response = await fetch("/api/dashboard", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<DashboardStats>(data.error || "Impossible de charger les statistiques", response.status);
        }
        return apiSuccess<DashboardStats>(data, response.status);
      } catch {
        return apiError<DashboardStats>("Impossible de se connecter au serveur");
      }
    },
  },
  profile: {
    get: async (userId?: string) => {
      try {
        const endpoint = userId ? `/api/users/${userId}` : "/api/users/me";
        const response = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<User>(data.error || "Impossible de récupérer le profil", response.status);
        }
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Impossible de se connecter au serveur");
      }
    },
    update: async (payload: {
      name?: string;
      email?: string;
      faculty?: string | null;
      specialization?: string | null;
      avatarFile?: File | null;
    }) => {
      try {
        const patchResponse = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            faculty: payload.faculty,
            specialization: payload.specialization,
          }),
        });
        const patchData = await patchResponse.json();
        if (!patchResponse.ok) {
          return apiError<User>(
            patchData.error || "Impossible de mettre à jour le profil",
            patchResponse.status,
          );
        }
        let currentUser: User = patchData;
        if (payload.avatarFile) {
          const uploadRes = await apiClient.uploads.image(payload.avatarFile, "PUBLIC");
          if (!uploadRes.success) {
            return apiError<User>(uploadRes.error || "Impossible de téléverser l'avatar", uploadRes.status);
          }
          const avatarResponse = await fetch("/api/users/me/avatar", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ uploadId: uploadRes.data.id }),
          });

          const avatarData = await avatarResponse.json();
          if (!avatarResponse.ok) {
            return apiError<User>(
              avatarData.error || "Impossible de définir l'avatar",
              avatarResponse.status,
            );
          }
        currentUser = avatarData;
        }
        return apiSuccess<User>(currentUser, patchResponse.status);
      } catch {
        return apiError<User>("Impossible de se connecter au serveur");
      }
    },
  },
  friends: {
    list: async () => {
      try {
        const response = await fetch("/api/friends", { method: "GET", credentials: "include" });
        const data = await response.json();
        if (!response.ok) {
          return apiError<FriendSummary[]>(
            data.error || "Impossible de charger la liste d'amis",
            response.status,
          );
        }
        return apiSuccess<FriendSummary[]>(data, response.status);
      } catch {
        return apiError<FriendSummary[]>("Impossible de se connecter au serveur");
      }
    },
    listRequests: async () => {
      try {
        const response = await fetch("/api/friends/requests", { method: "GET", credentials: "include" });
        const data = await response.json();
        if (!response.ok) {
          return apiError<FriendRequestItem[]>(
            data.error || "Impossible de charger les demandes d'amis",
            response.status,
          );
        }
        return apiSuccess<FriendRequestItem[]>(data, response.status);
      } catch {
        return apiError<FriendRequestItem[]>("Impossible de se connecter au serveur");
      }
    },
    getStatus: async (userId: string) => {
      try {
        const response = await fetch(`/api/friends/status/${userId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<FriendRelationStatus>(
            data.error || "Impossible de charger le statut d'amitié",
            response.status,
          );
        }
        return apiSuccess<FriendRelationStatus>(data.status, response.status);
      } catch {
        return apiError<FriendRelationStatus>("Impossible de se connecter au serveur");
      }
    },
    request: async (userId: string) => {
      try {
        const response = await fetch(`/api/friends/${userId}`, { method: "POST", credentials: "include" });
        const data = await response.json();
        if (!response.ok) {
          return apiError<FriendRelationStatus>(
            data.error || "Impossible d'envoyer la demande d'ami",
            response.status,
          );
        }
        return apiSuccess<FriendRelationStatus>(data.status, response.status);
      } catch {
        return apiError<FriendRelationStatus>("Impossible de se connecter au serveur");
      }
    },
    accept: async (userId: string) => {
      try {
        const response = await fetch(`/api/friends/${userId}`, { method: "PUT", credentials: "include" });
        const data = await response.json();
        if (!response.ok) {
          return apiError<FriendRelationStatus>(
            data.error || "Impossible d'accepter la demande d'ami",
            response.status,
          );
        }
        return apiSuccess<FriendRelationStatus>("friends", response.status);
      } catch {
        return apiError<FriendRelationStatus>("Impossible de se connecter au serveur");
      }
    },
    remove: async (userId: string) => {
      try {
        const response = await fetch(`/api/friends/${userId}`, { method: "DELETE", credentials: "include" });
        if (response.status === 204) {
          return apiSuccess<null>(null, response.status);
        }
        const data = await response.json();
        return apiError<null>(data.error || "Impossible de retirer l'ami", response.status);
      } catch {
        return apiError<null>("Impossible de se connecter au serveur");
      }
    },
    search: async (query: string) => {
      const queryParams = new URLSearchParams({ q: query });
      try {
        const response = await fetch(`/api/users/search?${queryParams.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<{ id: string; name: string; avatarUrl: string | null }[]>(
            data.error || "Impossible de rechercher des utilisateurs",
            response.status,
          );
        }
        return apiSuccess<{ id: string; name: string; avatarUrl: string | null }[]>(data, response.status);
      } catch {
        return apiError<{ id: string; name: string; avatarUrl: string | null }[]>("Impossible de se connecter au serveur");
      }
    },
  },
  uploads: {
    image: async (
      file: File,
      visibility: "PUBLIC" | "PRIVATE" = "PUBLIC",
      onProgress?: (percent: number) => void
    ) => {
      const validationError = validateFile(file, "image");
      if (validationError) 
        return apiError<{ id: string; url: string }>(validationError, 400);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visibility", visibility);

      try {
        const { status, data } = await uploadFileWithProgress(
          "/api/uploads",
          formData,
          onProgress ?? (() => {})
        );

        if (status < 200 || status >= 300) {
          return apiError<{ id: string; url: string }>(data.error || "Impossible de téléverser l'image", status);
        }
        return apiSuccess<{ id: string; url: string }>(
          { id: data.id as string, url: `/api/uploads/${data.id}` },
          status
        );
      } catch {
        return apiError<{ id: string; url: string }>("Impossible de se connecter au serveur");
      }
    },
  },
  articles: {
    //publish
    create: async (
      title: string,
      content: string,
      miniature?: File | null,
      abstract?: string,
      pdf?: File | null,
      miniatureFocus?: { x: number; y: number },
      onUploadProgress?: (percent: number) => void,
    ) => {
      try {
        const uploads = await uploadArticleFiles(miniature, pdf, onUploadProgress);
        if (!uploads.ok) {
          return apiError<Article>(uploads.error, uploads.status);
        }
        const { miniatureId, documentId } = uploads;

        const response = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            content,
            abstract,
            miniatureId,
            documentId,
            miniatureFocusX: miniatureFocus?.x ?? 50,
            miniatureFocusY: miniatureFocus?.y ?? 50,
          }),
        });

        const data = await response.json();
        if (!response.ok) return apiError<Article>(data.error || "Impossible de créer l'article", response.status);
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Impossible de se connecter au serveur");
      }
    },
    getDraft: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) return apiError<Article>(data.error || "Impossible de charger le brouillon", response.status);
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Impossible de se connecter au serveur");
      }
    },
    submit: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/submit`, {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<null>(data.error || "Impossible de soumettre l'article", response.status);
        return apiSuccess<null>(null, response.status);
      } catch {
        return apiError<null>("Impossible de se connecter au serveur");
      }
    },
    //update article saved in dashboard
    update: async (
      articleId: string,
      title: string,
      content: string,
      miniature?: File | null,
      abstract?: string,
      pdf?: File | null,
      removePdf?: boolean,
      miniatureFocus?: { x: number; y: number },
      onUploadProgress?: (percent: number) => void,
    ) => {
      try {
        let miniatureId: string | undefined;
        let documentId: string | null | undefined;

        const uploads = await uploadArticleFiles(miniature, pdf, onUploadProgress);
        if (!uploads.ok) {
          return apiError<Article>(uploads.error, uploads.status);
        }
        miniatureId = uploads.miniatureId;
        documentId = uploads.documentId;
        if (removePdf && !pdf) {
          documentId = null;
        }

        const response = await fetch(`/api/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            content,
            abstract,
            miniatureId,
            documentId,
            miniatureFocusX: miniatureFocus?.x ?? 50,
            miniatureFocusY: miniatureFocus?.y ?? 50,
          }),
        });
        const data = await response.json();
        if (!response.ok) return apiError<Article>(data.error || "Impossible de mettre à jour l'article", response.status);
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Impossible de se connecter au serveur");
      }
    },
    //explore - list articles
    explore: async (params?: {
      search?: string;
      sort?: "newest" | "oldest";
      page?: number;
      limit?: number;
      faculty?: string;
      createdFrom?: string;
      createdTo?: string;
      friendsOnly?: boolean;
    }): Promise<ApiResponse<ListResult<Article>>> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.faculty) queryParams.append("faculty", params.faculty);
      if (params?.createdFrom) queryParams.append("createdFrom", params.createdFrom);
      if (params?.createdTo) queryParams.append("createdTo", params.createdTo);
      if (params?.friendsOnly) queryParams.append("friendsOnly", "true");

      try {
        const response = await fetch(`/api/articles/explore?${queryParams.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<ListResult<Article>>(data.error || "Impossible de charger les articles", response.status);
        }
        return apiSuccess<ListResult<Article>>(
          {
            data: data.articles,
            total: data.total,
            page: data.page,
            pages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1,
          },
          response.status
        );
      } catch {
        return apiError<ListResult<Article>>("Impossible de se connecter au serveur");
      }
    },
    discover: async () => {
      try {
        const response = await fetch("/api/recommendations/discover", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Article[]>(data.error || "Impossible de charger les recommandations", response.status);
        return apiSuccess<Article[]>(data, response.status);
      } catch {
        return apiError<Article[]>("Impossible de se connecter au serveur");
      }
    },
    deepen: async () => {
      try {
        const response = await fetch("/api/recommendations/deepen", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Article[]>(data.error || "Impossible de charger les recommandations", response.status);
        return apiSuccess<Article[]>(data, response.status);
      } catch {
        return apiError<Article[]>("Impossible de se connecter au serveur");
      }
    },
    listDraft: async () => {
      return apiClient.dashboard.mine({ status: "DRAFT" });
    },
    //get single article by ID
    getById: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<ArticleDetail>(data.error || "Article introuvable", response.status);
        return apiSuccess<ArticleDetail>(data, response.status);
      } catch {
        return apiError<ArticleDetail>("Impossible de se connecter au serveur");
      }
    },
    like: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/like`, {
          method: "POST",
          credentials: "include",
        });
        if (response.status === 204) return apiSuccess<null>(null, response.status);
        const data = await response.json();
        return apiError<null>(data.error || "Impossible d'aimer l'article", response.status);
      } catch {
        return apiError<null>("Impossible de se connecter au serveur");
      }
    },
    unlike: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/like`, {
          method: "DELETE",
          credentials: "include",
        });
        if (response.status === 204) return apiSuccess<null>(null, response.status);
        const data = await response.json();
        return apiError<null>(data.error || "Impossible de retirer le j'aime", response.status);
      } catch {
        return apiError<null>("Impossible de se connecter au serveur");
      }
    },
    //comments
    getComments: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/comments`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Comment[]>(data.error || "Impossible de charger les commentaires", response.status);
        return apiSuccess<Comment[]>(data, response.status);
      } catch {
        return apiError<Comment[]>("Impossible de se connecter au serveur");
      }
    },
    postComment: async (articleId: string, content: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/comments`, {
          method: "POST",
          body: JSON.stringify({ content }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Comment>(data.error || "Impossible de publier le commentaire", response.status);
        return apiSuccess<Comment>(data, response.status);
      } catch {
        return apiError<Comment>("Impossible de se connecter au serveur");
      }
    },
    //reviews main page
    getSubmittedArticles: async (params?: { search?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      try {
        const response = await fetch(`/api/articles/submitted?${queryParams.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<ListResult<Article>>(data.error || "Impossible de charger les articles soumis", response.status);
        }
        return apiSuccess<ListResult<Article>>(
          {
            data: data.articles,
            total: data.total,
            page: data.page,
            pages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1,
          },
          response.status
        );
      } catch {
        return apiError<ListResult<Article>>("Impossible de se connecter au serveur");
      }
    },
    //single article review page
    getReviewingArticle: async (articleId: string) => {
      try {
        const response = await fetch(`/api/reviews/${articleId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<Article>(data.error || "Impossible de charger l'article à relire", response.status);
        }
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Impossible de se connecter au serveur");
      }
    },
    postDecision: async (reviewId: string, decision: "APPROVED" | "REJECTED") => {
      try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
          method: "PATCH",
          body: JSON.stringify({ decision }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<null>(data.error || "Impossible d'enregistrer la décision", response.status);
        return apiSuccess<null>(null, response.status);
      } catch {
        return apiError<null>("Impossible de se connecter au serveur");
      }
    },
    postReview: async (articleId: string, comment?: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/reviews`, {
          method: "POST",
          body: JSON.stringify({ comment }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Review>(data.error || "Impossible d'envoyer la relecture", response.status);
        return apiSuccess<Review>(data, response.status);
      } catch {
        return apiError<Review>("Impossible de se connecter au serveur");
      }
    },
    getReviews: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/reviews`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Review[]>(data.error || "Impossible de charger les relectures", response.status);
        return apiSuccess<Review[]>(data, response.status);
      } catch {
        return apiError<Review[]>("Impossible de se connecter au serveur");
      }
    },
  },
  chat: {
    //everyone else (people you can message)
    listUsers: async () => {
      try {
        const response = await fetch("/api/users", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) return apiError<User[]>(data.error || "Impossible de charger les utilisateurs", response.status);
        return apiSuccess<User[]>(data, response.status);
      } catch {
        return apiError<User[]>("Impossible de se connecter au serveur");
      }
    },
    getMessages: async (userId: string) => {
      try {
        const response = await fetch(`/api/chat/${userId}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) return apiError<Message[]>(data.error || "Impossible de charger les messages", response.status);
        return apiSuccess<Message[]>(data, response.status);
      } catch {
        return apiError<Message[]>("Impossible de se connecter au serveur");
      }
    },
    sendMessage: async (userId: string, content: string) => {
      try {
        const response = await fetch(`/api/chat/${userId}`, {
          method: "POST",
          body: JSON.stringify({ content }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Message>(data.error || "Impossible d'envoyer le message", response.status);
        return apiSuccess<Message>(data, response.status);
      } catch {
        return apiError<Message>("Impossible de se connecter au serveur");
      }
    },
  },
}

