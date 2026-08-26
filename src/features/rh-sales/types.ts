export type Customer = {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  phones?: string[];
  website?: string;
  avatarUrl?: string;
  generalInfo?: string;
  needs?: string;
  customerConcerns?: string;
  addedDate: any; // Can be a string or a Firestore Timestamp
  displayOrder?: number;
  bestTimeToContact?: string;
  convictionScore?: number;
};

export type Concern = {
  id: string;
  customerId: string;
  date: any; // Can be a string or a Firestore Timestamp
  originalText: string;
  summary: string;
  category: string;
  status: "new" | "analyzed" | "resolved";
};

export type KnowledgeBaseArticle = {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  displayOrder?: number;
};

export type Skill = {
  id: string;
  title: string;
  description: string;
  displayOrder?: number;
};

    
