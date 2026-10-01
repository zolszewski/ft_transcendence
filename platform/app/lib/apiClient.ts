import type { User, Article, Comment, Review, ArticleDetail, ListResult, DashboardStats, Message } from "./types";
import { uploadFileWithProgress } from "./progressUpload";
import { validateUpload, validateFile } from "./validateUpload";

type ApiResponse<T> =
  | { success: true; status?: number; data: T }
  | { success: false; status: number; error: string };


function apiError<T>(error: string, status = 0): ApiResponse<T> {
  return { success: false, status, error };
}

function apiSuccess<T>(data: T, status?: number): ApiResponse<T> {
  return { success: true, status, data };
}


async function uploadRawFile(file: File, visibility: "PUBLIC" | "PRIVATE" = "PRIVATE") {
  const kind = file.type === "application/pdf" ? "pdf" : "image";
  const validationError = await validateUpload(file, kind);
  if (validationError) {
    return { ok: false, status: 400, data: { error: validationError } as any };
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("visibility", visibility);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  let data: any = {};
  try {
    data = await response.json();
  } catch {
    if (response.status === 413) data = { error: "File is too large." };
  }
  return { ok: response.ok, status: response.status, data };
}

export const apiClient = {
  auth: {
    login: async (email: string, password: string) => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) return apiError<User>(data.error || "Failed to login", response.status);
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Unable to connect to the server");
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
          return apiError<null>(data.error || "Failed to logout", response.status);
        }
        return apiSuccess<null>(null, response.status);
      } catch {
        return apiError<null>("Unable to connect to the server");
      }
    },
    me: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<User>(data.error || "Failed to fetch user info", response.status);
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Unable to connect to the server");
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
        if (!response.ok) return apiError<User>(data.error || "Failed to register", response.status);
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Unable to connect to the server");
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
          return apiError<ListResult<Article>>(data.error || "Failed to load articles", response.status);
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
        return apiError<ListResult<Article>>("Unable to connect to the server");
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
          return apiError<DashboardStats>(data.error || "Failed to load dashboard stats", response.status);
        }
        return apiSuccess<DashboardStats>(data, response.status);
      } catch {
        return apiError<DashboardStats>("Unable to connect to the server");
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
          return apiError<User>(data.error || "Failed to fetch user profile", response.status);
        }
        return apiSuccess<User>(data, response.status);
      } catch {
        return apiError<User>("Unable to connect to the server");
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
            patchData.error || "Failed to update profile",
            patchResponse.status,
          );
        }
        let currentUser: User = patchData;
        if (payload.avatarFile) {
          const uploadRes = await apiClient.uploads.image(payload.avatarFile, "PUBLIC");
          if (!uploadRes.success) {
            return apiError<User>(uploadRes.error || "Failed to upload avatar image", uploadRes.status);
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
              avatarData.error || "Failed to set user avatar",
              avatarResponse.status,
            );
          }
        currentUser = avatarData;
        }
        return apiSuccess<User>(currentUser, patchResponse.status);
      } catch {
        return apiError<User>("Unable to connect to the server");
      }
    },
  },
  friends: {
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
            data.error || "Failed to search users",
            response.status,
          );
        }
        return apiSuccess<{ id: string; name: string; avatarUrl: string | null }[]>(data, response.status);
      } catch {
        return apiError<{ id: string; name: string; avatarUrl: string | null }[]>("Unable to connect to the server");
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
          return apiError<{ id: string; url: string }>(data.error || "Failed to upload image", status);
        }
        return apiSuccess<{ id: string; url: string }>(
          { id: data.id as string, url: `/api/uploads/${data.id}` },
          status
        );
      } catch {
        return apiError<{ id: string; url: string }>("Unable to connect to the server");
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
    ) => {
      try {
        let miniatureId: string | undefined;
        let pdfId: string | undefined;

        if (miniature) {
          const up = await uploadRawFile(miniature);
          if (!up.ok) return apiError<Article>(up.data.error || "Failed to upload miniature", up.status);
          miniatureId = up.data.id;
        }

        if (pdf) {
          const up = await uploadRawFile(pdf);
          if (!up.ok) return apiError<Article>(up.data.error || "Failed to upload PDF", up.status);
          pdfId = up.data.id;
        }

        const response = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title,
            content,
            abstract,
            miniatureId,
            pdfId,
            miniatureFocusX: miniatureFocus?.x ?? 50,
            miniatureFocusY: miniatureFocus?.y ?? 50,
          }),
        });

        const data = await response.json();
        if (!response.ok) return apiError<Article>(data.error || "Failed to create article", response.status);
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Unable to connect to the server");
      }
    },
    getDraft: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) return apiError<Article>(data.error || "Failed to load draft", response.status);
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Unable to connect to the server");
      }
    },
    submit: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/submit`, {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<null>(data.error || "Failed to submit article", response.status);
        return apiSuccess<null>(null, response.status);
      } catch {
        return apiError<null>("Unable to connect to the server");
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
    ) => {
      try {
        let miniatureId: string | undefined;
        let pdfId: string | null | undefined;

        if (miniature) {
          const up = await uploadRawFile(miniature);
          if (!up.ok) return apiError<Article>(up.data.error || "Failed to upload miniature", up.status);
          miniatureId = up.data.id;
        }

        if (pdf) {
          const up = await uploadRawFile(pdf);
          if (!up.ok) return apiError<Article>(up.data.error || "Failed to upload PDF", up.status);
          pdfId = up.data.id;
        } else if (removePdf) {
          pdfId = null;
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
            pdfId,
            miniatureFocusX: miniatureFocus?.x ?? 50,
            miniatureFocusY: miniatureFocus?.y ?? 50,
          }),
        });
        const data = await response.json();
        if (!response.ok) return apiError<Article>(data.error || "Failed to update article", response.status);
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Unable to connect to the server");
      }
    },
    //explore - list articles
    explore: async (params?: {
      search?: string;
      sort?: "newest" | "oldest";
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<ListResult<Article>>> => {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.sort) queryParams.append("sort", params.sort);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      try {
        const response = await fetch(`/api/articles/explore?${queryParams.toString()}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return apiError<ListResult<Article>>(data.error || "Failed to load articles", response.status);
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
        return apiError<ListResult<Article>>("Unable to connect to the server");
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
        if (!response.ok) return apiError<ArticleDetail>(data.error || "Article not found", response.status);
        return apiSuccess<ArticleDetail>(data, response.status);
      } catch {
        return apiError<ArticleDetail>("Unable to connect to the server");
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
        if (!response.ok) return apiError<Comment[]>(data.error || "Failed to load comments", response.status);
        return apiSuccess<Comment[]>(data, response.status);
      } catch {
        return apiError<Comment[]>("Unable to connect to the server");
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
        if (!response.ok) return apiError<Comment>(data.error || "Failed to post comment", response.status);
        return apiSuccess<Comment>(data, response.status);
      } catch {
        return apiError<Comment>("Unable to connect to the server");
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
          return apiError<ListResult<Article>>(data.error || "Failed to load submitted articles", response.status);
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
        return apiError<ListResult<Article>>("Unable to connect to the server");
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
          return apiError<Article>(data.error || "Failed to load reviewing article", response.status);
        }
        return apiSuccess<Article>(data, response.status);
      } catch {
        return apiError<Article>("Unable to connect to the server");
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
        if (!response.ok) return apiError<null>(data.error || "Failed to post decision", response.status);
        return apiSuccess<null>(null, response.status);
      } catch {
        return apiError<null>("Unable to connect to the server");
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
        if (!response.ok) return apiError<Review>(data.error || "Failed to post review", response.status);
        return apiSuccess<Review>(data, response.status);
      } catch {
        return apiError<Review>("Unable to connect to the server");
      }
    },
    getReviews: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/reviews`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) return apiError<Review[]>(data.error || "Failed to load reviews", response.status);
        return apiSuccess<Review[]>(data, response.status);
      } catch {
        return apiError<Review[]>("Unable to connect to the server");
      }
    },
  },
  chat: {
    // les autres utilisateurs (à qui on peut écrire)
    listUsers: async () => {
      try {
        const response = await fetch("/api/users", { credentials: "include" });
        const data = await response.json();
        if (!response.ok) return apiError<User[]>(data.error || "Failed to load users", response.status);
        return apiSuccess<User[]>(data, response.status);
      } catch {
        return apiError<User[]>("Unable to connect to the server");
      }
    },
    getMessages: async (userId: string) => {
      try {
        const response = await fetch(`/api/chat/${userId}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) return apiError<Message[]>(data.error || "Failed to load messages", response.status);
        return apiSuccess<Message[]>(data, response.status);
      } catch {
        return apiError<Message[]>("Unable to connect to the server");
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
        if (!response.ok) return apiError<Message>(data.error || "Failed to send message", response.status);
        return apiSuccess<Message>(data, response.status);
      } catch {
        return apiError<Message>("Unable to connect to the server");
      }
    },
  },
}

