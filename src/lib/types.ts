
export type Project = 'RHM' | 'pova' | 'other' | 'firefly';

export type Domain = {
  id?: string; // Firestore uses string IDs
  domainName: string;
  status: 'active' | 'inactive';
  collectionDate: string; // ISO 8601 format
  renewalDate: string; // ISO 8601 format
  dataSheet: string;
  outstandingBalance?: number;
  renewalCostClient: number | '';
  renewalCostOffice: number | '';
  renewalCostPova?: number | '';
  renewalCostFirefly?: number | '';
  projects?: Project[];
  hasInstallments?: boolean;
  installmentCount?: number | '';
  installmentsPaid?: number;
  isOnlineCatalog?: boolean;
};

export type Todo = {
  id?: string;
  domainId?: string; // Optional for general todos
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601 string
  isHighPriority?: boolean;
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
