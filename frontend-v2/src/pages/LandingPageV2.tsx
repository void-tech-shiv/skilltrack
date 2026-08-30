import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  ArrowRight,
  TrendingUp,
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Search,
  ChevronRight,
  BarChart3,
  Layers,
  FileCheck,
  Clock,
  Sparkles,
  Lock,
  Compass,
  ArrowUpRight,
  Menu,
  X,
  Target,
  LineChart,
  HelpCircle
} from 'lucide-react';
import { api } from '../lib/api';

export const LandingPageV2: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputCertId, setInputCertId] = useState('');
  const [metrics, setMetrics] = useState<{
    registeredLearners: number;
    accreditedCourses: number;
    activeBatches: number;
    trainingProviders: number;
    certificatesIssued: number;
    verifiedPlacements: number;
    districtsCovered: number;
  }>({
    registeredLearners: 55,
    accreditedCourses: 12,
    activeBatches: 9,
    trainingProviders: 2,
    certificatesIssued: 14,
    verifiedPlacements: 22,
    districtsCovered: 6
  });

  useEffect(() => {
    api.get('/public-metrics')
      .then(data => {
        if (data && typeof data.registeredLearners === 'number') {
          setMetrics(data);
        }
      })
      .catch(err => console.log('Metrics fallback active:', err));
  }, []);

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCertId.trim();
    if (clean) {
      navigate(`/verify?id=${encodeURIComponent(clean)}`);
    } else {
      navigate('/verify');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.querySelector(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 10);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-900 selection:text-white">
      
      {/* 1. STICKY MODERN NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-3 lg:gap-5">
            
            {/* LEFT: Government & Platform Branding */}
            <button 
              onClick={() => scrollToSection('#hero')}
              className="flex items-center space-x-3 flex-shrink-0 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 bg-brand-900 text-white rounded-2xl flex items-center justify-center shadow-md ring-2 ring-brand-900/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[13px] sm:text-[14px] font-black text-slate-900 tracking-tight leading-none whitespace-nowrap">
                  Skill & Employment
                </span>
                <span className="text-[12px] sm:text-[13px] font-black text-brand-900 tracking-tight leading-none whitespace-nowrap mt-0.5">
                  Outcomes Intelligence
                </span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-normal whitespace-nowrap mt-0.5">
                  Maharashtra State Innovation Society (MSInS) • GoM
                </span>
              </div>
            </button>

            {/* CENTER: Desktop Navigation Links (Visible on 2xl / 1536px+) */}
            <nav className="hidden 2xl:flex items-center justify-center gap-1.5 flex-1 px-1">
              <button
                onClick={() => scrollToSection('#hero')}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-900 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('#problem')}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-900 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                The Problem
              </button>
              <button
                onClick={() => scrollToSection('#solution')}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-900 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Solution
              </button>
              <button
                onClick={() => scrollToSection('#how-it-works')}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-900 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('#ecosystem')}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-900 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Ecosystem
              </button>
              <button
                onClick={() => scrollToSection('#intelligence')}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-900 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                AI Intelligence
              </button>
              <button
                onClick={() => scrollToSection('#impact')}
                className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-900 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Government Impact
              </button>
            </nav>

            {/* RIGHT: Action Buttons + Mobile/Tablet Hamburger */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
              <Link
                to="/verify"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
              >
                <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Verify Certificate</span>
              </Link>
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition whitespace-nowrap"
              >
                <span>Access Platform</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </Link>

              {/* Mobile / Tablet Hamburger Toggle (Visible below 2xl) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="2xl:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 focus:outline-none flex items-center justify-center"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu (Absolute Overlay) */}
        {mobileMenuOpen && (
          <div className="2xl:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 px-4 sm:px-6 pt-3 pb-6 shadow-2xl space-y-3 z-50 animate-in slide-in-from-top-2 duration-200">
            <nav className="max-w-md mx-auto flex flex-col space-y-1 text-sm font-bold text-slate-700">
              <button
                onClick={() => scrollToSection('#hero')}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-900 flex items-center justify-between w-full"
              >
                <span>Home</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('#problem')}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-900 flex items-center justify-between w-full"
              >
                <span>The Problem</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('#solution')}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-900 flex items-center justify-between w-full"
              >
                <span>Our Solution</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('#how-it-works')}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-900 flex items-center justify-between w-full"
              >
                <span>How It Works</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('#ecosystem')}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-900 flex items-center justify-between w-full"
              >
                <span>Stakeholders</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('#intelligence')}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-900 flex items-center justify-between w-full"
              >
                <span>AI Intelligence</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => scrollToSection('#impact')}
                className="text-left px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-brand-900 flex items-center justify-between w-full"
              >
                <span>Government Impact</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </nav>

            <div className="max-w-md mx-auto pt-3 border-t border-slate-200 flex flex-col sm:hidden space-y-2">
              <Link
                to="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 px-4 text-center border border-slate-300 bg-white text-slate-800 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center space-x-2"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Verify Certificate</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 px-4 text-center bg-brand-900 text-white text-xs font-bold rounded-xl shadow flex items-center justify-center space-x-2"
              >
                <span>Access Platform</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Government Digital Infrastructure • Problem Statement #26135</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight uppercase leading-tight">
              FROM SKILL DEVELOPMENT <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-900 via-indigo-800 to-blue-700">
                TO SUSTAINABLE EMPLOYMENT.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
              A unified intelligence platform helping Maharashtra track skills, training outcomes, employment, retention and workforce gaps — from learner registration to long-term career outcomes.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href="#how-it-works"
                className="px-6 py-3.5 bg-brand-900 hover:bg-brand-800 text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <span>Explore Platform</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <Link
                to="/verify"
                className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-bold rounded-2xl shadow-sm hover:shadow transition flex items-center space-x-2"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Verify Certificate</span>
              </Link>

              <Link
                to="/login"
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-md transition flex items-center space-x-2"
              >
                <span>Sign In / Register</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Hero Visual: Connected Outcome Progression Pathway */}
          <div className="mt-16 bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Live State Skilling-to-Outcomes Progression Pathway
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">Maharashtra State Unified Registry</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 relative">
              {[
                { title: 'Learner', desc: 'Registered Profile', icon: Users, color: 'bg-blue-50 text-blue-900 border-blue-200' },
                { title: 'Skill Gap', desc: 'AI Competency Check', icon: Target, color: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
                { title: 'Training', desc: 'Accredited Batches', icon: BookOpen, color: 'bg-teal-50 text-teal-900 border-teal-200' },
                { title: 'Verified Progress', desc: '80% Attendance + Lab', icon: FileCheck, color: 'bg-amber-50 text-amber-900 border-amber-200' },
                { title: 'Employment', desc: 'Employer Verified', icon: Briefcase, color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                { title: 'Retention', desc: '3M / 6M / 12M Tracking', icon: Clock, color: 'bg-sky-50 text-sky-900 border-sky-200' },
                { title: 'Better Outcomes', desc: 'Wage Progression', icon: TrendingUp, color: 'bg-purple-50 text-purple-900 border-purple-200' }
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${step.color} shadow-sm flex flex-col justify-between relative group hover:scale-105 transition-transform`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">0{idx + 1}</span>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{step.title}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 3. GOVERNMENT CHALLENGE SECTION */}
      <section id="problem" className="py-16 lg:py-24 bg-white border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              The State Challenge
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3 uppercase">
              Training completion is not the final outcome.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium mt-2">
              Understanding whether skills translate into employment, retention and improved livelihoods requires visibility across the complete learner journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: '1. SKILL GAP',
                subtitle: 'Are learners gaining the skills industries actually need?',
                desc: 'Without granular competency mapping, training curriculums risk mismatching rapidly evolving technological demands.',
                icon: AlertTriangle,
                badge: 'Curriculum & Market Mismatch'
              },
              {
                title: '2. TRAINING OUTCOMES',
                subtitle: 'What happens after training is completed?',
                desc: 'Traditional government systems track exam pass rates but lose visibility the moment the candidate leaves the classroom.',
                icon: HelpCircle,
                badge: 'Post-Training Blindspot'
              },
              {
                title: '3. EMPLOYMENT',
                subtitle: 'Are trained learners transitioning into employment?',
                desc: 'Self-reported placement numbers often lack third-party employer verification and direct payroll validation.',
                icon: Briefcase,
                badge: 'Unverified Placement'
              },
              {
                title: '4. RETENTION',
                subtitle: 'Do employment outcomes sustain over time?',
                desc: 'Initial day-1 placement statistics fail to capture high early attrition, job switching, and workforce departure.',
                icon: Clock,
                badge: 'Early Attrition Risk'
              },
              {
                title: '5. WAGE PROGRESSION',
                subtitle: 'Are skills translating into better earning outcomes?',
                desc: 'Long-term socioeconomic mobility requires measuring wage growth curves rather than static entry-level compensation.',
                icon: TrendingUp,
                badge: 'Socioeconomic Mobility'
              },
              {
                title: '6. NON-PLACEMENT',
                subtitle: 'Why are trained learners not transitioning into employment?',
                desc: 'Lack of structured data on non-placement reasons prevents policy makers from resolving underlying friction.',
                icon: Compass,
                badge: 'Root Cause Obscurity'
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm hover:border-slate-300 transition">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.badge}</span>
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{card.title}</h3>
                  <h4 className="text-xs font-bold text-brand-900 mt-1">{card.subtitle}</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. OUR SOLUTION SECTION */}
      <section id="solution" className="py-16 lg:py-24 bg-slate-900 text-white border-b border-slate-800 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-800">
              Connected Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-3 uppercase">
              ONE PLATFORM. ONE CONNECTED JOURNEY. MEASURABLE OUTCOMES.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-xl mx-auto">
              Connecting registration, skill profiling, training progress, accredited certification, direct employer verification, and multi-year longitudinal outcomes.
            </p>
          </div>

          {/* Connected Step Pathway */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { num: '01', title: 'REGISTRATION', text: 'Universal canonical ID & Aadhaar-linked consent-driven profile.' },
              { num: '02', title: 'SKILL PROFILING', text: 'Diagnostic self-assessment mapping current competency assets.' },
              { num: '03', title: 'SKILL GAP IDENTIFICATION', text: 'AI engine compares profile against target career job roles.' },
              { num: '04', title: 'COURSE RECOMMENDATION', text: 'Personalized matching with state-accredited training programs.' },
              { num: '05', title: 'ACCREDITED TRAINING', text: 'Delivery across offline centers, hybrid labs, and virtual modules.' },
              { num: '06', title: 'ATTENDANCE & PROGRESS', text: 'Daily session hours logging (80% rule) and module progression.' },
              { num: '07', title: 'LAB EVIDENCE & COMPLETION', text: 'Practical lab report submissions verified by assigned teachers.' },
              { num: '08', title: 'OFFICIAL CERTIFICATION', text: 'Tamper-evident QR certificates issued by Government Admin.' },
              { num: '09', title: 'EMPLOYMENT TRANSITION', text: 'Transition into formal jobs, apprenticeships, or enterprise.' },
              { num: '10', title: 'DIRECT EMPLOYER VERIFICATION', text: 'Corporate payroll confirmation and initial placement lock.' },
              { num: '11', title: '3 / 6 / 12 MONTH RETENTION', text: 'Longitudinal follow-ups tracking sustainable job retention.' },
              { num: '12', title: 'WAGE PROGRESSION', text: 'Empirical wage growth curves & socioeconomic impact metrics.' }
            ].map((step, idx) => (
              <div key={idx} className="p-5 bg-slate-800/80 border border-slate-700 rounded-2xl hover:border-brand-500 transition relative">
                <span className="text-xs font-black text-amber-400 font-mono">{step.num}</span>
                <h3 className="text-sm font-bold text-white mt-1">{step.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-snug">{step.text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-brand-900 bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200">
              System Workflow
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3 uppercase">
              How the platform works in 6 steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: 'STEP 1',
                title: 'Identify',
                action: 'Understand Learner Profile',
                desc: 'Capture demographic data, existing qualifications, baseline vocational skills, and career aspirations in a standardized digital record.',
                icon: Users
              },
              {
                step: 'STEP 2',
                title: 'Recommend',
                action: 'Skill Gap & Course Matching',
                desc: 'Algorithmically detect missing competencies for target job roles and recommend accredited courses matching local district demand.',
                icon: Target
              },
              {
                step: 'STEP 3',
                title: 'Train',
                action: 'Multi-Mode Skilling Delivery',
                desc: 'Track skilling delivered through state vocational training institutes, private training partners, or enterprise apprenticeships.',
                icon: BookOpen
              },
              {
                step: 'STEP 4',
                title: 'Verify',
                action: 'Attendance, Evidence & Certification',
                desc: 'Validate minimum 80% session attendance, practical laboratory submissions, teacher signoffs, and issue tamper-evident QR certificates.',
                icon: Award
              },
              {
                step: 'STEP 5',
                title: 'Connect',
                action: 'Employment & Payroll Verification',
                desc: 'Track placement into corporate partners and secure formal confirmation directly from hiring employers.',
                icon: Briefcase
              },
              {
                step: 'STEP 6',
                title: 'Measure',
                action: 'Retention & Long-Term Progression',
                desc: 'Execute automated 3, 6, and 12-month retention checkpoints, wage growth tracking, and root cause classification for non-placement.',
                icon: LineChart
              }
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-extrabold text-brand-900 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                        {s.step}
                      </span>
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">{s.title}</h3>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mt-0.5">{s.action}</h4>
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 6. STAKEHOLDER ECOSYSTEM SECTION */}
      <section id="ecosystem" className="py-16 lg:py-24 bg-white border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Integrated Personas
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3 uppercase">
              ONE ECOSYSTEM. MULTIPLE STAKEHOLDERS. ONE OUTCOME.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Every participant operates within a purpose-built workspace adhering strictly to regulatory scope and role-based data boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                role: 'Government Admin',
                responsibility: 'State Governance + Macro Intelligence',
                desc: 'Oversees policy decisions, approves training center accreditations, reviews longitudinal retention metrics, and issues state certifications.',
                icon: ShieldCheck,
                color: 'border-emerald-200 bg-emerald-50/50'
              },
              {
                role: 'Course Manager',
                responsibility: 'Curriculum + Batch Scheduling',
                desc: 'Designs state course modules, defines minimum attendance and evidence prerequisites, and authorizes batch schedules across training centers.',
                icon: BookOpen,
                color: 'border-blue-200 bg-blue-50/50'
              },
              {
                role: 'Training Provider',
                responsibility: 'Operational Center Management',
                desc: 'Manages physical training centers, submits teacher onboarding accreditation requests, and oversees enrolled learner rosters.',
                icon: Building2,
                color: 'border-amber-200 bg-amber-50/50'
              },
              {
                role: 'Teacher',
                responsibility: 'Training Delivery + Progress Verification',
                desc: 'Conducts daily classroom and laboratory sessions, records attendance, reviews practical lab assignments, and recommends completions.',
                icon: Users,
                color: 'border-teal-200 bg-teal-50/50'
              },
              {
                role: 'Learner',
                responsibility: 'Skills + Training + Career Growth',
                desc: 'Assesses skill gaps, tracks training milestones, uploads practical laboratory evidence, and claims verified tamper-evident certificates.',
                icon: GraduationCap,
                color: 'border-sky-200 bg-sky-50/50'
              },
              {
                role: 'Employer',
                responsibility: 'Workforce Placement + Direct Verification',
                desc: 'Verifies self-reported candidate placements against company payroll, confirms job retention status, and logs career progression.',
                icon: Briefcase,
                color: 'border-purple-200 bg-purple-50/50'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className={`p-6 rounded-3xl border ${item.color} shadow-sm`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2.5 bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{item.role}</h3>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">{item.responsibility}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">{item.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. DECISION INTELLIGENCE SECTION */}
      <section id="intelligence" className="py-16 lg:py-24 bg-slate-900 text-white border-b border-slate-800 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400 bg-indigo-950 px-3 py-1 rounded-lg border border-indigo-800">
              AI & Data Science
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-3 uppercase">
              INTELLIGENCE THAT SUPPORTS BETTER DECISIONS.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Machine learning models and longitudinal analytics provide predictive decision support to optimize state skilling investments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Skill Gap Intelligence',
                desc: 'Compares individual learner baseline skills against industry competency requirements to pinpoint specific curricular deficits.',
                icon: BrainCircuit
              },
              {
                title: 'Course Recommendation',
                desc: 'Algorithmically recommends optimal state-accredited programs based on identified gaps, learner preferences, and regional demand.',
                icon: Compass
              },
              {
                title: 'Placement Prediction',
                desc: 'Analyzes completion performance, attendance records, and sector hiring trends to estimate employment probabilities.',
                icon: TrendingUp
              },
              {
                title: 'Dropout Risk Early Warning',
                desc: 'Detects early attendance drops and lab lag, flagging learners for counseling before training discontinuation occurs.',
                icon: AlertTriangle
              },
              {
                title: 'Retention Intelligence',
                desc: 'Evaluates longitudinal 3, 6, and 12-month retention stability across industries, locations, and training providers.',
                icon: LineChart
              },
              {
                title: 'Intervention Prioritization',
                desc: 'Guides counselors and state officers to allocate remedial training and stipend assistance where impact will be highest.',
                icon: Target
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="p-6 bg-slate-800 border border-slate-700 rounded-3xl shadow-sm">
                  <div className="p-2.5 bg-slate-700 text-indigo-300 rounded-2xl inline-block mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{card.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Responsible AI Disclaimer */}
          <div className="mt-10 p-4 bg-slate-800/60 border border-slate-700 rounded-2xl text-center">
            <p className="text-xs text-slate-400 font-medium">
              ⚖️ <b>Responsible AI Notice:</b> AI models provide data-driven insights and recommendations. Final policy, accreditation, and administrative decisions remain with authorized human stakeholders.
            </p>
          </div>

        </div>
      </section>

      {/* 8. BEFORE VS AFTER COMPARISON */}
      <section className="py-16 lg:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-brand-900 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200">
              Paradigm Shift
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3 uppercase">
              FROM FRAGMENTED DATA TO CONNECTED INTELLIGENCE.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="p-8 bg-rose-50/40 border border-rose-200 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg">
                  TRADITIONAL / BEFORE
                </span>
              </div>
              <h3 className="text-lg font-black text-rose-950">Fragmented & Unverified Reporting</h3>
              <ul className="space-y-2.5 text-xs text-rose-900">
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Scattered, disconnected training records across independent providers.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Zero outcome visibility once the training program finishes.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Manual laggy reporting relying on unverified claims.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Unknown competency gaps between course content and industry hiring.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Unrecorded root causes for candidate non-placement.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>No long-term longitudinal tracking of job retention or wages.</span>
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="p-8 bg-emerald-50/40 border border-emerald-200 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                  MAHASKILLS PLATFORM / AFTER
                </span>
              </div>
              <h3 className="text-lg font-black text-emerald-950">Unified Outcomes Intelligence</h3>
              <ul className="space-y-2.5 text-xs text-emerald-900">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Single continuous learner journey from registration to career growth.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Auditable, verified training outcomes backed by evidence & attendance.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>AI-driven skill-gap diagnostics and predictive early warnings.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Direct third-party corporate employer payroll verification.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>3, 6, and 12-month longitudinal retention tracking & wage growth curves.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Evidence-based government policy decisions and intervention allocation.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 9. GOVERNMENT IMPACT SECTION */}
      <section id="impact" className="py-16 lg:py-24 bg-slate-50 border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-brand-900 bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200">
              Actionable Governance
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3 uppercase">
              TURNING DATA INTO GOVERNMENT ACTION.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              How state policy makers utilize unified outcomes intelligence to continuously improve skilling programs across Maharashtra.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'POLICY',
                desc: 'Identify macro workforce transitions, regional skill demand trends, and emerging industrial sectors across all 36 districts.',
                icon: Layers
              },
              {
                title: 'PLANNING',
                desc: 'Forecast district and division-level technical labor requirements to allocate budget and training infrastructure effectively.',
                icon: BarChart3
              },
              {
                title: 'PROGRAM MANAGEMENT',
                desc: 'Benchmark training provider effectiveness based on verified employment and 6-month retention rates rather than raw enrollment numbers.',
                icon: CheckCircle2
              },
              {
                title: 'INTERVENTION',
                desc: 'Dispatch targeted remedial coaching, traveling stipends, or employer rematching to learners flagged with high dropout risk.',
                icon: Target
              },
              {
                title: 'EVALUATION',
                desc: 'Measure the true economic return on state skilling funds by auditing sustained wage progression over 12-month cohorts.',
                icon: LineChart
              },
              {
                title: 'WORKFORCE INTELLIGENCE',
                desc: 'Bridge the gap between candidate qualifications and employer demand in sectors like EV, Electronics, Solar Energy, and IT.',
                icon: BrainCircuit
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <div className="p-2.5 bg-brand-50 text-brand-900 rounded-2xl inline-block mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. LIVE PLATFORM METRICS */}
      <section className="py-14 bg-brand-950 text-white border-b border-brand-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Maharashtra State Real-Time Registry
              </span>
              <h2 className="text-2xl font-black uppercase">Live Platform Indicators</h2>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real database telemetry</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-brand-900/60 border border-brand-800 rounded-2xl">
              <p className="text-xs text-brand-300 font-semibold uppercase">Registered Learners</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{metrics.registeredLearners}</p>
            </div>
            <div className="p-4 bg-brand-900/60 border border-brand-800 rounded-2xl">
              <p className="text-xs text-brand-300 font-semibold uppercase">Accredited Courses</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{metrics.accreditedCourses}</p>
            </div>
            <div className="p-4 bg-brand-900/60 border border-brand-800 rounded-2xl">
              <p className="text-xs text-brand-300 font-semibold uppercase">Active Batches</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{metrics.activeBatches}</p>
            </div>
            <div className="p-4 bg-brand-900/60 border border-brand-800 rounded-2xl">
              <p className="text-xs text-brand-300 font-semibold uppercase">Training Providers</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{metrics.trainingProviders}</p>
            </div>
            <div className="p-4 bg-brand-900/60 border border-brand-800 rounded-2xl">
              <p className="text-xs text-brand-300 font-semibold uppercase">Districts Covered</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">{metrics.districtsCovered}</p>
            </div>
            <div className="p-4 bg-brand-900/60 border border-brand-800 rounded-2xl">
              <p className="text-xs text-brand-300 font-semibold uppercase">Verified Placements</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{metrics.verifiedPlacements}</p>
            </div>
          </div>

        </div>
      </section>

      {/* 11. NON-PLACEMENT ROOT CAUSE INTELLIGENCE */}
      <section className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Root Cause Diagnostics
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3 uppercase">
              Non-Placement Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Understanding why learners do not transition into employment helps programs move from reporting outcomes to actively improving them.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: 'Skill Mismatch', desc: 'Practical lab gaps for candidate' },
              { label: 'Location Constraint', desc: 'Transport or relocation barrier' },
              { label: 'Wage Expectation', desc: 'Starting offer below target' },
              { label: 'Further Studies', desc: 'Enrolled in higher education' },
              { label: 'Health / Personal', desc: 'Family or medical circumstances' },
              { label: 'Hiring Freeze', desc: 'Temporary corporate deferral' }
            ].map((cause, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                  Reason 0{i + 1}
                </span>
                <h4 className="font-bold text-xs text-slate-900 mt-2">{cause.label}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{cause.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 12. LONG-TERM RETENTION & WAGE PROGRESSION */}
      <section className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-3 py-1 rounded-lg border border-purple-200">
              Longitudinal Metrics
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3 uppercase">
              SUCCESS DOESN'T END AT PLACEMENT.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              The platform tracks candidate retention across 3, 6, and 12-month checkpoints alongside empirical wage progression curves.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
              <span className="text-xs font-black text-brand-900">MILESTONE 1</span>
              <h4 className="text-base font-extrabold text-slate-900 mt-1">Initial Placement</h4>
              <p className="text-xs text-slate-500 mt-1">Day-0 formal employer payroll enrollment confirmation.</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
              <span className="text-xs font-black text-indigo-900">MILESTONE 2</span>
              <h4 className="text-base font-extrabold text-slate-900 mt-1">3-Month Retention</h4>
              <p className="text-xs text-slate-500 mt-1">Initial probationary milestone and workplace adaptation.</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
              <span className="text-xs font-black text-purple-900">MILESTONE 3</span>
              <h4 className="text-base font-extrabold text-slate-900 mt-1">6-Month Retention</h4>
              <p className="text-xs text-slate-500 mt-1">Workforce stabilization and productivity contribution.</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
              <span className="text-xs font-black text-emerald-900">MILESTONE 4</span>
              <h4 className="text-base font-extrabold text-slate-900 mt-1">12-Month & Wages</h4>
              <p className="text-xs text-slate-500 mt-1">Long-term career sustainment and annual salary increment.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 13. CERTIFICATE TRUST & VERIFICATION SECTION */}
      <section id="verify-section" className="py-16 lg:py-24 bg-white border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-gradient-to-r from-brand-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-amber-400/20 text-amber-300 text-xs font-bold mb-4">
                <Award className="w-4 h-4" />
                <span>Tamper-Evident State Registry</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
                TRUST EVERY CREDENTIAL.
              </h2>
              <p className="text-xs sm:text-sm text-brand-100 mt-2 leading-relaxed">
                Verify the authenticity of a Maharashtra Government skilling certificate using its unique Certificate ID.
              </p>

              {/* Quick Input Mini-Verifier Form */}
              <form onSubmit={handleQuickVerify} className="mt-6 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={inputCertId}
                  onChange={(e) => setInputCertId(e.target.value)}
                  placeholder="e.g. CERT-MH-2026-1003"
                  className="flex-1 px-4 py-3 bg-white text-slate-900 font-mono text-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm rounded-2xl shadow-md transition flex items-center justify-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Verify Credential</span>
                </button>
              </form>

              <p className="text-[11px] text-brand-200 mt-3">
                🔒 Public verification returns authentic course, recipient, and provider details while protecting private personal PII.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 14. SECURITY & PLATFORM TRUST SECTION */}
      <section className="py-14 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <Lock className="w-6 h-6 text-brand-900 mx-auto" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">Role-Based Access</h4>
              <p className="text-[11px] text-slate-500">Strict regulatory permission guards on every endpoint.</p>
            </div>
            <div className="space-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-700 mx-auto" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">Multi-Tenant Isolation</h4>
              <p className="text-[11px] text-slate-500">Training providers only see their affiliated center data.</p>
            </div>
            <div className="space-y-1">
              <FileCheck className="w-6 h-6 text-indigo-700 mx-auto" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">Immutable Audit Trail</h4>
              <p className="text-[11px] text-slate-500">All administrative approvals and revocations logged.</p>
            </div>
            <div className="space-y-1">
              <Award className="w-6 h-6 text-amber-600 mx-auto" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase">Tamper-Proof QR Hash</h4>
              <p className="text-[11px] text-slate-500">Cryptographically verifiable credential signatures.</p>
            </div>
          </div>

        </div>
      </section>

      {/* 15. FINAL CALL TO ACTION (CTA) */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-black uppercase tracking-widest text-brand-900 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200">
            Maharashtra State Innovation Society
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight">
            BUILD SKILLS. MEASURE OUTCOMES. STRENGTHEN EMPLOYMENT.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            A connected digital infrastructure for Maharashtra's skilling and employment ecosystem.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-4 bg-brand-900 hover:bg-brand-800 text-white text-sm font-bold rounded-2xl shadow-xl hover:shadow-2xl transition flex items-center space-x-2"
            >
              <span>Access Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/verify"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-bold rounded-2xl shadow-md transition flex items-center space-x-2"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 16. FOOTER */}
      <footer id="about" className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="font-extrabold text-sm text-white">
                  Skill & Employment Outcomes Intelligence
                </span>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Maharashtra State Innovation Society (MSInS), Government of Maharashtra. Addressing Problem Statement #26135 through unified skill gap diagnostics, evidence-based training, and longitudinal outcome verification.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3">Navigation</h4>
              <ul className="space-y-1.5">
                <li><a href="#hero" className="hover:text-white">Home</a></li>
                <li><a href="#problem" className="hover:text-white">The Problem</a></li>
                <li><a href="#solution" className="hover:text-white">Our Solution</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#ecosystem" className="hover:text-white">Stakeholders</a></li>
                <li><a href="#intelligence" className="hover:text-white">Decision Intelligence</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white uppercase tracking-wider mb-3">Platform Access</h4>
              <ul className="space-y-1.5">
                <li><Link to="/login" className="hover:text-white">Sign In / Role Access</Link></li>
                <li><Link to="/verify" className="hover:text-white">Public Certificate Verification</Link></li>
                <li><Link to="/register-learner" className="hover:text-white">Learner Registration</Link></li>
                <li><Link to="/register-employer" className="hover:text-white">Employer Registration</Link></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
            <p>© 2026 Maharashtra State Innovation Society (MSInS), Government of Maharashtra. All rights reserved.</p>
            <p>Built for Smart India Hackathon • Problem Statement #26135</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
