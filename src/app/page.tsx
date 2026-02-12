import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  CreditCard,
  Lock,
  PiggyBank,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Wallet,
    title: 'Controle Total',
    description:
      'Registre receitas e despesas em segundos. Tenha uma visão completa da sua vida financeira.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Inteligente',
    description:
      'Gráficos interativos que mostram para onde seu dinheiro está indo e de onde vem.',
  },
  {
    icon: TrendingUp,
    title: 'Acompanhe sua Evolução',
    description:
      'Compare mês a mês e veja seu progresso financeiro com variações em tempo real.',
  },
  {
    icon: CreditCard,
    title: 'Categorias Personalizadas',
    description:
      'Organize gastos por categorias como alimentação, transporte, lazer e muito mais.',
  },
  {
    icon: Smartphone,
    title: 'Acesse de Qualquer Lugar',
    description:
      'Design responsivo que funciona perfeitamente no celular, tablet ou computador.',
  },
  {
    icon: Lock,
    title: 'Seguro e Privado',
    description:
      'Seus dados são protegidos com autenticação segura e criptografia de ponta.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Crie sua conta',
    description:
      'Cadastre-se gratuitamente em poucos segundos com e-mail ou Google.',
  },
  {
    number: '02',
    title: 'Registre suas finanças',
    description:
      'Adicione suas receitas e despesas de forma rápida e organizada.',
  },
  {
    number: '03',
    title: 'Acompanhe seus resultados',
    description:
      'Visualize relatórios e gráficos que te ajudam a tomar melhores decisões.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-purple-500" />
            <span className="text-xl font-bold tracking-tight">MyFinan</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="sm"
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Criar conta
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient blobs decorativos */}
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-[300px] w-[400px] rounded-full bg-purple-400/10 blur-[100px]" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-24 text-center sm:px-6 sm:pt-32 md:pt-40">
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400">
            <PiggyBank className="h-4 w-4" />
            Finanças pessoais simplificadas
          </span>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Suas finanças no{' '}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              controle total
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Registre receitas, acompanhe despesas e visualize para onde seu
            dinheiro está indo — tudo em um dashboard simples e intuitivo.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-purple-600 px-8 text-white hover:bg-purple-700"
              >
                Começar agora — é grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#funcionalidades">
              <Button size="lg" variant="outline" className="px-8">
                Ver funcionalidades
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* ── Preview mockup ────────────────────────── */}
          <div className="mt-16 w-full max-w-3xl">
            <div className="rounded-xl border border-border/60 bg-card/50 p-2 shadow-2xl shadow-purple-500/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-muted-foreground">
                  app.myfinan.com.br/dashboard
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4">
                <div className="rounded-lg bg-secondary/60 p-4">
                  <p className="text-xs text-muted-foreground">Receita</p>
                  <p className="mt-1 text-lg font-bold text-green-400">
                    R$ 5.200,00
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-4">
                  <p className="text-xs text-muted-foreground">Despesa</p>
                  <p className="mt-1 text-lg font-bold text-red-400">
                    R$ 3.100,00
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-4">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="mt-1 text-lg font-bold text-purple-400">
                    R$ 2.100,00
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="flex h-32 items-end gap-2">
                  {[
                    { month: 'Jan', h: 40 },
                    { month: 'Fev', h: 65 },
                    { month: 'Mar', h: 50 },
                    { month: 'Abr', h: 80 },
                    { month: 'Mai', h: 55 },
                    { month: 'Jun', h: 90 },
                    { month: 'Jul', h: 70 },
                    { month: 'Ago', h: 85 },
                    { month: 'Set', h: 60 },
                    { month: 'Out', h: 75 },
                    { month: 'Nov', h: 95 },
                    { month: 'Dez', h: 68 },
                  ].map(bar => (
                    <div
                      key={bar.month}
                      className="flex-1 rounded-t bg-gradient-to-t from-purple-600 to-purple-400 transition-all"
                      style={{ height: `${bar.h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>Jan</span>
                  <span>Fev</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>Mai</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                  <span>Set</span>
                  <span>Out</span>
                  <span>Nov</span>
                  <span>Dez</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ────────────────────────────── */}
      <section
        id="funcionalidades"
        className="border-t border-border/40 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-purple-400">
              Funcionalidades
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Tudo o que você precisa para{' '}
              <span className="text-purple-400">organizar suas finanças</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Ferramentas pensadas para facilitar sua rotina financeira, sem
              complicação.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(feature => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border/40 bg-card/30 p-6 transition-all hover:border-purple-500/40 hover:bg-card/60"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 transition-colors group-hover:bg-purple-500/20">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ──────────────────────────────── */}
      <section className="border-t border-border/40 bg-secondary/20 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-purple-400">
              Como funciona
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Comece em{' '}
              <span className="text-purple-400">3 passos simples</span>
            </h2>
          </div>

          <div className="mt-16 space-y-8 sm:space-y-12">
            {steps.map(step => (
              <div key={step.number} className="flex items-start gap-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-purple-500/30 bg-purple-500/10 text-xl font-bold text-purple-400">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────── */}
      <section className="border-t border-border/40 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <PiggyBank className="mx-auto h-12 w-12 text-purple-400" />
          <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
            Pronto para organizar suas finanças?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Junte-se ao MyFinan e comece a ter controle total do seu dinheiro. É
            grátis, rápido e fácil.
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-purple-600 px-10 text-white hover:bg-purple-700"
              >
                Criar minha conta grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-semibold">MyFinan</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MyFinan. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
