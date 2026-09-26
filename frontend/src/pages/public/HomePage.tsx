import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Compass,
  ListChecks,
  Building2,
  GitBranch,
  LayoutDashboard,
  List,
  GitMerge,
  Shield,
  CheckCircle2,
  FolderKanban,
  User,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const { t } = useTranslation('landing');
  const [activeFeature, setActiveFeature] = useState<number>(0);

  const features = [
    {
      id: 0,
      title: t('features.feature0.title'),
      icon: LayoutDashboard,
      description: t('features.feature0.description'),
      highlights: [
        t('features.feature0.h1'),
        t('features.feature0.h2'),
        t('features.feature0.h3'),
      ],
    },
    {
      id: 1,
      title: t('features.feature1.title'),
      icon: List,
      description: t('features.feature1.description'),
      highlights: [
        t('features.feature1.h1'),
        t('features.feature1.h2'),
        t('features.feature1.h3'),
      ],
    },
    {
      id: 2,
      title: t('features.feature2.title'),
      icon: GitMerge,
      description: t('features.feature2.description'),
      highlights: [
        t('features.feature2.h1'),
        t('features.feature2.h2'),
        t('features.feature2.h3'),
      ],
    },
    {
      id: 3,
      title: t('features.feature3.title'),
      icon: Shield,
      description: t('features.feature3.description'),
      highlights: [
        t('features.feature3.h1'),
        t('features.feature3.h2'),
        t('features.feature3.h3'),
      ],
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      status: 'TODO',
      bg: 'bg-slate-100 border-slate-200 text-slate-800',
      dotBg: 'bg-slate-400',
      description: t('workflow.step1Desc'),
    },
    {
      step: '02',
      status: 'IN_PROGRESS',
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      dotBg: 'bg-amber-500',
      description: t('workflow.step2Desc'),
    },
    {
      step: '03',
      status: 'IN_PREVIEW',
      bg: 'bg-cyan-50 border-cyan-200 text-cyan-900',
      dotBg: 'bg-cyan-500',
      description: t('workflow.step3Desc'),
    },
    {
      step: '04',
      status: 'DONE',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      dotBg: 'bg-emerald-500',
      description: t('workflow.step4Desc'),
    },
  ];

  const ActiveIcon = features[activeFeature].icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Section 1 — Hero */}
      <section id="hero" className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            <Badge variant="outline" className="px-3 py-1.5 rounded-full border-slate-300 bg-white shadow-xs text-xs font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse motion-reduce:animate-none mr-2 inline-block" />
              {t('hero.badge')}
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {t('hero.titlePrefix')}{' '}
              <span className="text-indigo-600">{t('hero.titleHighlight')}</span>.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link to="/register">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
                  {t('hero.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                  <Compass className="mr-2 h-4 w-4" /> {t('hero.exploreFeatures')}
                </Button>
              </a>
            </div>

            <p className="text-xs text-slate-400 font-mono tracking-wide pt-1">
              {t('hero.noCard')}
            </p>
          </div>

          {/* Kanban Mockup */}
          <div className="mt-12 hidden md:block">
            <div className="rounded-xl border border-slate-300 bg-white shadow-2xl overflow-hidden">
              {/* Browser Chrome Top Bar */}
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-red-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
                </div>
                <div className="flex-1 max-w-md mx-4">
                  <div className="bg-white border border-slate-200 rounded-md px-3 py-1 text-xs text-slate-500 font-mono text-center flex items-center justify-center space-x-1">
                    <span className="text-slate-400">https://</span>
                    <span className="text-slate-700 font-semibold">app.flowboard.dev/workspace/proj-1</span>
                  </div>
                </div>
                <div className="w-12" />
              </div>

              {/* App Interface Body */}
              <div className="flex h-[420px] bg-slate-50">
                {/* Dark Sidebar */}
                <div className="w-48 bg-slate-900 p-4 text-slate-300 flex flex-col justify-between hidden lg:flex">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-white font-bold text-sm">
                      <FolderKanban className="h-5 w-5 text-indigo-400" />
                      <span>FlowBoard</span>
                    </div>
                    <div className="space-y-1 pt-2">
                      <div className="px-2 py-1.5 rounded bg-indigo-600/30 text-indigo-200 text-xs font-medium flex items-center space-x-2">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        <span>Kanban Board</span>
                      </div>
                      <div className="px-2 py-1.5 rounded text-slate-400 text-xs hover:text-slate-200 flex items-center space-x-2">
                        <List className="h-3.5 w-3.5" />
                        <span>Issue List</span>
                      </div>
                      <div className="px-2 py-1.5 rounded text-slate-400 text-xs hover:text-slate-200 flex items-center space-x-2">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Projects</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 border-t border-slate-800 pt-3">
                    <User className="h-4 w-4" />
                    <span>Dev Team</span>
                  </div>
                </div>

                {/* Main Board View */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col">
                  {/* Board Header Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Core Engine Refactor</h3>
                      <p className="text-xs text-slate-500">PROJ-1 • {t('hero.updatedAgo')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          readOnly
                          placeholder={t('hero.searchPlaceholder')}
                          className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-600 focus:outline-none w-36"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 Kanban Columns */}
                  <div className="grid grid-cols-4 gap-3 flex-1 overflow-hidden">
                    {/* TODO Column */}
                    <div className="bg-slate-100/80 rounded-lg p-2.5 border border-slate-200 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">TODO</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">2</span>
                      </div>
                      <div className="space-y-2 overflow-y-auto">
                        <div className="bg-white p-2.5 rounded border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-mono text-indigo-600 font-semibold">FLW-102</span>
                          <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-2">Setup OAuth2 Refresh Token Rotation</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">High</span>
                            <span className="h-4 w-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">AK</span>
                          </div>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-mono text-indigo-600 font-semibold">BUG-45</span>
                          <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-2">Fix dropdown z-index overflow in modal</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded">Low</span>
                            <span className="h-4 w-4 rounded-full bg-slate-400 text-white text-[9px] flex items-center justify-center font-bold">JD</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* IN PROGRESS Column */}
                    <div className="bg-amber-50/60 rounded-lg p-2.5 border border-amber-200/80 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">IN PROGRESS</span>
                        <span className="text-[10px] bg-amber-200/60 text-amber-800 px-1.5 py-0.5 rounded font-mono">1</span>
                      </div>
                      <div className="space-y-2 overflow-y-auto">
                        <div className="bg-white p-2.5 rounded border border-amber-200 shadow-2xs">
                          <span className="text-[10px] font-mono text-indigo-600 font-semibold">FEAT-99</span>
                          <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-2">Fractional Indexing DnD algorithm</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] bg-red-100 text-red-800 px-1 rounded">Urgent</span>
                            <span className="h-4 w-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">TS</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* IN PREVIEW Column */}
                    <div className="bg-cyan-50/60 rounded-lg p-2.5 border border-cyan-200/80 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">IN PREVIEW</span>
                        <span className="text-[10px] bg-cyan-200/60 text-cyan-800 px-1.5 py-0.5 rounded font-mono">1</span>
                      </div>
                      <div className="space-y-2 overflow-y-auto">
                        <div className="bg-white p-2.5 rounded border border-cyan-200 shadow-2xs">
                          <span className="text-[10px] font-mono text-indigo-600 font-semibold">FLW-88</span>
                          <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-2">Prisma multi-file schema migration</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">Medium</span>
                            <span className="h-4 w-4 rounded-full bg-purple-600 text-white text-[9px] flex items-center justify-center font-bold">MR</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DONE Column */}
                    <div className="bg-emerald-50/60 rounded-lg p-2.5 border border-emerald-200/80 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">DONE</span>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-mono">1</span>
                      </div>
                      <div className="space-y-2 overflow-y-auto">
                        <div className="bg-white p-2.5 rounded border border-emerald-200 shadow-2xs opacity-85">
                          <span className="text-[10px] font-mono text-indigo-600 font-semibold line-through">FLW-70</span>
                          <p className="text-xs font-medium text-slate-700 mt-1 line-clamp-2">NestJS JWT auth middleware setup</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">Completed</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Highlights */}
      <section id="highlights" className="py-20 bg-white border-t border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {t('highlights.title')}
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              {t('highlights.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow border-slate-200">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                  <ListChecks className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">{t('highlights.item1Title')}</CardTitle>
                <CardDescription className="text-slate-600 mt-2 text-sm leading-relaxed">
                  {t('highlights.item1Desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-slate-200">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">{t('highlights.item2Title')}</CardTitle>
                <CardDescription className="text-slate-600 mt-2 text-sm leading-relaxed">
                  {t('highlights.item2Desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-slate-200">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                  <GitBranch className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">{t('highlights.item3Title')}</CardTitle>
                <CardDescription className="text-slate-600 mt-2 text-sm leading-relaxed">
                  {t('highlights.item3Desc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3 — Features Preview */}
      <section id="features" className="bg-slate-100 py-24 border-t border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-3 border-indigo-200 bg-indigo-50 text-indigo-700">
              {t('features.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {t('features.title')}
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column Selector */}
            <div className="lg:col-span-5 space-y-3">
              {features.map((item, index) => {
                const ItemIcon = item.icon;
                const isActive = activeFeature === index;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveFeature(index)}
                    className={`w-full text-left p-4 rounded-xl transition-all flex items-start space-x-4 border ${
                      isActive
                        ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ItemIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`font-semibold text-base ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column Card Display */}
            <div className="lg:col-span-7">
              <Card className="bg-white border-slate-200 shadow-lg p-6 sm:p-8 min-h-[360px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                      <ActiveIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {features[activeFeature].title}
                      </CardTitle>
                      <span className="text-xs font-mono text-indigo-600 font-semibold uppercase tracking-wider">
                        Feature 0{activeFeature + 1}
                      </span>
                    </div>
                  </div>

                  <CardDescription className="text-slate-700 text-base leading-relaxed mb-6">
                    {features[activeFeature].description}
                  </CardDescription>

                  <div className="space-y-3 border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('features.keyHighlights')}</h4>
                    <ul className="space-y-2">
                      {features[activeFeature].highlights.map((highlight, i) => (
                        <li key={i} className="flex items-center text-sm text-slate-800">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-2.5 shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{t('features.interactivePreview')}</span>
                  <span className="font-mono">{t('features.stepOf', { step: activeFeature + 1, total: 4 })}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Workflow Pipeline */}
      <section id="workflow" className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {t('workflow.title')}
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              {t('workflow.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((item) => (
              <Card
                key={item.status}
                className={`border transition-transform hover:-translate-y-1 ${item.bg}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500">{item.step}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${item.dotBg}`} />
                  </div>
                  <CardTitle className="text-lg font-mono font-bold tracking-wide mt-2">
                    {item.status}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — CTA */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-slate-900 rounded-2xl text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {t('cta.title')}
              </h2>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                {t('cta.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link to="/register">
                  <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 w-full sm:w-auto">
                    {t('cta.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-white border-slate-700 hover:bg-slate-800 bg-transparent w-full sm:w-auto"
                  >
                    {t('cta.signIn')}
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-slate-400 font-mono pt-2">
                {t('cta.freeNote')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
