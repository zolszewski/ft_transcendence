
export enum ArticleStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PUBLISHED = "PUBLISHED",
}

export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type DashboardStats = {
  articleCounts: Record<string, number>;
  reviewCounts: Record<string, number>;
  approvalRate: number | null;
  daysSinceJoined: number;
};


export interface User {
  id: string;
  name: string;
  email: string;
  faculty: string;
  specialization: string;
  createdAt?: string;
  avatarId?: string | null;
  avatarUrl?: string | null; // <-- Computed URL returned by backend (/api/users/me, /api/users/:id)
  avatar?: {
    id: string;
    url: string;
  } | null;
  

}

export interface Article {
  id: string;
  title: string;
  content: string;
  abstract: string | null;
  miniature: string | null;
  documentUrl: string | null;
  miniatureFocusX?: number;
  miniatureFocusY?: number;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  status: ArticleStatus;
}

export interface ArticleDetail extends Article {
  reviews: Review[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  articleId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  articleId: string;
  reviewerId: string;
  reviewer?: User;
  comment?: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}


export interface UserDetail extends User {
  articles?: Article[];
  reviews?: Review[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}


export interface Message {
  id: string;
  content: string;
  conversationId: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
}


export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type FriendRelationStatus = "none" | "friends" | "pending_outgoing" | "pending_incoming";

export type FriendSummary = {
  id: string;
  name: string;
  faculty: string | null;
  avatarUrl: string | null;
};

export type FriendRequestItem = {
  id: string;
  createdAt: string;
  from: FriendSummary;
};
