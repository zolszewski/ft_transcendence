import type { User, Article, Comment, Review, ArticleDetail, ListResult } from "./types";

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

export const apiClient = {
    articles : {
    //publish
    create: async (title: string, content: string, miniature?: File | null) => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (miniature) formData.append("miniature", miniature);
      try {
        const response = await fetch(`/api/articles`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          return { success: false, error: data.error || "Failed to create article" } as ApiResponse<Article>;
        }
        return { success: true, data } as ApiResponse<Article>;
      } catch (err) {
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
    //explore - list articles
    explore: async (params?: { search?: string; sort?: "newest" | "oldest"; page?: number; limit?: number }) => {
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
          return { success: false, error: data.error || "Failed to load articles" } as ApiResponse<any>;
        }
        return { success: true, data } as ApiResponse<any>;
      } catch (err) {
        return { success: false, error: "Unable to connect to the server" } as ApiResponse<any>;
      }
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
    //reviews
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

