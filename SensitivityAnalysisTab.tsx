import React, { useState, useMemo } from 'react';
import { SimulationParams, ScenarioType } from './types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, LabelList
} from 'recharts';
import { Sliders, TrendingUp, AlertTriangle, Activity, DollarSign, Users, Tornado } from 'lucide-react';

interface SensitivityAnalysisTabProps {
  currentParams: SimulationParams;
  calculateProjections: (params: SimulationParams, scenario: ScenarioType) => any[];
  currentScenario: ScenarioType;
}

export const SensitivityAnalysisTab: React.FC<SensitivityAnalysisTabProps> = ({ currentParams, calculateProjections, currentScenario }) => {
  const [demandDelta, setDemandDelta] = useState(0);
  const [ticketDelta, setTicketDelta] = useState(0);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  // 1. Simulação em Tempo Real (Sliders)
  const simulationResults = useMemo(() => {
    const simulatedParams = { ...currentParams };
    
    // Aplica variações
    simulatedParams.avgFare = currentParams.avgFare * (1 + ticketDelta / 100);
    simulatedParams.ridesPerUserMonth = currentParams.ridesPerUserMonth * (1 + demandDelta / 100);
    
    const projections = calculateProjections(simulatedParams, currentScenario);
    const totalProfit = projections.reduce((acc, m) => acc + m.netProfit, 0);
    const totalRevenue = projections.reduce((acc, m) => acc + m.grossRevenue, 0);
    const paybackIdx = projections.findIndex(p => p.accumulatedProfit > 0);
    
    return {
      totalProfit,
      totalRevenue,
      payback: paybackIdx !== -1 ? `Mês ${paybackIdx + 1}` : '> 36 meses',
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  }, [currentParams, calculateProjections, currentScenario, demandDelta, ticketDelta]);

  // 2. Análise de Tornado (Impacto de Variáveis)
  const tornadoData = useMemo(() => {
    const baseProjections = calculateProjections(currentParams, currentScenario);
    const baseProfit = baseProjections.reduce((acc, m) => acc + m.netProfit, 0);
    
    const variables = [
      { id: 'avgFare', label: 'Ticket Médio' },
      { id: 'ridesPerUserMonth', label: 'Demanda (Freq.)' },
      { id: 'activeDrivers', label: 'Frota Disponível' },
      { id: 'marketingMonthly', label: 'Investimento MKT' },
      { id: 'fixedCosts', label: 'Custos Fixos' }
    ];

    const data = variables.map(v => {
      // Cenário Baixo (-20%)
      const paramsLow = { ...currentParams };
      (paramsLow as any)[v.id] = (currentParams as any)[v.id] * 0.8;
      const projLow = calculateProjections(paramsLow, currentScenario);
      const profitLow = projLow.reduce((acc, m) => acc + m.netProfit, 0);

      // Cenário Alto (+20%)
      const paramsHigh = { ...currentParams };
      (paramsHigh as any)[v.id] = (currentParams as any)[v.id] * 1.2;
      const projHigh = calculateProjections(paramsHigh, currentScenario);
      const profitHigh = projHigh.reduce((acc, m) => acc + m.netProfit, 0);

      return {
        name: v.label,
        low: profitLow,
        high: profitHigh,
        range: Math.abs(profitHigh - profitLow),
        min: Math.min(profitLow, profitHigh),
        max: Math.max(profitLow, profitHigh),
        base: baseProfit
      };
    });

    // Ordenar pelo maior impacto (range)
    return data.sort((a, b) => b.range - a.range);
  }, [currentParams, calculateProjections, currentScenario]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Seção 1: Simulação Interativa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Ajuste Fino</h3>
          </div>

          <div className="space-y-8">
            <div>
              <div className="flex justify-between text-xs uppercase font-bold text-slate-400 mb-2">
                <span>Variação de Demanda</span>
                <span className={demandDelta > 0 ? 'text-green-400' : demandDelta < 0 ? 'text-red-400' : 'text-slate-200'}>
                  {demandDelta > 0 ? '+' : ''}{demandDelta}%
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={demandDelta}
                onChange={(e) => setDemandDelta(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>-20%</span>
                <span>0%</span>
                <span>+20%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs uppercase font-bold text-slate-400 mb-2">
                <span>Variação de Ticket Médio</span>
                <span className={ticketDelta > 0 ? 'text-green-400' : ticketDelta < 0 ? 'text-red-400' : 'text-slate-200'}>
                  {ticketDelta > 0 ? '+' : ''}{ticketDelta}%
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={20}
                step={1}
                value={ticketDelta}
                onChange={(e) => setTicketDelta(Number(e.target.value))}
                className="w-full accent-yellow-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>-20%</span>
                <span>0%</span>
                <span>+20%</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase mb-3">Impacto no Resultado (36m)</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Lucro Líquido</span>
                <span className={`text-lg font-black ${simulationResults.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(simulationResults.totalProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Payback</span>
                <span className="text-sm font-mono text-yellow-400">{simulationResults.payback}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 2: Gráfico de Tornado */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Tornado className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Gráfico de Tornado (Sensibilidade)</h3>
              <p className="text-xs text-slate-400">Impacto no Lucro Acumulado (36m) ao variar cada premissa em +/- 20%</p>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={tornadoData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `R$${val/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                          <div className="font-bold text-slate-100 mb-2">{data.name}</div>
                          <div className="text-red-400">Min (-20%): {formatCurrency(data.low)}</div>
                          <div className="text-green-400">Max (+20%): {formatCurrency(data.high)}</div>
                          <div className="text-slate-400 mt-1 pt-1 border-t border-slate-700">Impacto: {formatCurrency(data.range)}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={tornadoData[0]?.base} stroke="#fbbf24" strokeDasharray="3 3" label={{ value: 'Base', position: 'top', fill: '#fbbf24', fontSize: 10 }} />
                <Bar dataKey="min" stackId="a" fill="transparent" />
                <Bar dataKey="range" stackId="a" radius={[4, 4, 4, 4]}>
                  {tornadoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.high > entry.low ? '#3b82f6' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};