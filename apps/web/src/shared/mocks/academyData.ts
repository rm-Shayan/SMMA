export interface PlaybookItem {
  id: string;
  title: string;
  badge: "Due in 3 days" | "In progress" | "Passed" | "Optional";
  badgeVariant: "error" | "warning" | "success" | "default";
  subtitle: string;
  category: "todo" | "completed";
  duration: string;
  readTime: string;
  score?: number;
  completedDate?: string;
  modulesCompleted?: number;
  totalModules?: number;
  quizRoute: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  score: number;
  issuedDate: string;
  credentialId: string;
}

export interface QuizQuestion {
  id: number;
  type: string;
  scenarioTitle: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    recommended?: boolean;
    explanation?: string;
  }>;
  correctOptionId: string;
}

export const MOCK_ACADEMY_DATA = {
  kpis: {
    assignedPlaybooks: 4,
    completed: 2,
    completionRate: "50% Pace",
    averageScore: 88,
    benchmarkScore: 84,
  },
  playbooks: [
    {
      id: "pb-1",
      title: "Agency Cold Outreach Playbook v2",
      badge: "Due in 3 days",
      badgeVariant: "error",
      subtitle: "Due in 3 days • 15 min read • Required for Outreach Agent #6 autonomy",
      category: "todo",
      duration: "15 min read",
      readTime: "15 min",
      quizRoute: "/academy/quiz",
    },
    {
      id: "pb-2",
      title: "Client Escalation Guidelines",
      badge: "In progress",
      badgeVariant: "warning",
      subtitle: "In progress (Module 2 of 4) • Last opened yesterday",
      category: "todo",
      duration: "Module 2 of 4",
      readTime: "25 min",
      modulesCompleted: 2,
      totalModules: 4,
      quizRoute: "/academy/quiz",
    },
    {
      id: "pb-3",
      title: "Brand Voice Basics",
      badge: "Passed",
      badgeVariant: "success",
      score: 92,
      subtitle: "Completed on Oct 14 • 20 question certification quiz",
      category: "completed",
      completedDate: "Oct 14",
      duration: "Completed",
      readTime: "20 questions",
      quizRoute: "/academy/quiz/result",
    },
    {
      id: "pb-4",
      title: "Data Handling Policy",
      badge: "Passed",
      badgeVariant: "success",
      score: 84,
      subtitle: "Completed on Sep 28 • Annual compliance standard",
      category: "completed",
      completedDate: "Sep 28",
      duration: "Completed",
      readTime: "Annual",
      quizRoute: "/academy/quiz/result",
    },
  ] as PlaybookItem[],
  certificates: [
    {
      id: "cert-1",
      title: "Brand Voice Basics",
      score: 92,
      issuedDate: "Oct 14, 2024",
      credentialId: "SOP-84919-AUTH",
    },
    {
      id: "cert-2",
      title: "Data Handling Policy",
      score: 84,
      issuedDate: "Sep 28, 2024",
      credentialId: "SOP-84918-AUTH",
    },
  ] as CertificateItem[],
  quizQuestions: [
    {
      id: 1,
      type: "Scenario question",
      scenarioTitle: "Initial lead qualification criteria and ICP filtering",
      question: "Which criteria must be verified before Outreach Agent #6 sends the first touchpoint?",
      options: [
        { id: "a", text: "Prospect email syntax and verified MX record" },
        { id: "b", text: "Match on industry, verified revenue tier, and absence from global DNC", recommended: true, explanation: "Standard operating qualification criteria per Section 1.1." },
        { id: "c", text: "Only check company LinkedIn follower count" },
        { id: "d", text: "Send first touch without qualification" },
      ],
      correctOptionId: "b",
    },
    {
      id: 2,
      type: "Knowledge check",
      scenarioTitle: "Email subject line capitalization and personalization limits",
      question: "What is the maximum allowed custom merge token count in an email subject?",
      options: [
        { id: "a", text: "No limit" },
        { id: "b", text: "Maximum 1 personalized token (e.g., Company name)", recommended: true, explanation: "Prevents spam filters from scoring high variability triggers." },
        { id: "c", text: "At least 4 tokens" },
        { id: "d", text: "All caps is required" },
      ],
      correctOptionId: "b",
    },
    {
      id: 3,
      type: "Scenario question",
      scenarioTitle: "Outreach Guardrails & Escalation",
      question: "A prospect replies to your cold email asking about pricing. What is the best next step?",
      options: [
        { id: "a", text: "Send the full price list immediately" },
        {
          id: "b",
          text: "Reply with a short answer and suggest a quick call",
          recommended: true,
          explanation: "Encourages value discovery and prevents early price dismissal per SOP Section 4.2.",
        },
        { id: "c", text: "Ignore the message until the follow-up step" },
        { id: "d", text: "Forward it to the manager without replying" },
      ],
      correctOptionId: "b",
    },
    {
      id: 4,
      type: "Guardrail rule",
      scenarioTitle: "Follow-up cadence within autonomous outbound sequence limits",
      question: "What is the minimum cooling interval required between step 2 and step 3 follow-ups?",
      options: [
        { id: "a", text: "12 hours" },
        { id: "b", text: "3 business days", recommended: true, explanation: "Protects domain reputation and recipient sentiment." },
        { id: "c", text: "Same afternoon" },
        { id: "d", text: "14 days" },
      ],
      correctOptionId: "b",
    },
    {
      id: 5,
      type: "Compliance mandate",
      scenarioTitle: "Handling unsubscribe requests & compliance tagging across CRM channels",
      question: "When a contact replies 'Stop emailing me', what must occur immediately?",
      options: [
        { id: "a", text: "Ignore the message until the automated sequence completes its full 5-step cycle." },
        {
          id: "b",
          text: "Immediately flag contact as 'DNC-Global' and purge pending scheduled outbound steps.",
          recommended: true,
          explanation: "SOP Section 4.2 Mandate: Strict CAN-SPAM and GDPR guardrails require instantaneous suppression.",
        },
        { id: "c", text: "Offer them a 50% discount instead" },
        { id: "d", text: "Switch to sending them LinkedIn messages" },
      ],
      correctOptionId: "b",
    },
    {
      id: 6,
      type: "Escalation flow",
      scenarioTitle: "Escalation protocol for high-value enterprise accounts requesting custom SLAs",
      question: "Who must approve bespoke pricing or non-standard contract terms?",
      options: [
        { id: "a", text: "Any employee" },
        { id: "b", text: "Company Admin or Client Owner sign-off", recommended: true },
        { id: "c", text: "Automated agent autonomously accepts" },
        { id: "d", text: "Reject the lead immediately" },
      ],
      correctOptionId: "b",
    },
    {
      id: 7,
      type: "Brand positioning",
      scenarioTitle: "Tone guardrails & brand positioning parameters for automated nudges",
      question: "Which tone style is required for all outbound communications?",
      options: [
        { id: "a", text: "Aggressive & urgent countdowns" },
        { id: "b", text: "Professional, consultative, and concise", recommended: true },
        { id: "c", text: "Casual memes and slang" },
        { id: "d", text: "Pure corporate jargon" },
      ],
      correctOptionId: "b",
    },
    {
      id: 8,
      type: "Technical limit",
      scenarioTitle: "Spam trigger word thresholds and link count caps in copy generation",
      question: "How many outbound hyperlinks are permitted in cold email Step 1?",
      options: [
        { id: "a", text: "Maximum 1 hyperlink (opt-out link or calendar link only)", recommended: true },
        { id: "b", text: "5 hyperlinks" },
        { id: "c", text: "10 hyperlinks" },
        { id: "d", text: "No limit" },
      ],
      correctOptionId: "a",
    },
  ],
};
