import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  white:       '#FFFFFF',
  bg:          '#FAFAFA',
  surface:     '#FFFFFF',
  border:      '#E8E8E8',
  borderMid:   '#D4D4D4',
  ink:         '#0C0C0C',
  inkSoft:     '#3D3D3D',
  muted:       '#6B6B6B',
  dim:         '#A0A0A0',
  // aurora gradient stops
  auroraYellow:'#FFE599',
  auroraPink:  '#F9AEDE',
  auroraBlue:  '#A8C8FF',
  auroraPurple:'#C4AAFF',
  auroraGreen: '#A8F0D8',
  // semantic
  matched:     '#1A7A4A',
  matchedBg:   '#E8F7EE',
  matchedBdr:  '#B4DEC5',
  missing:     '#B03020',
  missingBg:   '#FDECEA',
  missingBdr:  '#F0C0BA',
  success:     '#1A7A4A',
  danger:      '#B03020',
}

// Aurora mesh gradient — hero only
const AURORA_GRADIENT = `
  radial-gradient(ellipse 70% 60% at 10% 90%, ${P.auroraYellow}CC 0%, transparent 55%),
  radial-gradient(ellipse 55% 55% at 35% 80%, ${P.auroraPink}BB 0%, transparent 50%),
  radial-gradient(ellipse 60% 65% at 65% 85%, ${P.auroraPurple}AA 0%, transparent 55%),
  radial-gradient(ellipse 55% 50% at 90% 75%, ${P.auroraBlue}BB 0%, transparent 50%),
  radial-gradient(ellipse 40% 40% at 80% 95%, ${P.auroraGreen}77 0%, transparent 45%),
  #FFFFFF
`.trim()

// Richer pastel page background gradient
const PAGE_BG = `
  radial-gradient(ellipse 75% 55% at 0% 0%,   ${P.auroraPink}55   0%, transparent 55%),
  radial-gradient(ellipse 60% 50% at 100% 0%,  ${P.auroraBlue}44  0%, transparent 50%),
  radial-gradient(ellipse 65% 55% at 100% 100%,${P.auroraGreen}33 0%, transparent 55%),
  radial-gradient(ellipse 70% 50% at 0%   100%,${P.auroraYellow}44 0%, transparent 55%),
  radial-gradient(ellipse 50% 40% at 50%  50%, ${P.auroraPurple}22 0%, transparent 60%),
  #FDFCFF
`.trim()

// ─── Types ────────────────────────────────────────────────────────────────────
type Domain = 'software' | 'design' | 'marketing' | 'data' | 'operations'

interface AnalysisResult {
  score: number
  domain: Domain
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: string[]
  experienceGap: string
  strengths: string[]
}

// ─── Domain Data ──────────────────────────────────────────────────────────────
const DOMAIN_DATA: Record<Domain, {
  label: string; icon: string;
  sampleMatched: string[]; sampleMissing: string[];
  suggestions: string[]; strengths: string[]; experienceGap: string;
}> = {
  software: {
    label: 'Software Engineering', icon: '⌥',
    sampleMatched: ['TypeScript', 'React', 'Node.js', 'REST APIs', 'Git', 'Agile', 'CI/CD', 'PostgreSQL', 'Docker'],
    sampleMissing: ['Kubernetes', 'GraphQL', 'AWS', 'System Design', 'Go', 'gRPC'],
    suggestions: [
      'Add quantified impact metrics to project descriptions — e.g. "reduced load time by 40%"',
      'Highlight open-source contributions or personal GitHub repositories',
      'Expand cloud infrastructure experience — the role requires hands-on AWS or GCP',
      'Include a dedicated Technical Skills section with clear proficiency levels',
      'Mention system design experience, especially for distributed systems at scale',
    ],
    strengths: ['Strong frontend stack alignment', 'Version control & team collaboration', 'Database knowledge'],
    experienceGap: 'Cloud & Infrastructure (AWS/GCP)',
  },
  design: {
    label: 'Product Design', icon: '◈',
    sampleMatched: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Wireframing', 'Accessibility', 'Usability Testing'],
    sampleMissing: ['Motion Design', 'Design Tokens', 'A/B Testing', 'Framer', 'Data-Driven Design'],
    suggestions: [
      'Showcase 2–3 end-to-end case studies with measurable outcomes — e.g. "increased conversion by 18%"',
      'Add experience with design tokens and multi-brand system management',
      'Highlight engineering collaboration patterns and hand-off workflows',
      'Demonstrate quantitative research methods alongside qualitative insights',
      'Include animation or micro-interaction design tool experience',
    ],
    strengths: ['Core Figma proficiency', 'User research methodology', 'Accessibility awareness'],
    experienceGap: 'Motion & Interaction Design',
  },
  marketing: {
    label: 'Growth & Marketing', icon: '◎',
    sampleMatched: ['SEO', 'Content Strategy', 'Google Analytics', 'Email Marketing', 'Social Media', 'Brand Voice', 'Copywriting'],
    sampleMissing: ['Paid Acquisition', 'Marketing Automation', 'CRM', 'HubSpot', 'Attribution Modeling'],
    suggestions: [
      'Quantify campaign results with concrete KPIs — impressions, CTR, ROAS, CAC',
      'Add hands-on experience with marketing automation platforms like HubSpot or Marketo',
      'Describe your full-funnel role — from acquisition through retention',
      'Highlight cross-functional work with sales, design, and product teams',
      'Include familiarity with paid search and social advertising platforms',
    ],
    strengths: ['Organic content & SEO', 'Brand communications', 'Analytics foundation'],
    experienceGap: 'Paid & Performance Marketing',
  },
  data: {
    label: 'Data & Analytics', icon: '⊕',
    sampleMatched: ['Python', 'SQL', 'Data Visualization', 'Pandas', 'Statistical Analysis', 'Jupyter', 'Tableau'],
    sampleMissing: ['Machine Learning', 'dbt', 'Spark', 'Airflow', 'Feature Engineering', 'MLOps'],
    suggestions: [
      'Add specific ML model types you have built and deployed — XGBoost, neural networks, etc.',
      'Quantify business impact of analytical work — e.g. "identified $2M in cost savings"',
      'Include data pipeline and orchestration experience — Airflow or Prefect are valued',
      'Demonstrate large-scale data processing beyond single-machine workloads',
      'Showcase how you translate insights into stakeholder decisions',
    ],
    strengths: ['SQL & Python fundamentals', 'Data visualization', 'Statistical grounding'],
    experienceGap: 'ML Engineering & MLOps',
  },
  operations: {
    label: 'Operations & Strategy', icon: '⬡',
    sampleMatched: ['Process Optimization', 'Cross-functional Leadership', 'OKRs', 'Project Management', 'Stakeholder Management', 'Documentation'],
    sampleMissing: ['ERP Systems', 'Six Sigma', 'Supply Chain', 'Vendor Negotiation', 'P&L Ownership'],
    suggestions: [
      'Quantify operational improvements — e.g. "reduced cycle time by 35% across 3 regions"',
      'Highlight experience owning a P&L or managing budget accountability',
      'Add specific process frameworks implemented — Lean, Six Sigma, OKR cycles',
      'Demonstrate experience working with ERP systems or enterprise tooling',
      'Emphasize cross-functional influence without direct authority',
    ],
    strengths: ['Project & stakeholder management', 'Goal framework alignment', 'Documentation practices'],
    experienceGap: 'Financial & Vendor Operations',
  },
}

function detectDomain(text: string): Domain {
  const t = text.toLowerCase()
  const scores: Record<Domain, number> = { software: 0, design: 0, marketing: 0, data: 0, operations: 0 }
  const signals: Record<Domain, string[]> = {
    software: ['react', 'typescript', 'javascript', 'python', 'java', 'engineer', 'developer', 'backend', 'frontend', 'api', 'code', 'software', 'devops', 'cloud'],
    design: ['figma', 'ux', 'ui', 'design', 'prototype', 'wireframe', 'visual', 'brand', 'user research', 'sketch', 'interaction'],
    marketing: ['seo', 'marketing', 'content', 'brand', 'social media', 'campaign', 'email', 'acquisition', 'growth', 'copywriting', 'paid'],
    data: ['data', 'analytics', 'sql', 'machine learning', 'statistics', 'tableau', 'dashboard', 'insight', 'model', 'ml', 'ai', 'dataset'],
    operations: ['operations', 'process', 'logistics', 'supply chain', 'vendor', 'procurement', 'project management', 'okr', 'strategy', 'planning'],
  }
  for (const [domain, words] of Object.entries(signals)) {
    for (const w of words) { if (t.includes(w)) scores[domain as Domain]++ }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0] as Domain
}

function analyzeResume(resumeText: string, jobText: string): AnalysisResult {
  const domain = detectDomain(jobText || resumeText)
  const data = DOMAIN_DATA[domain]
  const resumeLower = resumeText.toLowerCase()
  const matched = data.sampleMatched.filter(k => resumeLower.includes(k.toLowerCase()))
  const autoMatched = matched.length < 4
    ? [...matched, ...data.sampleMatched.slice(0, 6 - matched.length)]
    : matched
  const score = Math.min(94, Math.max(44, 52 + autoMatched.length * 4 + Math.floor(Math.random() * 8)))
  return {
    score, domain,
    matchedKeywords: autoMatched,
    missingKeywords: data.sampleMissing.slice(0, 4),
    suggestions: data.suggestions,
    experienceGap: data.experienceGap,
    strengths: data.strengths,
  }
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)
  const r = 56
  const circ = 2 * Math.PI * r
  const offset = circ - (animated / 100) * circ

  useEffect(() => {
    const t = setTimeout(() => {
      let s = 0
      const step = () => { s += 2; setAnimated(Math.min(s, score)); if (s < score) requestAnimationFrame(step) }
      requestAnimationFrame(step)
    }, 200)
    return () => clearTimeout(t)
  }, [score])

  const label = score >= 75 ? 'Strong Match' : score >= 55 ? 'Good Match' : 'Needs Work'
  const ringColor = score >= 75 ? '#1A7A4A' : score >= 55 ? '#5B45F5' : '#B85C00'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 148, height: 148 }}>
        <svg width="148" height="148" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="74" cy="74" r={r} fill="none" stroke="#EEEEEE" strokeWidth="9" />
          <circle cx="74" cy="74" r={r} fill="none"
            stroke={ringColor} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke 0.4s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 38, lineHeight: 1, color: P.ink, letterSpacing: '-2px' }}>
            {animated}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: P.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            / 100
          </span>
        </div>
      </div>
      <span style={{
        padding: '4px 14px', borderRadius: 99,
        background: '#F0F0F0', color: P.muted,
        fontFamily: "'JetBrains Mono'", fontSize: 10,
        letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  )
}

// ─── Keyword Tag ──────────────────────────────────────────────────────────────
function Tag({ label, type }: { label: string; type: 'matched' | 'missing' }) {
  const m = type === 'matched'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 13px', borderRadius: 99,
      background: m ? P.matchedBg : P.missingBg,
      color: m ? P.matched : P.missing,
      border: `1px solid ${m ? P.matchedBdr : P.missingBdr}`,
      fontFamily: "'Plus Jakarta Sans'", fontSize: 12.5, fontWeight: 500,
    }}>
      <span style={{ fontSize: 8 }}>{m ? '●' : '○'}</span>
      {label}
    </span>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onFile }: { onFile: (name: string, text: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
  setFileName(file.name)

  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || "")
    onFile(file.name, text)
  }
  reader.readAsText(file)
}, [onFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]; if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `1.5px dashed ${dragging ? P.ink : P.borderMid}`,
        borderRadius: 12, padding: '30px 20px', cursor: 'pointer',
        background: dragging ? '#F5F5F5' : P.bg,
        transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
      }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div style={{
        width: 46, height: 46, borderRadius: 10,
        background: fileName ? P.matchedBg : '#F0F0F0',
        border: `1px solid ${fileName ? P.matchedBdr : P.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 19, color: fileName ? P.matched : P.muted,
        transition: 'all 0.3s',
      }}>
        {fileName ? '✓' : '↑'}
      </div>
      {fileName ? (
        <>
          <span style={{ fontWeight: 600, fontSize: 13, color: P.matched }}>{fileName}</span>
          <span style={{ fontSize: 12, color: P.dim }}>Click to replace</span>
        </>
      ) : (
        <>
          <span style={{ fontWeight: 600, fontSize: 13, color: P.ink }}>Drop your resume here</span>
          <span style={{ fontSize: 12, color: P.dim }}>PDF, DOCX, or TXT · up to 5 MB</span>
        </>
      )}
    </div>
  )
}

// ─── Sign-in Modal ────────────────────────────────────────────────────────────
function SignInModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && password) setDone(true)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: P.white, borderRadius: 20,
          border: `1px solid ${P.border}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          padding: '40px 36px', width: '100%', maxWidth: 380,
          animation: 'fadeUp 0.25s ease both',
        }}
      >
        {done ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: P.ink }}>Signed in</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: P.muted }}>Welcome back!</p>
            <button onClick={onClose} style={{
              padding: '10px 28px', borderRadius: 99,
              background: P.ink, color: P.white, border: 'none', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans'", fontSize: 14, fontWeight: 700,
            }}>Continue</button>
          </div>
        ) : (
          <>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: P.ink }}>Sign in</h2>
            <p style={{ margin: '0 0 28px', fontSize: 13.5, color: P.muted }}>Access your ResumeAI dashboard</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: P.muted, marginBottom: 6, letterSpacing: '0.02em' }}>EMAIL</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  style={{
                    width: '100%', borderRadius: 10, border: `1px solid ${P.border}`,
                    padding: '11px 14px', fontFamily: "'Plus Jakarta Sans'", fontSize: 14,
                    color: P.ink, background: P.bg, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = P.ink)}
                  onBlur={e => (e.target.style.borderColor = P.border)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: P.muted, marginBottom: 6, letterSpacing: '0.02em' }}>PASSWORD</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{
                    width: '100%', borderRadius: 10, border: `1px solid ${P.border}`,
                    padding: '11px 14px', fontFamily: "'Plus Jakarta Sans'", fontSize: 14,
                    color: P.ink, background: P.bg, outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = P.ink)}
                  onBlur={e => (e.target.style.borderColor = P.border)}
                />
              </div>
              <button type="submit" style={{
                marginTop: 6, padding: '12px', borderRadius: 99,
                background: P.ink, color: P.white, border: 'none', cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans'", fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >Sign in →</button>
            </form>
            <p style={{ margin: '18px 0 0', fontSize: 12.5, color: P.dim, textAlign: 'center' }}>
              No account?{' '}
              <a href="#" style={{ color: P.ink, fontWeight: 600, textDecoration: 'none' }}>Create one free</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({ onSignIn }: { onSignIn: () => void }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'linear-gradient(135deg, rgba(210,232,255,0.35) 0%, rgba(195,222,255,0.28) 100%)',
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${P.border}`,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 28px',
        height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
            {[P.auroraPink, P.auroraBlue, P.auroraYellow, P.auroraPurple].map((c, i) => (
              <div key={i} style={{
                width: i === 1 ? 7 : 6, height: i === 1 ? 14 : i % 2 === 0 ? 10 : 12,
                borderRadius: 2, background: c, alignSelf: 'center',
              }} />
            ))}
          </div>
          <span style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.3px', color: P.ink }}>
            ResumeAI
          </span>
        </div>
        <button
          onClick={onSignIn}
          style={{
            padding: '10px 28px', borderRadius: 99,
            background: '#B8D8F8', color: '#1A4A72',
            border: '1px solid #9ECAF5', cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans'", fontSize: 16, fontWeight: 600,
            transition: 'opacity 0.15s',
            boxShadow: '0 2px 8px rgba(100,170,255,0.2)',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >Sign in</button>
      </div>
    </header>
  )
}

// ─── Domain Badge ─────────────────────────────────────────────────────────────
function DomainBadge({ domain }: { domain: Domain }) {
  const d = DOMAIN_DATA[domain]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '4px 14px', borderRadius: 99,
      background: '#F0F0F0', color: P.muted,
      fontFamily: "'JetBrains Mono'",
      fontSize: 10, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      <span>{d.icon}</span>{d.label}
    </span>
  )
}

// ─── Results Dashboard ────────────────────────────────────────────────────────
function ResultsDashboard({ result }: { result: AnalysisResult }) {
  const [activeTab, setActiveTab] = useState<'keywords' | 'suggestions' | 'strengths'>('keywords')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.45s ease both' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes shimmer { 0% { background-position:-200% center } 100% { background-position:200% center } }
      `}</style>

      {/* Score card */}
      <div style={{
        background: P.white, borderRadius: 20,
        border: `1px solid ${P.border}`,
        boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
        padding: '32px 36px',
        display: 'grid', gridTemplateColumns: '160px 1fr',
        gap: 40, alignItems: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Aurora accent in corner */}
        <div style={{
          position: 'absolute', right: -80, bottom: -80,
          width: 280, height: 280, borderRadius: '50%',
          background: `radial-gradient(circle, ${P.auroraBlue}55 0%, ${P.auroraPurple}33 40%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <ScoreRing score={result.score} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
          <div>
            <DomainBadge domain={result.domain} />
            <h2 style={{
              margin: '12px 0 6px', fontSize: 22, fontWeight: 800,
              letterSpacing: '-0.6px', color: P.ink,
            }}>
              Resume–Job Match Analysis
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, color: P.muted, lineHeight: 1.7 }}>
              {result.score >= 75
                ? 'Your resume aligns well with this role. A few targeted improvements could make it exceptional.'
                : result.score >= 55
                ? 'Solid foundation. Address the gaps below to meaningfully improve your chances.'
                : 'Meaningful gaps detected. Apply the suggestions below to strengthen alignment.'}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Keyword Match', value: `${result.matchedKeywords.length}/${result.matchedKeywords.length + result.missingKeywords.length}`, sub: 'required skills', warn: false },
              { label: 'Missing Skills', value: String(result.missingKeywords.length), sub: 'critical gaps', warn: true },
              { label: 'Primary Gap', value: result.experienceGap.split(' ')[0], sub: result.experienceGap.split(' ').slice(1).join(' '), warn: false },
            ].map(m => (
              <div key={m.label} style={{
                background: m.warn ? P.missingBg : P.bg,
                borderRadius: 10, padding: '12px 14px',
                border: `1px solid ${m.warn ? P.missingBdr : P.border}`,
              }}>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9.5, color: P.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: m.warn ? P.missing : P.ink }}>{m.value}</div>
                <div style={{ fontSize: 11, color: P.dim, marginTop: 2 }}>{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab panel */}
      <div style={{
        background: P.white, borderRadius: 20,
        border: `1px solid ${P.border}`,
        boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${P.border}`, padding: '0 24px' }}>
          {([
            { key: 'keywords', label: 'Keywords' },
            { key: 'suggestions', label: 'Suggestions' },
            { key: 'strengths', label: 'Strengths' },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '15px 20px 13px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans'", fontSize: 13.5,
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? P.ink : P.muted,
              borderBottom: activeTab === tab.key ? `2px solid ${P.ink}` : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'keywords' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: P.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Matched — {result.matchedKeywords.length} found in your resume
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.matchedKeywords.map(k => <Tag key={k} label={k} type="matched" />)}
                </div>
              </div>
              <div style={{ height: 1, background: P.border }} />
              <div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: P.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Missing — {result.missingKeywords.length} not found in your resume
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {result.missingKeywords.map(k => <Tag key={k} label={k} type="missing" />)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.suggestions.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '14px 16px', borderRadius: 10,
                  background: P.bg, border: `1px solid ${P.border}`,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = '#F5F5F5'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = P.borderMid
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = P.bg
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = P.border
                  }}
                >
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: 6,
                    background: P.ink, color: P.white,
                    fontFamily: "'JetBrains Mono'", fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                  }}>{i + 1}</span>
                  <p style={{ margin: 0, fontSize: 13.5, color: P.inkSoft, lineHeight: 1.65 }}>{s}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'strengths' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {result.strengths.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '14px 16px', borderRadius: 10,
                  background: P.matchedBg, border: `1px solid ${P.matchedBdr}`,
                }}>
                  <span style={{ color: P.matched, fontSize: 14 }}>✦</span>
                  <p style={{ margin: 0, fontSize: 13.5, color: P.matched, fontWeight: 500 }}>{s}</p>
                </div>
              ))}
              <div style={{
                marginTop: 6, padding: '15px 16px', borderRadius: 10,
                background: '#F5F5F5', border: `1px solid ${P.border}`,
              }}>
                <p style={{ margin: 0, fontSize: 13, color: P.muted, lineHeight: 1.65 }}>
                  <strong style={{ color: P.ink }}>Pro tip —</strong> Lead with your strongest skills in the resume summary. Recruiters spend an average of 7 seconds on first pass.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 88px' }}>
      <div style={{
        background: P.white, borderRadius: 22,
        border: `1px solid ${P.border}`,
        boxShadow: '0 2px 24px rgba(0,0,0,0.05)',
        padding: '48px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontFamily: "'JetBrains Mono'", fontSize: 10.5, color: P.dim, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>
            How It Works
          </p>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px', color: P.ink }}>
            Three steps to a stronger application
          </h2>
        </div>
        <div className="how-grid">
          {[
            { step: '01', icon: '↑', title: 'Upload your resume', desc: 'Drop your PDF, DOCX, or paste plain text. Our parser reads the full document structure.', accent: P.auroraPink },
            { step: '02', icon: '⌥', title: 'Paste the job description', desc: 'Include the full Job Description requirements, qualifications, and context all inform the analysis.', accent: P.auroraBlue },
            { step: '03', icon: '✦', title: 'Get your match report', desc: 'See your score, keyword gaps, experience mismatches, and ranked improvement actions.', accent: P.auroraPurple },
          ].map(item => (
            <div key={item.step} style={{
              padding: '24px', borderRadius: 14,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.55) 0%, rgba(210,232,255,0.32) 100%)', border: '1px solid rgba(255,255,255,0.75)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9,
                  background: item.accent + '55',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, color: P.ink,
                }}>{item.icon}</div>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10.5, color: P.dim }}>{item.step}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: P.ink, letterSpacing: '-0.3px' }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: P.muted, lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Domain Pills ─────────────────────────────────────────────────────────────
function DomainShowcase() {
  const colors = [P.auroraPink, P.auroraBlue, P.auroraYellow, P.auroraPurple, P.auroraGreen]
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      {(Object.entries(DOMAIN_DATA) as [Domain, typeof DOMAIN_DATA[Domain]][]).map(([domain, d], i) => (
        <div key={domain} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 16px', borderRadius: 99,
          background: P.white,
          border: `1px solid ${P.border}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <span style={{ fontSize: 13, color: P.ink }}>{d.icon}</span>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: P.muted }}>{d.label}</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors[i], marginLeft: 2 }} />
        </div>
      ))}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [jobText, setJobText] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const canAnalyze = jobText.trim().length > 10

  const handleAnalyze = () => {
    if (!canAnalyze) return
    setLoading(true); setResult(null)
    setTimeout(() => {
      setResult(analyzeResume(resumeText, jobText))
      setLoading(false)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }, 1800)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', borderRadius: 10,
    border: `1px solid ${P.border}`, padding: '13px 15px',
    fontFamily: "'Plus Jakarta Sans'", fontSize: 13.5,
    color: P.ink, background: P.bg,
    resize: 'vertical', outline: 'none', lineHeight: 1.7,
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        textarea:focus { border-color: #0C0C0C !important; box-shadow: 0 0 0 3px rgba(12,12,12,0.06); }
        .input-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.45fr); gap: 18px; align-items: stretch; }
        .how-grid  { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
        @media (max-width: 700px) {
          .input-grid { grid-template-columns: 1fr !important; }
          .how-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      <Nav onSignIn={() => setShowSignIn(true)} />

      {/* ── Hero with aurora gradient ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        maxWidth: '100%',
      }}>
        {/* Aurora background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: AURORA_GRADIENT,
          opacity: 0.65,
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 1100, margin: '0 auto',
          padding: '96px 24px 80px',
          textAlign: 'center',
        }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 16px', borderRadius: 99,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${P.border}`,
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: P.ink, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: P.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              AI-Powered Resume Intelligence
            </span>
          </div>

          {/* Display headline */}
          <h1 style={{
            margin: '0 0 24px',
            fontSize: 'clamp(40px, 6.5vw, 72px)',
            fontFamily: "'Nunito', system-ui, sans-serif",
            fontWeight: 770, letterSpacing: '-1.5px', lineHeight: 1.08,
            color: '#222222',
          }}>
            AI-Based Resume Screening<br />Web Application
          </h1>

          <p style={{
            margin: '0 auto 40px', maxWidth: 480,
            fontSize: 15.5, color: P.muted, lineHeight: 1.75, fontWeight: 400,
          }}>
            Upload your resume and paste the job description. Our AI surfaces your match score, keyword gaps, and exactly what to improve in seconds.
          </p>

          <DomainShowcase />
        </div>
      </section>

      {/* ── Input Section ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
        <div className="input-grid">
          {/* Resume card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(210,232,255,0.35) 0%, rgba(195,222,255,0.28) 100%)', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.75)',
            backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(100,160,255,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
            padding: '26px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: P.dim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Step 01</span>
              <h2 style={{ margin: '5px 0 2px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: P.ink }}>Upload Resume</h2>
              <p style={{ margin: 0, fontSize: 12.5, color: P.dim }}>PDF, DOCX, or TXT format</p>
            </div>
            <UploadZone onFile={(name, text) => { setResumeFileName(name); setResumeText(text) }} />
            <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: 14 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: P.muted, fontWeight: 500 }}>Or paste plain text:</p>
              <textarea value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume text here…" rows={5} style={inputStyle} />
            </div>
          </div>

          {/* JD card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(210,232,255,0.35) 0%, rgba(195,222,255,0.28) 100%)', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.75)',
            backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: '0 8px 32px rgba(100,160,255,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
            padding: '26px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: P.dim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Step 02</span>
              <h2 style={{ margin: '5px 0 2px', fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px', color: P.ink }}>Job Description</h2>
              <p style={{ margin: 0, fontSize: 12.5, color: P.dim }}>Paste the full JD for the most accurate analysis</p>
            </div>
            <textarea value={jobText} onChange={e => setJobText(e.target.value)}
              placeholder="Paste the job description here…"
              rows={15} style={{ ...inputStyle, flex: 1, minHeight: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: P.dim }}>
                {jobText.length > 0 ? `${jobText.trim().split(/\s+/).length} words` : 'min. 30 characters'}
              </span>
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || loading}
                style={{
                  padding: '11px 26px', borderRadius: 99, border: 'none',
                  cursor: canAnalyze && !loading ? 'pointer' : 'not-allowed',
                  background: canAnalyze && !loading ? 'linear-gradient(135deg, rgba(255,240,240,1) 0%, rgba(255,228,232,1) 100%)' : '#E8E8E8',
                  color: canAnalyze && !loading ? P.ink : P.dim,
                  fontFamily: "'Plus Jakarta Sans'", fontSize: 14, fontWeight: 700,
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: canAnalyze && !loading ? '0 4px 16px rgba(255,180,190,0.35)' : 'none',
                  border: canAnalyze && !loading ? '1px solid rgba(255,200,210,0.8)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (canAnalyze && !loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
              >
                {loading
                  ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span>Analyzing…</>
                  : <>Analyze Resume</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            marginTop: 24, padding: '24px 28px',
            background: P.white, borderRadius: 20,
            border: `1px solid ${P.border}`,
            boxShadow: '0 2px 24px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: '#F0F0F0',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[72, 52, 35].map((w, i) => (
                <div key={i} style={{
                  height: 9, borderRadius: 5, width: `${w}%`,
                  background: 'linear-gradient(90deg, #F0F0F0 25%, #E4E4E4 50%, #F0F0F0 75%)',
                  backgroundSize: '200% 100%',
                  animation: `shimmer 1.5s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: P.muted, letterSpacing: '0.1em' }}>ANALYZING</div>
              <div style={{ fontSize: 11.5, color: P.dim, marginTop: 3 }}>Reading resume structure…</div>
            </div>
          </div>
        )}

        {result && (
          <div ref={resultsRef} style={{ marginTop: 24 }}>
            <ResultsDashboard result={result} />
          </div>
        )}
      </section>

      {!result && <HowItWorks />}

      <footer style={{ borderTop: `1px solid ${P.border}`, padding: '22px 24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: P.dim, fontFamily: "'JetBrains Mono'" }}>
          © 2026 ResumeAI · AI-powered resume intelligence
        </p>
      </footer>
    </div>
  )
}
