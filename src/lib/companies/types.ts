export type CompanyContact = {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
};

export type Company = {
  id: string;
  name: string;

  notes: string;
  tags: string[];

  website: string;
  linkedin: string;

  billingEmail: string;
  billingAddress: string;
  vatNumber: string;

  contacts: CompanyContact[];

  createdAt: string;
  updatedAt: string;
};

