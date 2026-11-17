
export type Project = 'RHM' | 'pova' | 'other' | 'firefly' | 'android';

export type Domain = {
  id?: string; // Firestore uses string IDs
  domainName: string;
  faviconUrl?: string;
  status: 'active' | 'inactive';
  collectionDate: string; // ISO 8601 format
  renewalDate: string; // ISO 8601 format
  dataSheet: string;
  outstandingBalance?: number;
  renewalCostClient: number | '';
  renewalCost?: number | '';
  renewalCostCurrency?: 'USD' | 'EGP';
  renewalCostClientCurrency?: 'USD' | 'EGP';
  renewalCostOffice: number | '';
  renewalCostOfficeCurrency?: 'USD' | 'EGP';
  renewalCostPova?: number | '';
  renewalCostPovaCurrency?: 'USD' | 'EGP';
  renewalCostFirefly?: number | '';
  renewalCostFireflyCurrency?: 'USD' | 'EGP';
  projects?: Project[];
  hasInstallments?: boolean;
  installmentCount?: number | '';
  installmentsPaid?: number;
  isOnlineCatalog?: boolean;
  isArchived?: boolean;
  archivedAt?: string; // ISO 8601 format - تاريخ الأرشفة
};

export type Todo = {
  id?: string;
  domainId?: string; // Optional for general todos
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601 string
  isHighPriority?: boolean;
  order?: number; // For manual ordering
};

export type ApiKeyStatus = {
  key: string;
  name: string;
  status: 'checking' | 'online' | 'offline';
};

export type Fault = {
  id?: string;
  text: string;
  createdAt: string; // ISO 8601 string
};

export type ContentIdea = {
  id?: string;
  text: string;
  createdAt: string;
  owner: string; // 'ahmed-abu-ezz' or 'ahmed-abdo'
};
