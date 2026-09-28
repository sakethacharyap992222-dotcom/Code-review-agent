import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, FolderGit2, Code2, GitPullRequest, History, ShieldAlert, BookOpen, Layers, Brain, BarChart3, Users, Settings, Sun, Moon, Bell, Search, Plus, CheckCircle2, XCircle, AlertTriangle, Info, ChevronRight, Sparkles, RefreshCw, Cpu, FileCode, Play, Database, ExternalLink, Menu, X
} from 'lucide-react';

// ==================== TYPE DEFINITIONS ====================

export interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  branch: string;
  languages: string[];
  healthScore: number;
  filesCount: number;
  lastAnalyzed: string;
  status: 'Healthy' | 'Warning' | 'Critical' | string;
  archPattern: string;
}

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingCategory = 'Architecture' | 'Security' | 'Code Quality' | 'Performance' | 'Bugs' | string;
export type FindingStatus = 'OPEN' | 'ACCEPTED' | 'REJECTED';

export interface Finding {
  id: string;
  repoId: string;
  file: string;
  line: number;
  severity: SeverityLevel;
  category: FindingCategory;
  title: string;
  description: string;
  whyItMatters: string;
  ruleSource: string;
  confidence: number;
  status: FindingStatus;
  codeSnippet: string;
  suggestedFix?: string;
  rejectionReason?: string;
}

export interface Rule {
  id: string;
  code: string;
  title: string;
  category: string;
  severity: SeverityLevel | string;
  description: string;
  targetLang: string;
  pattern: string;
  enabled: boolean;
}

export interface AgentMemory {
  id: string;
  title: string;
  category: string;
  occurrences: number;
  accepted: number;
  rejected: number;
  confidence: number;
  ruleText: string;
  lastUpdated: string;
  status: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'Developer' | string;
  avatar: string;
  status: 'Active' | 'Away' | string;
  reviewsCount: number;
}

export interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface RejectionModalState {
  open: boolean;
  findingId: string | null;
  reason: string;
  notes: string;
}

// ==================== INITIAL DATA ====================

const INITIAL_REPOSITORIES: Repository[] = [
  { id: 'repo-1', name: 'payment-gateway-service', owner: 'acme-corp', url: 'https://github.com/acme/payment-gateway', branch: 'main', languages: ['TypeScript', 'Node.js', 'PostgreSQL'], healthScore: 88, filesCount: 142, lastAnalyzed: '10 mins ago', status: 'Healthy', archPattern: 'Controller → Service → Repository → DB' },
  { id: 'repo-2', name: 'user-auth-microservice', owner: 'acme-corp', url: 'https://github.com/acme/user-auth', branch: 'main', languages: ['TypeScript', 'Redis', 'Express'], healthScore: 92, filesCount: 89, lastAnalyzed: '2 hours ago', status: 'Healthy', archPattern: 'Clean Architecture / DDD' },
  { id: 'repo-3', name: 'analytics-dashboard-ui', owner: 'acme-corp', url: 'https://github.com/acme/analytics-ui', branch: 'develop', languages: ['React', 'TypeScript', 'Tailwind'], healthScore: 74, filesCount: 310, lastAnalyzed: 'Yesterday', status: 'Warning', archPattern: 'Feature-based Modular React' },
  { id: 'repo-4', name: 'ml-recommendation-engine', owner: 'acme-corp', url: 'https://github.com/acme/ml-recommender', branch: 'main', languages: ['Python', 'FastAPI', 'PyTorch'], healthScore: 81, filesCount: 64, lastAnalyzed: '3 days ago', status: 'Healthy', archPattern: 'Async FastAPI Pipeline' },
];

const INITIAL_FINDINGS: Finding[] = [
  {
    id: 'find-101',
    repoId: 'repo-1',
    file: 'src/controllers/paymentController.ts',
    line: 42,
    severity: 'CRITICAL',
    category: 'Architecture',
    title: 'Direct Database Access inside API Controller',
    description: 'Direct SQL execution detected within controller action without using the UserRepository layer.',
    whyItMatters: 'Violates team architecture guideline preventing direct DB query coupling in HTTP presentation layers. Breaks testability and transaction handling.',
    ruleSource: 'Arch Rule #04: Mandatory Repository Pattern',
    confidence: 0.96,
    status: 'OPEN',
    codeSnippet: `export async function processPayment(req: Request, res: Response) {\n  const { userId, amount } = req.body;\n  // VIOLATION: Direct DB Query in Controller!\n  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);\n  if (!user) return res.status(404).send('User not found');\n  const charge = await stripe.charges.create({ amount, currency: 'usd' });\n  return res.json({ success: true, charge });\n}`,
    suggestedFix: `export async function processPayment(req: Request, res: Response) {\n  const { userId, amount } = req.body;\n  // CORRECT: Using UserRepository abstraction\n  const user = await userRepository.findById(userId);\n  if (!user) return res.status(404).send('User not found');\n  const charge = await paymentService.processCharge(user, amount);\n  return res.json({ success: true, charge });\n}`
  },
  {
    id: 'find-102',
    repoId: 'repo-1',
    file: 'src/utils/security.ts',
    line: 18,
    severity: 'CRITICAL',
    category: 'Security',
    title: 'Potential Hardcoded Secret / JWT Signature Salt',
    description: 'String fallback "super-secret-default-key" used when process.env.JWT_SECRET is undefined.',
    whyItMatters: 'If production environment variables misconfigure, fallback secret permits effortless token forgery and complete authentication bypass.',
    ruleSource: 'Security Rule #12: No Fallback Secrets in Code',
    confidence: 0.99,
    status: 'OPEN',
    codeSnippet: `export function verifyToken(token: string) {\n  const secret = process.env.JWT_SECRET || "super-secret-default-key";\n  return jwt.verify(token, secret);\n}`,
    suggestedFix: `export function verifyToken(token: string) {\n  const secret = process.env.JWT_SECRET;\n  if (!secret) {\n    throw new Error("CRITICAL_CONFIG_ERROR: JWT_SECRET environment variable is not defined!");\n  }\n  return jwt.verify(token, secret);\n}`
  },
  {
    id: 'find-103',
    repoId: 'repo-3',
    file: 'src/components/UserTable.tsx',
    line: 87,
    severity: 'MEDIUM',
    category: 'Code Quality',
    title: 'Forbidden use of TypeScript `any` type',
    description: 'Variable `userPayload` is explicitly typed as `any`.',
    whyItMatters: 'Disables TypeScript compiler safety guarantees, exposing runtime null/undefined field access bugs.',
    ruleSource: 'Team Standard TS-02: Strict Type Safety',
    confidence: 0.91,
    status: 'OPEN',
    codeSnippet: `const renderRow = (userPayload: any) => {\n  return <tr><td>{userPayload.profile.name}</td></tr>;\n};`,
    suggestedFix: `interface UserPayload {\n  profile: { name: string; email: string };\n}\nconst renderRow = (userPayload: UserPayload) => {\n  return <tr><td>{userPayload.profile.name}</td></tr>;\n};`
  },
  {
    id: 'find-104',
    repoId: 'repo-1',
    file: 'src/services/orderService.ts',
    line: 112,
    severity: 'HIGH',
    category: 'Performance',
    title: 'N+1 Database Query in Async Loop',
    description: 'Executing database query inside `map()` or `forEach()` loop instead of performing batch lookup.',
    whyItMatters: 'Leads to exponential database roundtrips as array size increases, leading to severe latency spikes under load.',
    ruleSource: 'Performance Best Practice #08',
    confidence: 0.94,
    status: 'OPEN',
    codeSnippet: `async function populateOrderItems(orders: Order[]) {\n  for (const order of orders) {\n    // N+1 Query bug\n    order.items = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);\n  }\n  return orders;\n}`,
    suggestedFix: `async function populateOrderItems(orders: Order[]) {\n  const orderIds = orders.map(o => o.id);\n  const allItems = await db.query('SELECT * FROM order_items WHERE order_id = ANY($1)', [orderIds]);\n  const itemMap = groupBy(allItems, 'order_id');\n  orders.forEach(order => { order.items = itemMap[order.id] || []; });\n  return orders;\n}`
  }
];

const INITIAL_RULES: Rule[] = [
  { id: 'rule-1', code: 'ARCH-01', title: 'Layered Isolation Architecture', category: 'Architecture', severity: 'CRITICAL', description: 'Controllers must never invoke DB or ORM methods directly. Always route via Service/Repository classes.', targetLang: 'TypeScript', pattern: 'db.query|prisma.|knex(', enabled: true },
  { id: 'rule-2', code: 'SEC-02', title: 'No Fallback Cryptographic Secrets', category: 'Security', severity: 'CRITICAL', description: 'Never provide fallback default string constants for env credentials, JWT secrets, or DB passwords.', targetLang: 'All', pattern: 'process.env.*||.*["\']', enabled: true },
  { id: 'rule-3', code: 'TS-03', title: 'Explicit Typing over `any`', category: 'Code Quality', severity: 'MEDIUM', description: 'Explicitly prohibit `any` declaration in TypeScript files. Use `unknown` or named interfaces.', targetLang: 'TypeScript', pattern: ': any', enabled: true },
  { id: 'rule-4', code: 'PERF-01', title: 'Avoid N+1 Async Queries', category: 'Performance', severity: 'HIGH', description: 'Ban await calls inside loop constructs like forEach/map. Use batch SQL queries or dataloaders.', targetLang: 'All', pattern: 'for.*await|map.*await', enabled: true },
  { id: 'rule-5', code: 'DB-01', title: 'Indexed Foreign Key Constraints', category: 'Database', severity: 'HIGH', description: 'All database foreign keys must have associated composite indexes to optimize JOIN operations.', targetLang: 'SQL', pattern: 'REFERENCES.*(?!INDEX)', enabled: true }
];

const INITIAL_MEMORIES: AgentMemory[] = [
  { id: 'mem-1', title: "Enforce Strict Repository Pattern in Express APIs", category: "Architecture", occurrences: 28, accepted: 26, rejected: 2, confidence: 93, ruleText: "Team strictly prefers database interactions inside src/repositories/ only.", lastUpdated: "2 days ago", status: "Active" },
  { id: 'mem-2', title: "Never accept `any` type in API Payloads", category: "Code Quality", occurrences: 45, accepted: 44, rejected: 1, confidence: 98, ruleText: "Developer feedback confirmed zero-tolerance for `any` types even in draft PRs.", lastUpdated: "Yesterday", status: "Active" },
  { id: 'mem-3', title: "Allow inline SQL in Migration scripts", category: "Exceptions", occurrences: 12, accepted: 2, rejected: 10, confidence: 83, ruleText: "Agent learned NOT to flag SQL execution inside files under /migrations folder.", lastUpdated: "5 days ago", status: "Active" },
  { id: 'mem-4', title: "Prefer Axios over native fetch in React UI", category: "Team Preference", occurrences: 19, accepted: 17, rejected: 2, confidence: 89, ruleText: "Team standardizes on custom pre-configured Axios client instances with auth interceptors.", lastUpdated: "1 week ago", status: "Active" }
];

const INITIAL_MEMBERS: TeamMember[] = [
  { id: 'u-1', name: 'Alex Rivera', email: 'alex@acme.dev', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', status: 'Active', reviewsCount: 42 },
  { id: 'u-2', name: 'Sarah Chen', email: 'sarah@acme.dev', role: 'Reviewer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', status: 'Active', reviewsCount: 31 },
  { id: 'u-3', name: 'Michael Marcus', email: 'michael@acme.dev', role: 'Developer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', status: 'Active', reviewsCount: 19 },
  { id: 'u-4', name: 'Elena Rostova', email: 'elena@acme.dev', role: 'Developer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', status: 'Away', reviewsCount: 14 }
];

// Recharts Trend Data
const REVIEW_ACTIVITY_DATA = [
  { day: 'Mon', reviews: 18, findings: 45, accepted: 40 },
  { day: 'Tue', reviews: 24, findings: 58, accepted: 52 },
  { day: 'Wed', reviews: 31, findings: 72, accepted: 64 },
  { day: 'Thu', reviews: 22, findings: 40, accepted: 38 },
  { day: 'Fri', reviews: 29, findings: 61, accepted: 55 },
  { day: 'Sat', reviews: 12, findings: 19, accepted: 17 },
  { day: 'Sun', reviews: 8, findings: 11, accepted: 10 }
];

const CATEGORY_PIE_DATA = [
  { name: 'Architecture', value: 35, color: '#6366f1' },
  { name: 'Security', value: 25, color: '#ef4444' },
  { name: 'Code Quality', value: 20, color: '#f59e0b' },
  { name: 'Performance', value: 12, color: '#10b981' },
  { name: 'Testing', value: 8, color: '#06b6d4' }
];

// ==================== MAIN COMPONENT ====================

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [role, setRole] = useState<'Admin' | 'Reviewer' | 'Developer'>('Admin');
  const [workspace] = useState<string>('Acme Corp Engineering');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // App Data State
  const [repositories, setRepositories] = useState<Repository[]>(INITIAL_REPOSITORIES);
  const [findings, setFindings] = useState<Finding[]>(INITIAL_FINDINGS);
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [memories, setMemories] = useState<AgentMemory[]>(INITIAL_MEMORIES);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  
  // UI Modal & Interaction States
  const [selectedRepoId, setSelectedRepoId] = useState<string>('repo-1');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [activeDeepDiveRepo, setActiveDeepDiveRepo] = useState<Repository | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  
  // Code Review Studio Specific States
  const [reviewCodeSnippet, setReviewCodeSnippet] = useState<string>(
`// Select a file or paste pull-request code to trigger AI Review
import express, { Request, Response } from 'express';
import { db } from '../db';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Dynamic SQL Query vulnerability
  const query = "SELECT * FROM users WHERE email = '" + email + "' AND password = '" + password + "'";
  const result = await db.query(query);
  
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = result.rows[0];
  // Fallback JWT secret key
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'default_secret_key');
  
  return res.json({ token, user });
});

export default router;`
  );

  const [aiReviewLoading, setAiReviewLoading] = useState<boolean>(false);
  const [rejectionReasonModal, setRejectionReasonModal] = useState<RejectionModalState>({ 
    open: false, 
    findingId: null, 
    reason: 'False Positive', 
    notes: '' 
  });
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Sync dark class on body element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleTriggerAnalysis = (repo: Repository) => {
    setActiveDeepDiveRepo(repo);
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          showToast(`Repository '${repo.name}' analyzed successfully! Updated architectural context graph.`, 'success');
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  // Perform Live AI Code Review (with Gemini API or intelligent static analyzer engine)
  const handleRunAiCodeReview = async () => {
    setAiReviewLoading(true);
    showToast("Analyzing code changes against team rules, security specs & agent memories...", "info");

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: reviewCodeSnippet, repoId: selectedRepoId }),
      });
      if (response.ok) {
        const result = await response.json();
        const generatedFindings: Finding[] = (result.findings || []).map((item: any, idx: number) => ({
          id: `ai-find-${Date.now()}-${idx}`,
          repoId: selectedRepoId,
          file: 'src/routes/auth.ts',
          line: item.line || 1,
          severity: item.severity || 'MEDIUM',
          category: item.category || 'Code Quality',
          title: item.title || 'Code Defect Detected',
          description: item.description || '',
          whyItMatters: item.whyItMatters || '',
          ruleSource: item.ruleSource || 'Team Standard',
          confidence: item.confidence || 0.9,
          status: 'OPEN',
          codeSnippet: item.codeSnippet || '',
          suggestedFix: item.suggestedFix || '',
        }));
        setFindings((prev) => [...generatedFindings, ...prev]);
        showToast(`Gemini AI Review complete! Flagged ${generatedFindings.length} issue(s).`, 'success');
        setAiReviewLoading(false);
        return;
      }
      if (response.status !== 503) {
        const errorResult = await response.json().catch(() => ({}));
        console.warn('Backend AI review failed; using local analysis:', errorResult.error);
      }
    } catch (err) {
      console.warn('Backend unavailable; using local static analysis engine:', err);
    }

    // Dynamic Static Analysis Engine (Analyzes the code snippet based on active team rules)
    setTimeout(() => {
      const generatedFindings: Finding[] = [];
      const lines = reviewCodeSnippet.split('\n');

      lines.forEach((lineText, idx) => {
        const lineNum = idx + 1;
        // Check for SQL String Concatenation / SQL Injection
        if (lineText.includes("SELECT") && (lineText.includes(" + ") || lineText.includes("${"))) {
          generatedFindings.push({
            id: `find-sqli-${Date.now()}-${lineNum}`,
            repoId: selectedRepoId,
            file: 'src/routes/auth.ts',
            line: lineNum,
            severity: 'CRITICAL',
            category: 'Security',
            title: 'SQL Injection Vulnerability Detected',
            description: 'Direct string concatenation within an SQL query expression permits arbitrary SQL injection.',
            whyItMatters: 'Unauthenticated attackers can bypass credentials or execute administrative commands against the database.',
            ruleSource: 'Security Standard SEC-01: Parameterized Queries',
            confidence: 0.98,
            status: 'OPEN',
            codeSnippet: lineText.trim(),
            suggestedFix: `const query = "SELECT * FROM users WHERE email = $1 AND password = $2";\nconst result = await db.query(query, [email, password]);`
          });
        }

        // Check for Fallback secrets
        if (lineText.includes("process.env.") && lineText.includes("||") && (lineText.includes("secret") || lineText.includes("key") || lineText.includes("password"))) {
          generatedFindings.push({
            id: `find-secret-${Date.now()}-${lineNum}`,
            repoId: selectedRepoId,
            file: 'src/routes/auth.ts',
            line: lineNum,
            severity: 'CRITICAL',
            category: 'Security',
            title: 'Hardcoded Fallback Secret in Production Route',
            description: 'Fallback string constant used for environment variable encryption key.',
            whyItMatters: 'If environment variables are missing in deployment, fallback credentials allow attackers to forge tokens.',
            ruleSource: 'Security Rule SEC-02: No Fallback Secrets',
            confidence: 0.99,
            status: 'OPEN',
            codeSnippet: lineText.trim(),
            suggestedFix: `const secret = process.env.JWT_SECRET;\nif (!secret) throw new Error("JWT_SECRET must be defined!");`
          });
        }

        // Check for forbidden `any`
        if (lineText.includes(": any") || lineText.includes("<any>")) {
          generatedFindings.push({
            id: `find-any-${Date.now()}-${lineNum}`,
            repoId: selectedRepoId,
            file: 'src/routes/auth.ts',
            line: lineNum,
            severity: 'MEDIUM',
            category: 'Code Quality',
            title: 'Prohibited use of TypeScript `any` Type',
            description: 'Explicit `any` type disables compiler verification and leaks potential runtime failures.',
            whyItMatters: 'Breaks enterprise strict-typing guidelines.',
            ruleSource: 'TS Standard TS-03: Strict Type Safety',
            confidence: 0.94,
            status: 'OPEN',
            codeSnippet: lineText.trim(),
            suggestedFix: `// Replace 'any' with a dedicated type or interface\ntype SafePayload = Record<string, unknown>;`
          });
        }
      });

      // If no pattern matched, generate architectural review finding
      if (generatedFindings.length === 0) {
        generatedFindings.push({
          id: `find-arch-${Date.now()}`,
          repoId: selectedRepoId,
          file: 'src/routes/auth.ts',
          line: 12,
          severity: 'HIGH',
          category: 'Architecture',
          title: 'Direct Database Access from Route Handler',
          description: 'Route handler invokes db.query directly rather than dispatching through the UserService / UserRepository.',
          whyItMatters: 'Couples HTTP presentation layer directly to persistence schema, violating Clean Architecture pattern.',
          ruleSource: 'Arch Standard ARCH-01: Layered Isolation',
          confidence: 0.93,
          status: 'OPEN',
          codeSnippet: reviewCodeSnippet.slice(0, 160) + '...',
          suggestedFix: `const user = await authService.authenticateUser(email, password);\nif (!user) return res.status(401).json({ error: 'Invalid credentials' });`
        });
      }

      setFindings((prev) => [...generatedFindings, ...prev]);
      showToast(`Static Engine Review complete! Found ${generatedFindings.length} issue(s).`, "success");
      setAiReviewLoading(false);
    }, 600);
  };

  // Finding Decisions: Accept / Reject
  const handleAcceptFinding = (id: string) => {
    setFindings((prev) => prev.map(f => f.id === id ? { ...f, status: 'ACCEPTED' as FindingStatus } : f));
    showToast("Finding marked as Accepted. Updating Agent Memory feedback weights...", "success");
    setMemories((prev) => prev.map(m => m.id === 'mem-1' ? { ...m, occurrences: m.occurrences + 1, accepted: m.accepted + 1 } : m));
  };

  const handleConfirmRejection = () => {
    const { findingId, reason, notes } = rejectionReasonModal;
    if (!findingId) return;

    setFindings((prev) => prev.map(f => f.id === findingId ? { ...f, status: 'REJECTED' as FindingStatus, rejectionReason: reason } : f));
    setRejectionReasonModal({ open: false, findingId: null, reason: 'False Positive', notes: '' });
    showToast(`Suggestion rejected (${reason}). Agent memory updated to avoid similar flags.`, "info");
    
    // Auto-learn into Agent Memory
    const newMemory: AgentMemory = {
      id: `mem-${Date.now()}`,
      title: `Learned Exemption: ${reason}`,
      category: 'Developer Feedback',
      occurrences: 1,
      accepted: 0,
      rejected: 1,
      confidence: 85,
      ruleText: `Suppressed similar flags based on developer note: "${notes || reason}"`,
      lastUpdated: 'Just now',
      status: 'Active'
    };
    setMemories(prev => [newMemory, ...prev]);
  };

  // Filter findings based on search query
  const filteredFindings = findings.filter(f => 
    !searchQuery || 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.ruleSource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`app-shell min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md transition-all ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
          toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-5 h-5" /> : toast.type === 'info' ? <Info className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar w-full md:sticky md:top-0 md:h-screen md:w-64 border-r flex flex-col justify-between shrink-0 ${mobileNavOpen ? 'mobile-nav-open' : ''} ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="brand-mark w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-none text-slate-100">
                  CodeReview AI
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">v2.4 Autonomous</span>
              </div>
            </div>
            <button className="mobile-menu-toggle" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileNavOpen}>
              {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
              <span>{mobileNavOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>

          {/* Nav Items */}
          <nav className="side-nav flex gap-1 overflow-x-auto p-2 md:block md:space-y-1 md:overflow-visible">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'repositories', label: 'Repositories', icon: FolderGit2, badge: repositories.length },
              { id: 'review-code', label: 'Review Code Studio', icon: Code2, highlight: true },
              { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest, badge: '3' },
              { id: 'review-history', label: 'Review History', icon: History },
              { id: 'security-hub', label: 'Security Analysis', icon: ShieldAlert, alert: findings.filter(f => f.severity === 'CRITICAL' && f.status === 'OPEN').length },
              { id: 'team-standards', label: 'Team Standards', icon: BookOpen },
              { id: 'architecture-rules', label: 'Architecture Rules', icon: Layers },
              { id: 'agent-memory', label: 'Agent Memory', icon: Brain, highlightText: '94% Confidence' },
              { id: 'memory-architecture', label: 'Memory Architecture', icon: Database },
              { id: 'analytics', label: 'Analytics & Debt', icon: BarChart3 },
              { id: 'team-members', label: 'Team Members', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                  className={`w-auto min-w-fit md:w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30' 
                      : item.highlight
                      ? 'text-indigo-300 hover:bg-indigo-500/10'
                      : theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                  {typeof item.alert === 'number' && item.alert > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                      {item.alert}
                    </span>
                  )}
                  {item.highlightText && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {item.highlightText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Agent Status */}
        <div className="hidden p-3 m-3 rounded-xl bg-slate-900/90 border border-slate-800/80 md:block">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">Agent Learning Mode</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">ACTIVE</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Autonomous feedback ingestion active. Memory matrix synced.
          </p>
        </div>
      </aside>

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Navigation */}
        <header className={`app-header h-16 px-6 border-b flex items-center justify-between shrink-0 ${theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
          {/* Left Context / Search */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules, findings, PRs..."
                className={`w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border outline-none transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-200 placeholder-slate-500' 
                    : 'bg-slate-100 border-slate-300 focus:border-indigo-500 text-slate-800'
                }`}
              />
            </div>
            {/* Workspace Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs font-mono text-slate-300">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>{workspace}</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Role Toggle Button */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs font-medium">
              {(['Admin', 'Reviewer', 'Developer'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    role === r ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Quick Trigger Review Code */}
            <button
              onClick={() => setActiveTab('review-code')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 hover:opacity-90 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New AI Review</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Profile"
                className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover"
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-none">Alex Rivera</span>
                <span className="text-[10px] text-indigo-400 font-mono mt-0.5">{role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* View Routing Area */}
        <main className="app-main flex-1 overflow-y-auto p-5 md:p-7 space-y-6">
          {activeTab === 'dashboard' && (
            <EditorialDashboardView 
              repositories={repositories} 
              findings={filteredFindings} 
              memories={memories} 
              setActiveTab={setActiveTab} 
              handleAcceptFinding={handleAcceptFinding}
            />
          )}

          {activeTab === 'repositories' && (
            <RepositoriesView 
              repositories={repositories} 
              setIsConnectModalOpen={setIsConnectModalOpen}
              handleTriggerAnalysis={handleTriggerAnalysis}
            />
          )}

          {activeTab === 'review-code' && (
            <ReviewCodeStudio 
              repositories={repositories}
              selectedRepoId={selectedRepoId}
              setSelectedRepoId={setSelectedRepoId}
              reviewCodeSnippet={reviewCodeSnippet}
              setReviewCodeSnippet={setReviewCodeSnippet}
              handleRunAiCodeReview={handleRunAiCodeReview}
              aiReviewLoading={aiReviewLoading}
              findings={filteredFindings}
              handleAcceptFinding={handleAcceptFinding}
              setRejectionReasonModal={setRejectionReasonModal}
            />
          )}

          {activeTab === 'security-hub' && (
            <SecurityHubView findings={filteredFindings} handleAcceptFinding={handleAcceptFinding} />
          )}

          {activeTab === 'team-standards' && (
            <TeamStandardsView rules={rules} setRules={setRules} showToast={showToast} />
          )}

          {activeTab === 'architecture-rules' && (
            <ArchitectureRulesView showToast={showToast} />
          )}

          {activeTab === 'agent-memory' && (
            <AgentMemoryView memories={memories} setMemories={setMemories} showToast={showToast} />
          )}

          {activeTab === 'memory-architecture' && <MemoryArchitectureView />}

          {activeTab === 'analytics' && (
            <AnalyticsView findings={findings} memories={memories} />
          )}

          {activeTab === 'team-members' && (
            <TeamMembersView teamMembers={teamMembers} setTeamMembers={setTeamMembers} showToast={showToast} />
          )}

          {activeTab === 'pull-requests' && (
            <PullRequestsView 
              setActiveTab={setActiveTab} 
              setReviewCodeSnippet={setReviewCodeSnippet} 
              showToast={showToast}
            />
          )}

          {activeTab === 'review-history' && <ReviewHistoryView />}

          {activeTab === 'settings' && (
            <SettingsView showToast={showToast} />
          )}
        </main>
      </div>

      {/* Connect Repository Modal */}
      {isConnectModalOpen && (
        <ConnectRepoModal 
          isOpen={isConnectModalOpen} 
          onClose={() => setIsConnectModalOpen(false)}
          onAddRepo={(newRepo) => {
            setRepositories([newRepo, ...repositories]);
            setIsConnectModalOpen(false);
            showToast(`Repository ${newRepo.name} connected & scheduled for structural analysis!`);
          }}
        />
      )}

      {/* Deep Analysis Simulation Modal */}
      {isAnalyzing && (
        <AnalysisProgressModal repo={activeDeepDiveRepo} progress={analysisProgress} />
      )}

      {/* Rejection Reason Modal */}
      {rejectionReasonModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Reject AI Suggestion
            </h3>
            <p className="text-xs text-slate-400">
              Provide feedback to teach the agent why this suggestion was rejected. Future reviews will adjust accordingly.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Reason Category</label>
                <select
                  value={rejectionReasonModal.reason}
                  onChange={(e) => setRejectionReasonModal({ ...rejectionReasonModal, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none"
                >
                  <option value="False Positive">False Positive</option>
                  <option value="Intentional Design Choice">Intentional Design Choice</option>
                  <option value="Team Exception Authorized">Team Exception Authorized</option>
                  <option value="Already Handled Elsewhere">Already Handled Elsewhere</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Developer Notes (Optional)</label>
                <textarea
                  placeholder="e.g. This route is executed behind an isolated proxy middleware..."
                  value={rejectionReasonModal.notes}
                  onChange={(e) => setRejectionReasonModal({ ...rejectionReasonModal, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectionReasonModal({ open: false, findingId: null, reason: 'False Positive', notes: '' })}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-600/20"
              >
                Save Feedback & Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==================== SUB-VIEWS AND COMPONENTS ====================

type ArchitectureNode = {
  id: string;
  title: string;
  category: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
};

function MemoryArchitectureView() {
  const [selectedNode, setSelectedNode] = useState<ArchitectureNode | null>(null);

  const operations: ArchitectureNode[] = [
    { id: 'recall', title: 'RECALL', category: 'RETRIEVAL', description: 'Find relevant context', detail: 'Searches stored knowledge for facts and context that can inform the current code review.', icon: <Brain size={17} /> },
    { id: 'retain', title: 'RETAIN', category: 'INGESTION', description: 'Store durable knowledge', detail: 'Captures important project context and learned review patterns for future sessions.', icon: <Database size={17} /> },
    { id: 'reflect', title: 'REFLECT', category: 'REASONING', description: 'Synthesize what is known', detail: 'Reasons across remembered context to produce a considered answer or recommendation.', icon: <Sparkles size={17} /> },
  ];

  const memoryNodes: ArchitectureNode[] = [
    { id: 'documents', title: 'Documents', category: 'SOURCE', description: 'Original source material', detail: 'Stores source documents that provide the raw material for memory processing.', icon: <FileCode size={16} /> },
    { id: 'chunks', title: 'Chunks', category: 'INDEX', description: 'Retrievable text units', detail: 'Breaks source material into focused units that can be retrieved and used as context.', icon: <Layers size={16} /> },
    { id: 'vectors', title: 'Vectors', category: 'INDEX', description: 'Semantic representations', detail: 'Represents text semantically to support similarity-based retrieval.', icon: <Cpu size={16} /> },
    { id: 'facts', title: 'Facts', category: 'MEMORY', description: 'Atomic remembered details', detail: 'Keeps discrete facts extracted from project context and interactions.', icon: <BookOpen size={16} /> },
    { id: 'entity-graph', title: 'Entity Graph', category: 'MEMORY', description: 'Connected project concepts', detail: 'Connects people, projects, components, and concepts into a traversable knowledge graph.', icon: <Brain size={16} /> },
    { id: 'observations', title: 'Observations', category: 'MEMORY', description: 'Consolidated patterns', detail: 'Collects higher-level patterns synthesized from related facts and events.', icon: <Sparkles size={16} /> },
    { id: 'datasets', title: 'Datasets', category: 'COLLECTION', description: 'Grouped source material', detail: 'Organizes related source information into collections for memory processing.', icon: <Database size={16} /> },
    { id: 'mental-models', title: 'Mental Models', category: 'SYNTHESIS', description: 'Evolving project understanding', detail: 'Maintains structured understanding that can be refreshed as project context changes.', icon: <Layers size={16} /> },
    { id: 'knowledge-pages', title: 'Knowledge Pages', category: 'REFERENCE', description: 'Curated project knowledge', detail: 'Presents durable, organized knowledge pages for quick reference and recall.', icon: <BookOpen size={16} /> },
  ];

  const workerNodes: ArchitectureNode[] = [
    { id: 'consolidation', title: 'Consolidation', category: 'BACKGROUND JOB', description: 'Merge related memory signals', detail: 'Groups and consolidates related memory signals into more useful observations.', icon: <Layers size={16} /> },
    { id: 'refresh', title: 'Refresh', category: 'BACKGROUND JOB', description: 'Update mental models', detail: 'Refreshes derived project understanding so future recalls use current context.', icon: <RefreshCw size={16} /> },
  ];

  const renderNode = (node: ArchitectureNode, className: string) => (
    <button
      key={node.id}
      type="button"
      className={`memory-node ${className}${selectedNode?.id === node.id ? ' is-selected' : ''}`}
      onClick={() => setSelectedNode(node)}
      aria-pressed={selectedNode?.id === node.id}
    >
      <span className="memory-node-icon" aria-hidden="true">{node.icon}</span>
      <span className="memory-node-copy">
        <span className="memory-node-title">{node.title}</span>
        <span className="memory-node-description">{node.description}</span>
      </span>
      <span className="memory-node-category">{node.category}</span>
    </button>
  );

  const selectAgent: ArchitectureNode = {
    id: 'ai-agent',
    title: 'AI CODE REVIEW AGENT',
    category: 'ORCHESTRATOR',
    description: 'Code analysis and memory orchestration',
    detail: 'Coordinates code review with memory operations, drawing on recalled context and retaining useful project knowledge.',
    icon: <Brain size={19} />,
  };

  return (
    <section className="memory-architecture" aria-labelledby="memory-architecture-title">
      <header className="memory-architecture-heading">
        <div>
          <span className="memory-eyebrow"><span className="memory-live-dot" /> SYSTEM MAP / 01</span>
          <h1 id="memory-architecture-title">Memory Architecture</h1>
          <p>How review context moves through the Hindsight memory system.</p>
        </div>
        <span className="memory-version"><span /> HINDSIGHT CONNECTED</span>
      </header>

      <div className="memory-flow-stage">
        <section className="memory-agent-lane" aria-label="AI code review agent">
          <button
            type="button"
            className={`memory-agent-node${selectedNode?.id === selectAgent.id ? ' is-selected' : ''}`}
            onClick={() => setSelectedNode(selectAgent)}
            aria-pressed={selectedNode?.id === selectAgent.id}
          >
            <span className="memory-agent-glyph" aria-hidden="true"><Brain size={19} /></span>
            <span className="memory-agent-copy">
              <span className="memory-agent-kicker">PRIMARY ORCHESTRATOR</span>
              <strong>AI CODE REVIEW AGENT</strong>
              <span>Code analysis <i /> Memory orchestration</span>
            </span>
            <span className="memory-agent-status">ACTIVE</span>
          </button>
        </section>

        <div className="memory-agent-connector" aria-hidden="true">
          <svg viewBox="0 0 1200 68" preserveAspectRatio="none">
            <defs><marker id="memory-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" /></marker></defs>
            <path d="M600 0 V20 M200 20 H1000 M200 20 V62 M600 20 V62 M1000 20 V62" />
            <path className="memory-flow-pulse" d="M600 0 V20 M200 20 H1000 M200 20 V62 M600 20 V62 M1000 20 V62" />
          </svg>
        </div>

        <div className="memory-operation-grid" aria-label="Memory operations">
          {operations.map((node) => renderNode(node, 'memory-operation-node'))}
        </div>

        <div className="memory-bank-connector" aria-hidden="true">
          <svg viewBox="0 0 1200 54" preserveAspectRatio="none">
            <path d="M200 0 V16 Q200 34 600 34 H600 V50 M600 0 V50 M1000 0 V16 Q1000 34 600 34" />
            <path className="memory-flow-pulse" d="M200 0 V16 Q200 34 600 34 H600 V50 M600 0 V50 M1000 0 V16 Q1000 34 600 34" />
          </svg>
          <span>MEMORY I/O</span>
        </div>

        <section className="memory-bank-panel" aria-labelledby="memory-bank-title">
          <header className="memory-bank-header">
            <div className="memory-bank-title-group">
              <span className="memory-bank-glyph" aria-hidden="true"><Database size={17} /></span>
              <div>
                <span className="memory-section-kicker">PERSISTENT KNOWLEDGE LAYER</span>
                <h2 id="memory-bank-title">MEMORY BANK</h2>
              </div>
            </div>
            <span className="memory-bank-name"><span className="memory-bank-dot" /> code-reviewing-agent</span>
          </header>
          <div className="memory-node-grid">
            {memoryNodes.map((node) => renderNode(node, 'memory-storage-node'))}
          </div>
          <footer className="memory-bank-footer">
            <span>9 COMPONENTS</span><span className="memory-bank-footer-line" /><span>PROJECT SCOPE</span>
          </footer>
        </section>

        <div className="memory-worker-connector" aria-hidden="true">
          <svg viewBox="0 0 1200 48" preserveAspectRatio="none">
            <path d="M600 0 V44" />
            <path className="memory-flow-pulse" d="M600 0 V44" />
          </svg>
        </div>

        <section className="memory-worker-panel" aria-labelledby="memory-worker-title">
          <header className="memory-worker-header">
            <span className="memory-worker-glyph" aria-hidden="true"><RefreshCw size={16} /></span>
            <div>
              <span className="memory-section-kicker">ASYNC PROCESSING</span>
              <h2 id="memory-worker-title">HINDSIGHT WORKER</h2>
            </div>
            <span className="memory-worker-state"><i /> BACKGROUND</span>
          </header>
          <div className="memory-worker-nodes">
            {renderNode(workerNodes[0], 'memory-worker-node')}
            <span className="memory-worker-step" aria-hidden="true"><ChevronRight size={15} /></span>
            {renderNode(workerNodes[1], 'memory-worker-node')}
          </div>
        </section>

        <div className="memory-return-flow" aria-hidden="true">
          <svg className="memory-return-svg" viewBox="0 0 1200 18" preserveAspectRatio="none">
            <defs><marker id="memory-return-arrowhead" markerWidth="7" markerHeight="7" refX="2" refY="3.5" orient="auto"><path d="M7 0 L0 3.5 L7 7 Z" /></marker></defs>
            <path d="M1160 9 H40" markerEnd="url(#memory-return-arrowhead)" />
          </svg>
          <span>REFRESHED KNOWLEDGE RETURNS TO AGENT CONTEXT</span>
        </div>
      </div>

      {selectedNode && (
        <aside className="memory-details-panel" aria-live="polite" aria-label={`${selectedNode.title} details`}>
          <span className="memory-details-icon" aria-hidden="true">{selectedNode.icon}</span>
          <div className="memory-details-copy">
            <span className="memory-section-kicker">{selectedNode.category}</span>
            <h2>{selectedNode.title}</h2>
            <p>{selectedNode.detail}</p>
          </div>
          <button type="button" className="memory-details-close" onClick={() => setSelectedNode(null)} aria-label="Close component details">×</button>
        </aside>
      )}
    </section>
  );
}

interface DashboardViewProps {
  repositories: Repository[];
  findings: Finding[];
  memories: AgentMemory[];
  setActiveTab: (tab: string) => void;
  handleAcceptFinding: (id: string) => void;
}

function DashboardView({ repositories, findings, setActiveTab, handleAcceptFinding }: DashboardViewProps) {
  const openFindings = findings.filter(f => f.status === 'OPEN');
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL' && f.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-indigo-300 font-semibold">Engineering overview</span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white flex items-center gap-2">
              Code health, at a glance
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Review code, track risk, and keep team standards consistent across {repositories.length} connected repositories.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('review-code')}
            className="px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold flex items-center gap-2 self-start md:self-auto transition-colors"
          >
            <Play className="w-4 h-4 fill-white" /> Launch Live Code Review
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Active Repos', value: repositories.length, sub: 'All sync active', icon: FolderGit2, color: 'text-cyan-400' },
          { label: 'Reviews Done', value: '124', sub: '+18 this week', icon: Code2, color: 'text-indigo-400' },
          { label: 'Open Findings', value: openFindings.length, sub: 'Needs review', icon: AlertTriangle, color: 'text-amber-400' },
          { label: 'Critical Risks', value: criticalCount, sub: 'Requires immediate fix', icon: ShieldAlert, color: 'text-red-400' },
          { label: 'Accepted Fixes', value: '289', sub: '88% acceptance rate', icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Agent Memory', value: '94%', sub: 'High confidence', icon: Brain, color: 'text-violet-400' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">{kpi.value}</div>
              <div className="text-[10px] text-slate-500 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Activity Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Weekly Review & Findings Trend</h3>
              <p className="text-xs text-slate-400">Total reviews vs findings flagged</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
              Live Metrics
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVIEW_ACTIVITY_DATA}>
                <defs>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="findings" stroke="#6366f1" fillOpacity={1} fill="url(#colorReviews)" name="Findings Flagged" />
                <Area type="monotone" dataKey="accepted" stroke="#10b981" fillOpacity={1} fill="url(#colorAccepted)" name="Accepted Suggestions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Categories Breakdown Pie */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-1">Issue Distribution by Category</h3>
            <p className="text-xs text-slate-400 mb-4">Historical review findings categorization</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CATEGORY_PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {CATEGORY_PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            {CATEGORY_PIE_DATA.map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                <span className="text-slate-400">{cat.name}:</span>
                <span className="font-mono font-bold text-slate-200">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Open Findings Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Critical & High Priority Findings</h3>
            <p className="text-xs text-slate-400">Action items requiring developer review across active repositories</p>
          </div>
          <button 
            onClick={() => setActiveTab('review-code')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            Open Review Studio <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-semibold">SEVERITY</th>
                <th className="pb-3 font-semibold">ISSUE TITLE</th>
                <th className="pb-3 font-semibold">FILE & LOCATION</th>
                <th className="pb-3 font-semibold">RULE CITATION</th>
                <th className="pb-3 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {openFindings.slice(0, 4).map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      f.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                    {f.title}
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    {f.file}:{f.line}
                  </td>
                  <td className="py-3 text-slate-400">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono text-[11px]">
                      {f.ruleSource}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleAcceptFinding(f.id)}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-500/30 transition-all"
                    >
                      Accept Fix
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const QUALITY_TREND = [
  { month: 'Feb', score: 154 }, { month: 'Mar', score: 182 }, { month: 'Apr', score: 142 },
  { month: 'May', score: 196 }, { month: 'Jun', score: 220 },
];

function EditorialDashboardView({ repositories, findings, setActiveTab }: DashboardViewProps) {
  const openCount = findings.filter((finding) => finding.status === 'OPEN').length;
  return (
    <div className="editorial-dashboard">
      <div className="dashboard-heading">
        <div><span className="eyebrow"><span className="live-dot" /> AUTONOMOUS CODE HEALTH</span>
          <h1>Good morning, Engineering Team<span className="heading-spark">✳</span></h1>
          <p>Your autonomous code health metrics are ready to review.</p>
        </div>
        <button className="primary-action" onClick={() => setActiveTab('review-code')}><Sparkles size={16} /> New code review <ChevronRight size={15} /></button>
      </div>

      <section className="metric-grid">
        <article className="metric-card loc-card"><div className="metric-top"><span>Total lines scanned</span><span className="metric-glyph">↗</span></div><strong>192,000 <small>LOC</small></strong><div className="mini-bars" aria-hidden="true">{[38,55,44,70,51,83,63,100,72,90,61,78].map((n,i)=><i key={i} style={{height:`${n}%`}} />)}</div><span className="metric-foot">Across {repositories.length} connected repositories</span></article>
        <article className="metric-card debt-card"><div className="metric-top"><span>Technical debt recovered</span><Sparkles size={17} /></div><strong>583.7 <small>hrs</small></strong><div className="trend-line"><span>↗ 12.4%</span><span>efficiency this quarter</span></div><div className="debt-progress"><i /></div><span className="metric-foot">Time returned to your team</span></article>
        <article className="forecast-card"><div className="forecast-copy"><span className="forecast-badge">✦ Autonomous Forecast</span><h3>Small fixes.<br/>A cleaner quarter.</h3><p>You’re 16% off your Q3 clean code goal.</p><button onClick={() => setActiveTab('analytics')}>View forecast <ChevronRight size={14}/></button></div><div className="forecast-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="art-core"><Brain size={34}/></div><span className="art-star star-one">✳</span><span className="art-star star-two">✦</span></div></article>
      </section>

      <section className="trend-card">
        <div className="section-heading"><div><span className="eyebrow">QUALITY OVER TIME</span><h2>Code quality trend</h2><p>Complexity issues resolved across your codebase</p></div><div className="chart-legend"><i/> Issues resolved <span className="period-select">Last 5 months⌄</span></div></div>
        <div className="trend-chart"><div className="axis-labels"><span>240</span><span>160</span><span>80</span><span>0</span></div><div className="bar-chart">{QUALITY_TREND.map((item) => <div className="bar-column" key={item.month}><div className="bar-track"><div className={`trend-bar ${item.month === 'Jun' ? 'bar-highlight' : ''}`} style={{height:`${item.score / 2.4}%`}}>{item.month === 'Jun' && <span className="bar-callout">220 issues resolved</span>}</div></div><span className="bar-month">{item.month}</span></div>)}</div></div>
      </section>

      <section className="dashboard-bottom">
        <article className="activity-card"><div className="section-heading compact"><div><span className="eyebrow">NEEDS YOUR ATTENTION</span><h2>Open review findings</h2></div><button className="text-action" onClick={() => setActiveTab('security-hub')}>View all <ChevronRight size={14}/></button></div>
          {findings.filter(f=>f.status==='OPEN').slice(0,3).map((finding)=><div className="finding-row" key={finding.id}><span className={`severity-dot ${finding.severity.toLowerCase()}`}/><div className="finding-main"><strong>{finding.title}</strong><small>{finding.file} · line {finding.line}</small></div><span className={`finding-tag ${finding.severity.toLowerCase()}`}>{finding.severity}</span></div>)}
          {openCount === 0 && <p className="empty-note">Everything looks clear. Your team is in great shape.</p>}
        </article>
        <article className="agent-card"><div className="agent-card-top"><div className="agent-icon"><Brain size={19}/></div><span className="confidence-pill">94% confidence</span></div><span className="eyebrow">AGENT MEMORY</span><h2>Learning your team’s craft</h2><p>Your agent has learned from 104 accepted suggestions and keeps getting sharper.</p><div className="memory-meter"><span/></div><button className="text-action" onClick={() => setActiveTab('agent-memory')}>Explore agent memory <ChevronRight size={14}/></button></article>
      </section>
    </div>
  );
}

interface RepositoriesViewProps {
  repositories: Repository[];
  setIsConnectModalOpen: (open: boolean) => void;
  handleTriggerAnalysis: (repo: Repository) => void;
}

function RepositoriesView({ repositories, setIsConnectModalOpen, handleTriggerAnalysis }: RepositoriesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Repository Management</h1>
          <p className="text-xs text-slate-400">Connected source code repositories & architectural models</p>
        </div>
        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Connect Repository
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {repositories.map((repo) => (
          <div key={repo.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400">
                  <FolderGit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-200">{repo.name}</h3>
                  <a href={repo.url} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-mono">
                    {repo.owner}/{repo.name} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                {repo.status}
              </span>
            </div>

            {/* Architecture Info Box */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Inferred Architecture</span>
              <p className="text-xs font-mono text-slate-300">{repo.archPattern}</p>
            </div>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap gap-1.5">
              {repo.languages.map((lang, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                  {lang}
                </span>
              ))}
            </div>

            {/* Stats bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span>Branch: <strong className="text-slate-200 font-mono">{repo.branch}</strong></span>
                <span>Files: <strong className="text-slate-200 font-mono">{repo.filesCount}</strong></span>
              </div>
              <button
                onClick={() => handleTriggerAnalysis(repo)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-Analyze
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ReviewCodeStudioProps {
  repositories: Repository[];
  selectedRepoId: string;
  setSelectedRepoId: (id: string) => void;
  reviewCodeSnippet: string;
  setReviewCodeSnippet: (code: string) => void;
  handleRunAiCodeReview: () => void;
  aiReviewLoading: boolean;
  findings: Finding[];
  handleAcceptFinding: (id: string) => void;
  setRejectionReasonModal: React.Dispatch<React.SetStateAction<RejectionModalState>>;
}

function ReviewCodeStudio({ 
repositories, selectedRepoId, setSelectedRepoId, reviewCodeSnippet, setReviewCodeSnippet, handleRunAiCodeReview, aiReviewLoading, findings, handleAcceptFinding, setRejectionReasonModal 
}: ReviewCodeStudioProps) {
  const currentRepoFindings = findings.filter(
    (finding) => finding.repoId === selectedRepoId && finding.status === 'OPEN'
  );
  const lineCount = reviewCodeSnippet.split('\n').length;
  const criticalCount = currentRepoFindings.filter((finding) => finding.severity === 'CRITICAL').length;
  const highCount = currentRepoFindings.filter((finding) => finding.severity === 'HIGH').length;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-[11px] font-medium text-indigo-200"><Sparkles className="h-3.5 w-3.5" /> AI powered code review</div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">Review code with confidence.</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Paste a snippet to surface security risks, bugs, and maintainability issues against your team standards.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs text-slate-400">Repository
              <select value={selectedRepoId} onChange={(e) => setSelectedRepoId(e.target.value)} className="mt-1 block min-w-56 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-400">
                {repositories.map(r => <option key={r.id} value={r.id}>{r.name} · {r.branch}</option>)}
              </select>
            </label>
            <button onClick={handleRunAiCodeReview} disabled={aiReviewLoading || !reviewCodeSnippet.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
              {aiReviewLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{aiReviewLoading ? 'Reviewing…' : 'Run review'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Open findings', value: currentRepoFindings.length, color: 'text-slate-100' },
          { label: 'Critical', value: criticalCount, color: 'text-rose-300' },
          { label: 'High priority', value: highCount, color: 'text-amber-300' },
          { label: 'Lines in editor', value: lineCount, color: 'text-indigo-200' },
        ].map((item) => <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"><p className="text-xs text-slate-500">{item.label}</p><p className={`mt-1 text-xl font-semibold ${item.color}`}>{item.value}</p></div>)}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0b0f14] xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/70 px-4 py-3">
            <div className="flex items-center gap-3"><div className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-rose-400/80"/><span className="h-2.5 w-2.5 rounded-full bg-amber-300/80"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80"/></div><span className="h-4 w-px bg-slate-700"/><FileCode className="h-4 w-4 text-indigo-300"/><span className="text-xs font-medium text-slate-300">Review input</span></div>
            <span className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-medium text-slate-400">Paste code · up to 100 KB</span>
          </div>
          <div className="flex h-[420px] md:h-[560px]">
            <div className="hidden w-12 select-none overflow-hidden border-r border-slate-800/80 bg-slate-950/60 py-4 text-right font-mono text-xs leading-6 text-slate-600 sm:block" aria-hidden="true">{Array.from({ length: Math.max(lineCount, 1) }, (_, index) => <div key={index} className="pr-3">{index + 1}</div>)}</div>
            <textarea aria-label="Code to review" value={reviewCodeSnippet} onChange={(e) => setReviewCodeSnippet(e.target.value)} placeholder="Paste code here…" className="h-full min-w-0 flex-1 resize-none bg-transparent px-4 py-4 font-mono text-[13px] leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:ring-0" spellCheck="false" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500"><span>Code stays in your review session</span><span>{reviewCodeSnippet.length.toLocaleString()} characters</span></div>
        </section>

        <section className="space-y-3 xl:col-span-5">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
            <div><h2 className="text-sm font-semibold text-slate-100">Findings</h2><p className="mt-0.5 text-xs text-slate-500">{currentRepoFindings.length ? 'Prioritized issues for this repository' : 'Run a review to see issues here'}</p></div>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300">{currentRepoFindings.length}</span>
          </div>

          {currentRepoFindings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-12 text-center">
              <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl border border-slate-700 bg-slate-900"><Code2 className="h-5 w-5 text-slate-400" /></div>
              <h4 className="text-sm font-semibold text-slate-200">Your review is ready</h4>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">Add code in the editor and run a review. Findings will appear here with severity and suggested fixes.</p>
            </div>
          ) : (
            currentRepoFindings.map((finding) => (
              <div key={finding.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
                <div className="flex items-start justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    finding.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                    finding.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {finding.severity}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400">
                    Confidence: {(finding.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200">{finding.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{finding.description}</p>
                </div>

                {/* Why It Matters */}
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                  <strong className="text-amber-400 font-mono block mb-0.5">Why it matters:</strong>
                  <span className="text-slate-300">{finding.whyItMatters}</span>
                </div>

                {/* Suggested Diff */}
                {finding.suggestedFix && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Suggested Fix</span>
                    <pre className="p-2.5 rounded bg-slate-950 text-[11px] font-mono text-emerald-300 overflow-x-auto border border-emerald-500/20">
                      {finding.suggestedFix}
                    </pre>
                  </div>
                )}

                {/* Feedback Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    onClick={() => setRejectionReasonModal({ open: true, findingId: finding.id, reason: 'False Positive', notes: '' })}
                    className="px-2.5 py-1 rounded text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 transition-all"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAcceptFinding(finding.id)}
                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all shadow"
                  >
                    Accept Suggestion
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

interface SecurityHubViewProps {
  findings: Finding[];
  handleAcceptFinding: (id: string) => void;
}

function SecurityHubView({ findings, handleAcceptFinding }: SecurityHubViewProps) {
  const securityFindings = findings.filter(f => f.category === 'Security');

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100">Security Analysis & Vulnerability Hub</h1>
          <p className="text-xs text-slate-400">Automated SAST & Secret Leak Scanner across connected codebases</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {securityFindings.map((sec) => (
          <div key={sec.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                {sec.severity}
              </span>
              <span className="text-xs font-mono text-slate-400">{sec.file}:{sec.line}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-200">{sec.title}</h3>
            <p className="text-xs text-slate-400">{sec.description}</p>
            
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-red-300 overflow-x-auto">
              {sec.codeSnippet}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleAcceptFinding(sec.id)}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                Apply Remediation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TeamStandardsViewProps {
  rules: Rule[];
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function TeamStandardsView({ rules, setRules, showToast }: TeamStandardsViewProps) {
  const [newRule, setNewRule] = useState<{
    title: string;
    category: string;
    severity: SeverityLevel;
    pattern: string;
    description: string;
    targetLang: string;
  }>({
    title: '',
    category: 'Architecture',
    severity: 'HIGH',
    pattern: '',
    description: '',
    targetLang: 'TypeScript'
  });

  const handleCreateRule = () => {
    if (!newRule.title || !newRule.pattern) return;
    const ruleObj: Rule = {
      ...newRule,
      id: `rule-${Date.now()}`,
      code: `RULE-${Math.floor(100 + Math.random() * 900)}`,
      enabled: true
    };
    setRules([ruleObj, ...rules]);
    setNewRule({ title: '', category: 'Architecture', severity: 'HIGH', pattern: '', description: '', targetLang: 'TypeScript' });
    showToast(`Rule '${ruleObj.code}' added to team standards matrix!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Coding Standards</h1>
          <p className="text-xs text-slate-400">Custom linting & static rules enforced by AI during reviews</p>
        </div>
      </div>

      {/* New Rule Form */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" /> Create Custom Team Standard
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Rule Name (e.g., Require Repository Abstraction)"
            value={newRule.title}
            onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
          />
          <select
            value={newRule.category}
            onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
          >
            <option value="Architecture">Architecture</option>
            <option value="Security">Security</option>
            <option value="Code Quality">Code Quality</option>
            <option value="Performance">Performance</option>
          </select>
          <input
            type="text"
            placeholder="AST Regex or Pattern (e.g. db.query)"
            value={newRule.pattern}
            onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none"
          />
        </div>
        <button
          onClick={handleCreateRule}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow"
        >
          Add Rule to Engine
        </button>
      </div>

      {/* Rules List Table */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">{rule.code}</span>
                  <h4 className="text-sm font-bold text-slate-200">{rule.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    {rule.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{rule.description}</p>
              </div>
              <button
                onClick={() => setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  rule.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {rule.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ArchitectureRulesViewProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function ArchitectureRulesView({ showToast: _showToast }: ArchitectureRulesViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Visual Architecture Boundaries</h1>
        <p className="text-xs text-slate-400">Define prohibited dependency directions across your codebase layers</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-slate-200">Active Layer Hierarchy & Direction Bounds</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
          <div className="p-3 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Controller Layer</div>
          <ChevronRight className="w-5 h-5 text-slate-600 hidden md:block" />
          <div className="p-3 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Service Layer</div>
          <ChevronRight className="w-5 h-5 text-slate-600 hidden md:block" />
          <div className="p-3 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Repository Layer</div>
          <ChevronRight className="w-5 h-5 text-slate-600 hidden md:block" />
          <div className="p-3 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Database</div>
        </div>

        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-300 space-y-1">
          <strong className="font-bold block">Enforced Constraint:</strong>
          <span>Direct calls skipping intermediate layers (e.g. Controller → Database) will immediately trigger CRITICAL architectural findings during code reviews.</span>
        </div>
      </div>
    </div>
  );
}

interface AgentMemoryViewProps {
  memories: AgentMemory[];
  setMemories: React.Dispatch<React.SetStateAction<AgentMemory[]>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function AgentMemoryView({ memories, setMemories: _setMemories, showToast: _showToast }: AgentMemoryViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Agent Memory Matrix</h1>
        <p className="text-xs text-slate-400">Autonomous preferences learned from past developer PR reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map((mem) => (
          <div key={mem.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {mem.category}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {mem.confidence}% Confidence
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-200">{mem.title}</h3>
            <p className="text-xs text-slate-400">{mem.ruleText}</p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              <span>Accepted: {mem.accepted} | Rejected: {mem.rejected}</span>
              <span>Updated {mem.lastUpdated}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AnalyticsViewProps {
  findings: Finding[];
  memories: AgentMemory[];
}

function AnalyticsView({ findings: _findings, memories: _memories }: AnalyticsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Analytics & Tech Debt Insights</h1>
        <p className="text-xs text-slate-400">Metrics on agent review time saved & technical debt trends</p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 h-72">
        <h3 className="text-sm font-bold text-slate-200 mb-4">Estimated Review Hours Saved per Week</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={REVIEW_ACTIVITY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Bar dataKey="reviews" fill="#6366f1" name="Hours Saved" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TeamMembersViewProps {
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function TeamMembersView({ teamMembers, setTeamMembers: _setTeamMembers, showToast: _showToast }: TeamMembersViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Team Workspace</h1>
          <p className="text-xs text-slate-400">Authorized reviewers and developers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-200">{member.name}</h4>
              <p className="text-xs text-slate-400">{member.email}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-xs font-mono text-indigo-300">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ConnectRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRepo: (newRepo: Repository) => void;
}

function ConnectRepoModal({ isOpen, onClose, onAddRepo }: ConnectRepoModalProps) {
  const [repoName, setRepoName] = useState('');
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName) return;
    onAddRepo({
      id: `repo-${Date.now()}`,
      name: repoName,
      owner: 'acme-corp',
      url: url || 'https://github.com/acme/new-repo',
      branch: 'main',
      languages: ['TypeScript', 'Node.js'],
      healthScore: 100,
      filesCount: 45,
      lastAnalyzed: 'Just now',
      status: 'Healthy',
      archPattern: 'Controller → Service → DB'
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100">Connect Repository</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Repository Name (e.g. auth-service)"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
            required
          />
          <input
            type="url"
            placeholder="GitHub Repo URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg">
              Add & Analyze
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AnalysisProgressModalProps {
  repo: Repository | null;
  progress: number;
}

function AnalysisProgressModal({ repo, progress }: AnalysisProgressModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-2xl">
        <Cpu className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-slate-100">Analyzing Repository Structure</h3>
        <p className="text-xs text-slate-400">Building AST dependency graph & inferring layer boundaries for '{repo?.name}'...</p>
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        <span className="text-xs font-mono text-indigo-400">{progress}% Complete</span>
      </div>
    </div>
  );
}

interface PullRequestsViewProps {
  setActiveTab: (tab: string) => void;
  setReviewCodeSnippet: (code: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function PullRequestsView({ setActiveTab, setReviewCodeSnippet, showToast }: PullRequestsViewProps) {
  const prSnippets = [
    {
      id: 104,
      title: 'PR #104 - Refactor payment checkout endpoint',
      branch: 'feature/checkout-v2 → main',
      code: `// PR #104 Checkout Refactor
import express, { Request, Response } from 'express';
import { db } from '../database';

const router = express.Router();

router.post('/checkout', async (req: Request, res: Response) => {
  const { cartId, userToken } = req.body;
  // Architecture boundary issue: direct SQL in checkout controller
  const cart = await db.query('SELECT * FROM carts WHERE id = ' + cartId);
  return res.json({ status: 'confirmed', cart });
});

export default router;`
    },
    {
      id: 105,
      title: 'PR #105 - User session authentication caching',
      branch: 'feature/redis-session → main',
      code: `// PR #105 Session Cache
import { redis } from '../cache';

export async function getSession(token: string): Promise<any> {
  const data = await redis.get(token);
  return JSON.parse(data || '{}');
}`
    }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Pull Requests Awaiting AI Review</h1>
      <div className="space-y-3">
        {prSnippets.map((pr) => (
          <div key={pr.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">{pr.title}</h3>
              <p className="text-xs text-slate-400">Branch: {pr.branch}</p>
            </div>
            <button 
              onClick={() => {
                setReviewCodeSnippet(pr.code);
                setActiveTab('review-code');
                showToast(`Loaded ${pr.title} into Review Studio`, 'info');
              }} 
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Code2 className="w-3.5 h-3.5" /> Review PR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewHistoryView() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Historical Review Audit Logs</h1>
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
        Review #981 executed on 2026-09-27 10:14 IST — 3 Findings flagged, 2 Accepted.
      </div>
    </div>
  );
}

interface SettingsViewProps {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function SettingsView({ showToast }: SettingsViewProps) {
  const handleSaveSettings = () => {
    showToast("Settings updated successfully!", "success");
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-bold text-slate-100">Platform Settings</h1>
      
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <label className="text-xs font-mono text-slate-300 block mb-1">AI Sensitivity Level</label>
          <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none">
            <option>Strict (Enterprise Production)</option>
            <option>Balanced</option>
            <option>Permissive (Rapid Prototyping)</option>
          </select>
        </div>

        <p className="text-[11px] text-slate-500">
          Configure AI reviews on the server with GEMINI_API_KEY in your .env file. The key stays off the browser.
        </p>

        <button 
          onClick={handleSaveSettings} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded transition-all shadow"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
