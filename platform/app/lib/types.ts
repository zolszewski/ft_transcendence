
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

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  abstract: string | null;
  miniature: string | null;
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


export interface ListResult<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
