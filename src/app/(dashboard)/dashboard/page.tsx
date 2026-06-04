import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarDays, FileText, Package, TrendingUp, ArrowUpRight, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [eventsThisMonth, pendingQuotes, totalProducts, upcomingEvents, recentQuotes, approvedTotal] =
    await Promise.all([
      prisma.event.count({
        where: { date: { gte: monthStart, lt: monthEnd }, status: { not: "cancelado" } },
      }),
      prisma.quote.count({ where: { status: { in: ["rascunho", "enviado"] } } }),
      prisma.product.count({ where: { active: true } }),
      prisma.event.findMany({
        where: { date: { gte: now }, status: { not: "cancelado" } },
        orderBy: { date: "asc" },
        take: 5,
      }),
      prisma.quote.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.quote.aggregate({
        where: { status: "aprovado", createdAt: { gte: monthStart } },
        _sum: { total: true },
      }),
    ]);

  const monthRevenue = approvedTotal._sum.total ?? 0;

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  // Paleta unificada: tudo em tons dourados/neutros — visual coeso e premium
  const stats = [
    {
      label: "Eventos este mês",
      value: eventsThisMonth.toString(),
      icon: CalendarDays,
      href: "/calendario",
    },
    {
      label: "Orçamentos pendentes",
      value: pendingQuotes.toString(),
      icon: FileText,
      href: "/orcamentos",
    },
    {
      label: "Produtos no catálogo",
      value: totalProducts.toString(),
      icon: Package,
      href: "/catalogo",
    },
    {
      label: "Receita aprovada/mês",
      value: formatCurrency(monthRevenue),
      icon: TrendingUp,
      href: "/orcamentos",
      isMoney: true,
    },
  ];

  const eventTypeIcon: Record<string, string> = {
    casamento: "💍",
    aniversario: "🎂",
    corporativo: "🏢",
    outro: "✨",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#2a2419] tracking-tight">
            {greeting}, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-[#9b8b73] mt-1">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(now)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="card-hover bg-white border border-[#ede7dc] rounded-xl p-5 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#fef9ec] flex items-center justify-center">
                  <Icon size={18} className="text-[#d4a017]" />
                </div>
                <ArrowUpRight size={14} className="text-[#c9beac] group-hover:text-[#d4a017] transition-colors" />
              </div>
              <p className={`font-bold text-[#2a2419] tabular ${stat.isMoney ? 'text-lg' : 'text-2xl'}`}>
                {stat.value}
              </p>
              <p className="text-xs text-[#9b8b73] mt-1">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Upcoming Events */}
        <div className="lg:col-span-3 bg-white border border-[#ede7dc] rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f1ea]">
            <div>
              <h2 className="text-sm font-semibold text-[#2a2419]">Próximos eventos</h2>
              <p className="text-xs text-[#9b8b73] mt-0.5">{upcomingEvents.length} agendados</p>
            </div>
            <Link href="/calendario" className="text-xs text-[#d4a017] hover:text-[#b8860b] font-medium flex items-center gap-1">
              Ver calendário
              <ArrowUpRight size={12} />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CalendarDays size={28} className="text-[#c9beac] mx-auto mb-2" />
              <p className="text-sm text-[#9b8b73]">Nenhum evento próximo agendado</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5f1ea]">
              {upcomingEvents.map((event) => {
                const days = Math.ceil((new Date(event.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={event.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#faf8f3] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[#fef9ec] flex items-center justify-center flex-shrink-0 text-base">
                      {eventTypeIcon[event.type] ?? "📅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2a2419] truncate">{event.title}</p>
                      <p className="text-xs text-[#9b8b73]">{event.clientName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-[#2a2419] tabular">{formatDate(event.date)}</p>
                      <p className="text-[10px] text-[#9b8b73] flex items-center gap-1 justify-end">
                        <Clock size={9} />
                        {days === 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Quotes */}
        <div className="lg:col-span-2 bg-white border border-[#ede7dc] rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f1ea]">
            <div>
              <h2 className="text-sm font-semibold text-[#2a2419]">Orçamentos recentes</h2>
              <p className="text-xs text-[#9b8b73] mt-0.5">Últimos 5</p>
            </div>
            <Link href="/orcamentos" className="text-xs text-[#d4a017] hover:text-[#b8860b] font-medium flex items-center gap-1">
              Ver todos
              <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileText size={28} className="text-[#c9beac] mx-auto mb-2" />
              <p className="text-sm text-[#9b8b73]">Nenhum orçamento ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f5f1ea]">
              {recentQuotes.map((quote) => (
                <Link
                  key={quote.id}
                  href={`/orcamentos/${quote.id}`}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-[#faf8f3] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2a2419] truncate">
                      {quote.clientName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#9b8b73]">#{String(quote.id).padStart(4, "0")}</span>
                      <Badge variant={quote.status as never}>
                        {quote.status === "rascunho" ? "Rascunho" : quote.status === "enviado" ? "Enviado" : quote.status === "aprovado" ? "Aprovado" : "Rejeitado"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#2a2419] flex-shrink-0 tabular">
                    {formatCurrency(quote.total)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
