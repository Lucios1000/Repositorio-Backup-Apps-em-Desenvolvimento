import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  ShieldCheck, 
  Users, 
  Megaphone, 
  Rocket, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { SimulationParams } from './types';

// Tipos para as fases de implantação
type Phase = {
  id: number;
  title: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  tasks: string[];
  color: string;
  startWeek: number;
  endWeek: number;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

interface ImplementationTabProps {
  currentParams: SimulationParams;
}

export const ImplementationTab: React.FC<ImplementationTabProps> = ({ currentParams }) => {
  const [activePhaseId, setActivePhaseId] = useState<number | null>(null);

  // Definição das fases com dados dinâmicos baseados em currentParams
  const PHASES: Phase[] = useMemo(() => [
    {
      id: 1,
      title: "Estruturação & Legal",
      period: "Mês 1 (Sem 1-4)",
      description: "Configuração jurídica, definição de tarifas e setup da plataforma.",
      icon: <ShieldCheck className="w-6 h-6" />,
      tasks: [
        "CNPJ e Alvarás Municipais", 
        "Configuração do App TKX", 
        `Definição de Tarifas (${formatCurrency(currentParams.avgFare)})`, 
        "Contratação Equipe Base"
      ],
      color: "#94a3b8", // Slate 400
      startWeek: 1,
      endWeek: 4
    },
    {
      id: 2,
      title: "Aquisição de Motoristas",
      period: "Mês 2 (Sem 5-8)",
      description: "Campanhas focadas em supply para garantir disponibilidade inicial.",
      icon: <Users className="w-6 h-6" />,
      tasks: [
        `Cadastro de ${currentParams.activeDrivers}+ Motoristas`, 
        "Validação de Documentos", 
        "Treinamento/Onboarding", 
        `Adesão Turbo (${formatCurrency(currentParams.adesaoTurbo)})`
      ],
      color: "#fbbf24", // Amber 400 (Yellow-400 approx)
      startWeek: 5,
      endWeek: 8
    },
    {
      id: 3,
      title: "Marketing & Soft Launch",
      period: "Mês 3 (Sem 9-12)",
      description: "Testes controlados e início da aquisição de passageiros.",
      icon: <Megaphone className="w-6 h-6" />,
      tasks: [
        `Parcerias com Bares (${formatCurrency(currentParams.parceriasBares)})`, 
        `Tráfego Pago (${formatCurrency(currentParams.trafegoPago)})`, 
        "Testes Beta (Soft Launch)", 
        `Indique e Ganhe (${formatCurrency(currentParams.indiqueGanhe)})`
      ],
      color: "#38bdf8", // Sky 400
      startWeek: 9,
      endWeek: 12
    },
    {
      id: 4,
      title: "Go Live & Escala",
      period: "Mês 4+ (Sem 13+)",
      description: "Lançamento oficial e expansão da base de usuários.",
      icon: <Rocket className="w-6 h-6" />,
      tasks: [
        "Evento de Lançamento", 
        "Blitz Promocional", 
        "Monitoramento de KPIs", 
        `Expansão da Frota (+${currentParams.driverAdditionMonthly}/mês)`
      ],
      color: "#4ade80", // Green 400
      startWeek: 13,
      endWeek: 16
    }
  ], [currentParams]);

  // Dados do gráfico recalculados quando as fases mudam (embora a estrutura de tempo seja fixa)
  const CHART_DATA = useMemo(() => Array.from({ length: 16 }, (_, i) => {
    const week = i + 1;
    let intensity = 0;
    // Lógica de curva S para intensidade de trabalho/investimento
    if (week <= 4) intensity = 20 + (week * 5); // Fase 1
    else if (week <= 8) intensity = 40 + ((week - 4) * 10); // Fase 2 (Aceleração)
    else if (week <= 12) intensity = 60 + ((week - 8) * 5); // Fase 3 (Testes)
    else intensity = 80 + ((week - 12) * 5); // Fase 4 (Launch)

    return {
      week,
      name: `Sem ${week}`,
      intensity,
      phaseId: PHASES.find(p => week >= p.startWeek && week <= p.endWeek)?.id || 4
    };
  }), [PHASES]);

  const handleMouseMove = (state: any) => {
    if (state.activePayload && state.activePayload.length > 0) {
      const payload = state.activePayload[0].payload;
      setActivePhaseId(payload.phaseId);
    }
  };

  const handleMouseLeave = () => {
    setActivePhaseId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Seção Superior: Gráfico e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            Cronograma de Intensidade Operacional
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={CHART_DATA}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} interval={1} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                  itemStyle={{ color: '#facc15' }}
                  formatter={(value: number) => [`${value}%`, 'Atividade']}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#facc15" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIntensity)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#fef08a' }}
                />
                {PHASES.map(p => (
                   <ReferenceLine key={p.id} x={`Sem ${p.endWeek}`} stroke="#334155" strokeDasharray="3 3" />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card de Destaque Dinâmico */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
           <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-yellow-400 mb-4">
             {activePhaseId ? PHASES.find(p => p.id === activePhaseId)?.icon : <Rocket className="w-8 h-8" />}
           </div>
           <h2 className="text-2xl font-bold text-slate-100">
             {activePhaseId ? PHASES.find(p => p.id === activePhaseId)?.title : "Plano de Implantação"}
           </h2>
           <p className="text-slate-400 mt-2 text-sm">
             {activePhaseId 
               ? PHASES.find(p => p.id === activePhaseId)?.description 
               : "Passe o mouse sobre o gráfico para visualizar os detalhes de cada etapa do lançamento em Franca."}
           </p>
        </div>
      </div>

      {/* Grid de Cards das Fases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PHASES.map((phase) => {
          const isActive = activePhaseId === phase.id;
          return (
            <div 
              key={phase.id}
              onMouseEnter={() => setActivePhaseId(phase.id)}
              onMouseLeave={() => setActivePhaseId(null)}
              className={`
                relative p-5 rounded-xl border transition-all duration-300 cursor-default
                ${isActive 
                  ? 'bg-slate-800 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.1)] scale-105 z-10' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-yellow-400/10 text-yellow-400' : 'bg-slate-800 text-slate-400'}`}>
                  {phase.icon}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  {phase.period}
                </span>
              </div>
              
              <h4 className={`font-bold mb-3 ${isActive ? 'text-yellow-400' : 'text-slate-200'}`}>
                {phase.title}
              </h4>
              
              <ul className="space-y-2.5">
                {phase.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <CheckCircle2 className={`w-3.5 h-3.5 min-w-[14px] mt-0.5 ${isActive ? 'text-yellow-400' : 'text-slate-600'}`} />
                    <span className={isActive ? 'text-slate-300' : ''}>{task}</span>
                  </li>
                ))}
              </ul>

              {/* Barra de Progresso Visual */}
              <div className="mt-5 h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 ease-out"
                  style={{ 
                    width: isActive ? '100%' : '30%', 
                    backgroundColor: isActive ? phase.color : '#334155',
                    opacity: isActive ? 1 : 0.5
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};