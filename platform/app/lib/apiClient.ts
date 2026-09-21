import type { User, Article, Comment, Review, ArticleDetail, ListResult } from "./types";

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

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
                if (!response.ok) {
                    return { success: false, error: data.error || "Failed to login" } as ApiResponse<User>;
                }
                return { success: true, data } as ApiResponse<User>;
            } catch (err) {
                return { success: false, error: "Unable to connect to the server" } as ApiResponse<User>;
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
          return { success: false, error: data.error || "Failed to logout" } as ApiResponse<null>;
        }
        return { success: true, data: null } as ApiResponse<null>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<null>;
      }
    },
    me: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to fetch user info" } as ApiResponse<User>;
        }
        return { success: true, data } as ApiResponse<User>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<User>;
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
          if (!response.ok) {
            return { success: false, error: data.error || "Failed to register" } as ApiResponse<User>;
          }
          return { success: true, data } as ApiResponse<User>;
        } catch (err) {
          return { success: false, error: "Unable to connect to the server" } as ApiResponse<User>;
        }
      },
    },
    dashboard: {
    mine: async (params?: {
      status?: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED";
      search?: string;
      sort?: "newest" | "oldest";
      page?: number;
      limit?: number; }) => {
      const queryParams = new URLSearchParams();
      if (params?.status)
        queryParams.append("status", params.status);
      if (params?.search)
        queryParams.append("search", params.search);
      if (params?.sort)
        queryParams.append("sort", params.sort);
      if (params?.page)
        queryParams.append("page", params.page.toString());
      if (params?.limit)
        queryParams.append("limit", params.limit.toString());
      try {
        const response = await fetch(
          `/api/articles/mine?${queryParams.toString()}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || "Failed to load articles",
          } as ApiResponse<ListResult<Article>>;
        }
        return {
          success: true,
          data: {
            data: data.articles,
            total: data.total,
            page: data.page,
            pages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1,
          },
        } as ApiResponse<ListResult<Article>>;

      } catch {
        return {
          success: false,
          error: "Unable to connect to the server",
        } as ApiResponse<ListResult<Article>>;
      }
    }
  },
  uploads: {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("visibility", "PUBLIC");

      try {
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || "Failed to upload image" } as ApiResponse<never>;
        }
        return {
          success: true,
          data: { id: data.id as string, url: `/api/uploads/${data.id}` },
        } as ApiResponse<{ id: string; url: string }>;
      } catch {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<never>;
      }
    },
  },
  articles: { 
    //publish
    create: async (title: string, content: string, miniature?: File | null, abstract?: string) => {
      try {
        let miniatureId: string | undefined;
      
        if (miniature) {
          const formData = new FormData();
          formData.append("file", miniature)
          const uploadResponse = await fetch("/api/uploads", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          const uploadData = await uploadResponse.json();
          if (!uploadResponse.ok) {
            return {
              success: false,
              error: uploadData.error || "Failed to upload miniature",
            } as ApiResponse<Article>;
          }
          miniatureId = uploadData.id;
        }
        const response = await fetch("/api/articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title,
            content,
            abstract,
            miniatureId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            success: false,
            error: data.error || "Failed to create article",
          } as ApiResponse<Article>;
        }

        return {
          success: true,
          data,
        } as ApiResponse<Article>;

      } catch {
        return {
          success: false,
          error: "Unable to connect to the server",
        } as ApiResponse<Article>;
      }
    },
    getDraft: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) return { success: false, error: data.error || "Failed to load draft" } as ApiResponse<Article>;
        return { success: true, data } as ApiResponse<Article>;
      } catch {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<Article>;
      }
    },
    submit: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/submit`, {
          method: "POST",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to submit article" } as ApiResponse<null>;
        }
        return { success: true, data: null } as ApiResponse<null>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<null>;
      }
    },
    //update article saved in dashboard
    update: async (
      articleId: string,
      title: string,
      content: string,
      miniature?: File | null,
      abstract?: string
    ) => {
      try {
        let miniatureId: string | undefined;

        if (miniature) {
          const formData = new FormData();
          formData.append("file", miniature);
          const uploadResponse = await fetch("/api/uploads", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          const uploadData = await uploadResponse.json();
          if (!uploadResponse.ok) {
            return {
              success: false,
              error: uploadData.error || "Failed to upload miniature",
            } as ApiResponse<Article>;
          }
          miniatureId = uploadData.id;
        }

        const response = await fetch(`/api/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ title, content, abstract, miniatureId }),
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to update article" } as ApiResponse<Article>;
        }
        return { success: true, data } as ApiResponse<Article>;
      } catch {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<Article>;
      }
    },
    //explore - list articles
    explore: async (params?: { search?: string; sort?: "newest" | "oldest"; page?: number; limit?: number }): Promise<ApiResponse<ListResult<Article>>> => {
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
          return { success: false, error: data.error || "Failed to load articles" };
        }
        return {
          success: true,
          data: {
            data: data.articles,
            total: data.total,
            page: data.page,
            pages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1,
          },
        };
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<any>;
      }
    },listDraft: async () => {
      return apiClient.dashboard.mine({status:"DRAFT"});
    },
    //get single article by ID
    getById: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || "Article not found" } as ApiResponse<ArticleDetail>;
        }
        return { success: true, data } as ApiResponse<ArticleDetail>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<ArticleDetail>;
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
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to load comments" } as ApiResponse<Comment[]>;
        }
        return { success: true, data } as ApiResponse<Comment[]>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<Comment[]>;
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
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to post comment" } as ApiResponse<Comment>;
        }
        return { success: true, data } as ApiResponse<Comment>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<Comment>;
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
          return { success: false, error: data.error || "Failed to load submitted articles" };
        }
        return {
          success: true,
          data: {
            data: data.articles,
            total: data.total,
            page: data.page,
            pages: data.totalPages,
            hasNext: data.page < data.totalPages,
            hasPrev: data.page > 1,
          },
        };
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<ListResult<Article>>;
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
          return { success: false, error: data.error || "Failed to load reviewing article" } as ApiResponse<Article>;
        }
        return { success: true, data } as ApiResponse<Article>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<Article>;
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
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to post decision" } as ApiResponse<null>;
        }
        return { success: true, data: null } as ApiResponse<null>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<null>;
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
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to post review" } as ApiResponse<Review>;
        }
        return { success: true, data } as ApiResponse<Review>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<Review>;
      }
    },
    getReviews: async (articleId: string) => {
      try {
        const response = await fetch(`/api/articles/${articleId}/reviews`, {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to load reviews" } as ApiResponse<Review[]>;
        }
        return { success: true, data } as ApiResponse<Review[]>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<Review[]>;
      }
    },
  },
}

