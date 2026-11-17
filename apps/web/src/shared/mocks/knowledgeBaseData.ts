export interface KnowledgeDocument {
  id: string;
  name: string;
  description: string;
  type: 'PDF' | 'DOCX' | 'CSV' | 'TXT';
  size: string;
  status: 'Ready' | 'Processing' | 'Chunking' | 'Failed';
  progress?: number;
  updated: string;
  errorReason?: string;
}

export const initialDocuments: KnowledgeDocument[] = [
  {
    id: 'doc-1',
    name: 'Pricing Policy.pdf',
    description: 'Agency tier rates & custom retainer schedules',
    type: 'PDF',
    size: '1.4 MB',
    status: 'Ready',
    updated: 'Today, 11:20 AM',
  },
  {
    id: 'doc-2',
    name: 'Client Onboarding Playbook.pdf',
    description: '14-day client launch sequence & intake questions',
    type: 'PDF',
    size: '2.8 MB',
    status: 'Ready',
    updated: 'Today, 09:45 AM',
  },
  {
    id: 'doc-3',
    name: 'ICP Target Specifications.csv',
    description: 'B2B SaaS marketing director attributes & filters',
    type: 'CSV',
    size: '850 KB',
    status: 'Ready',
    updated: 'Yesterday, 4:10 PM',
  },
  {
    id: 'doc-4',
    name: 'Brand Guidelines.docx',
    description: 'Voice, messaging pillars & tone guidelines',
    type: 'DOCX',
    size: '4.2 MB',
    status: 'Processing',
    progress: 64,
    updated: 'Just now',
  },
  {
    id: 'doc-5',
    name: 'Onboarding SOP.pdf',
    description: 'Standard operating procedure for new agency clients',
    type: 'PDF',
    size: '3.1 MB',
    status: 'Chunking',
    progress: 28,
    updated: '4 mins ago',
  },
  {
    id: 'doc-6',
    name: 'Client Master Agreement_Draft.pdf',
    description: 'Unverified scan document with OCR issues',
    type: 'PDF',
    size: '12.4 MB',
    status: 'Failed',
    errorReason: 'Corrupted OCR scan',
    updated: 'Yesterday',
  },
];

export interface PlaygroundTestQuery {
  query: string;
  model: string;
  latency: string;
  sourcesCount: number;
  answer: string;
  citations: string[];
}

export const samplePlaygroundQuery: PlaygroundTestQuery = {
  query: 'What is our refund policy for enterprise clients?',
  model: 'Claude 3.5 Sonnet',
  latency: '380ms',
  sourcesCount: 2,
  answer:
    'According to our Master Service Agreement (Section 8.2) and Pricing Policy, enterprise retainer clients may request a prorated credit refund within 14 business days of billing cycle inception if SLA uptime falls below 99.5% or designated AI agent deliverables fail verification twice in succession.',
  citations: ['Pricing Policy.pdf (Page 4, Section 8.2)', 'Client Onboarding Playbook.pdf (Page 11)'],
};
