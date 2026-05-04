export type Confidence = 'high' | 'medium' | 'low';
export type ReviewStatus = 'confirmed' | 'draft' | 'rejected';
export type RelationshipType =
  | 'brand_operator'
  | 'parent_company'
  | 'payment_institution'
  | 'banking_as_a_service'
  | 'partnership';

export interface OwnershipSource {
  title: string;
  url: string;
}

export interface OwnershipMapping {
  brand: string;
  operator: string;
  parentCompany?: string;
  relatedInstitutionName: string;
  ispb: string | null;
  cnpj: string | null;
  relationshipType: RelationshipType;
  confidence: Confidence;
  reviewStatus: ReviewStatus;
  notes: string;
  sources: OwnershipSource[];
}

export interface SearchDocument {
  title: string;
  subtitle: string;
  href: string;
  terms: string;
  kind: 'institution' | 'brand' | 'guide';
}
