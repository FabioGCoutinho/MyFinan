import {
  Banknote,
  BookOpen,
  Briefcase,
  Car,
  CreditCard as CreditCardIcon,
  Gift,
  HeartPulse,
  Home,
  Lightbulb,
  LineChart,
  Monitor,
  Plane,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Utensils,
} from 'lucide-react'

// ══════════════════════════════════════════════════════════
// DESPESAS — Ícones e Backgrounds
// ══════════════════════════════════════════════════════════

export const ExpenseCategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'Alimentação':
      return <Utensils className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    case 'Contas':
      return <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
    case 'Dívidas':
      return <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
    case 'Doações':
      return <Gift className="w-5 h-5 text-pink-600 dark:text-pink-400" />
    case 'Educação':
      return <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    case 'Lazer':
      return <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
    case 'Moradia':
      return <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    case 'Saúde':
      return <HeartPulse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    case 'Transporte':
      return <Car className="w-5 h-5 text-teal-600 dark:text-teal-400" />
    case 'Vestuário':
      return <ShoppingBag className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
    case 'Cartão':
      return <CreditCardIcon className="w-5 h-5 text-info" />
    default:
      return <Banknote className="w-5 h-5 text-gray-600 dark:text-gray-400" />
  }
}

export const expenseCategoryBg = (category: string): string => {
  switch (category) {
    case 'Alimentação':
      return 'bg-orange-100 dark:bg-orange-900/30'
    case 'Contas':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'Dívidas':
      return 'bg-red-100 dark:bg-red-900/30'
    case 'Doações':
      return 'bg-pink-100 dark:bg-pink-900/30'
    case 'Educação':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'Lazer':
      return 'bg-purple-100 dark:bg-purple-900/30'
    case 'Moradia':
      return 'bg-indigo-100 dark:bg-indigo-900/30'
    case 'Saúde':
      return 'bg-emerald-100 dark:bg-emerald-900/30'
    case 'Transporte':
      return 'bg-teal-100 dark:bg-teal-900/30'
    case 'Vestuário':
      return 'bg-fuchsia-100 dark:bg-fuchsia-900/30'
    case 'Cartão':
      return 'bg-info/20 dark:bg-info/10'
    default:
      return 'bg-gray-100 dark:bg-gray-900/30'
  }
}

// ══════════════════════════════════════════════════════════
// RECEITAS — Ícones e Backgrounds
// ══════════════════════════════════════════════════════════

export const RevenueCategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'Salário':
      return <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    case 'Rendimentos':
      return <LineChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    case 'Freelance':
      return <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    case 'Bônus':
      return <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
    case 'Vendas':
      return <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    default:
      return <Banknote className="w-5 h-5 text-teal-600 dark:text-teal-400" />
  }
}

export const revenueCategoryBg = (category: string): string => {
  switch (category) {
    case 'Salário':
      return 'bg-emerald-100 dark:bg-emerald-900/30'
    case 'Rendimentos':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'Freelance':
      return 'bg-indigo-100 dark:bg-indigo-900/30'
    case 'Bônus':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'Vendas':
      return 'bg-orange-100 dark:bg-orange-900/30'
    default:
      return 'bg-teal-100 dark:bg-teal-900/30'
  }
}

// ══════════════════════════════════════════════════════════
// CARTÃO — Ícones e Backgrounds (despesas no cartão)
// ══════════════════════════════════════════════════════════

export const CardExpenseCategoryIcon = ({ category }: { category: string }) => {
  switch (category.toUpperCase()) {
    case 'E-COMMERCE':
      return <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
    case 'LAZER':
      return <Monitor className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    case 'VIAGEM':
      return <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    case 'TRANSPORTE':
      return <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    default:
      return <CreditCardIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
  }
}

export const cardExpenseCategoryBg = (category: string): string => {
  switch (category.toUpperCase()) {
    case 'E-COMMERCE':
      return 'bg-indigo-100 dark:bg-indigo-900/30'
    case 'LAZER':
      return 'bg-orange-100 dark:bg-orange-900/30'
    case 'VIAGEM':
      return 'bg-blue-100 dark:bg-blue-900/30'
    case 'TRANSPORTE':
      return 'bg-emerald-100 dark:bg-emerald-900/30'
    default:
      return 'bg-teal-100 dark:bg-teal-900/30'
  }
}

// ══════════════════════════════════════════════════════════
// FORMULÁRIOS — Ícone grande (6x6) para sidebar de "novo"
// ══════════════════════════════════════════════════════════

export const getExpenseFormIcon = (category: string) => {
  switch (category) {
    case 'Alimentação': return <Utensils className="w-6 h-6" />
    case 'Contas': return <Lightbulb className="w-6 h-6" />
    case 'Dívidas': return <ShieldAlert className="w-6 h-6" />
    case 'Doações': return <Gift className="w-6 h-6" />
    case 'Educação': return <BookOpen className="w-6 h-6" />
    case 'Lazer': return <Monitor className="w-6 h-6" />
    case 'Moradia': return <Home className="w-6 h-6" />
    case 'Saúde': return <HeartPulse className="w-6 h-6" />
    case 'Transporte': return <Car className="w-6 h-6" />
    case 'Vestuário': return <ShoppingBag className="w-6 h-6" />
    case 'Impostos': return <Banknote className="w-6 h-6" />
    default: return <ShoppingCart className="w-6 h-6" />
  }
}
