# TKX Franca - Dashboard de Viabilidade Financeira

## Arquitetura do Projeto

**Stack principal**: React 19 + Vite + TypeScript + Recharts (visualizações)

**Fluxo de dados centralizado**:
1. [hooks/useViability.ts](hooks/useViability.ts) - Hook canônico que gerencia estado (`paramsMap`, `scenario`) e persiste em `localStorage`
2. [services/financeEngine.ts](services/financeEngine.ts) - Motor de cálculo: `calculateProjections(params, scenario)` retorna 36 meses de projeções; `auditYears(results)` agrega dados anuais
3. [App.tsx](App.tsx) - Orquestra visualizações via tabs; importa `./hooks/useViability`
4. [components/Layout.tsx](components/Layout.tsx) - Sistema de 15 tabs (id 0-14); controla navegação via prop `activeTab: number`

**Sistema de tipos rigoroso**:
- [types.ts](types.ts): `SimulationParams` (40+ campos incluindo campanhas, churn, take rate), `MonthlyResult`, `ScenarioType` (REALISTA/PESSIMISTA/OTIMISTA)
- [constants.ts](constants.ts): `INITIAL_PARAMS`, `STORAGE_KEY = 'tkx_simulation_params'`, `FRANCA_STATS` (dados de mercado)

## Workflows Críticos

**Desenvolvimento**:
```bash
npm install           # Instala React 19, recharts, lucide-react, xlsx
npm run dev           # Vite dev server na porta 3000 (host 0.0.0.0)
npm run typecheck     # Valida tipos sem build
npm run build         # Gera dist/ para produção
npm run preview       # Preview do build na porta 4173
```

**Testes E2E**:
```bash
npm run test:e2e:install  # Instala Playwright + deps
npm run test:e2e          # Roda specs em e2e/ (baseURL: http://localhost:4173)
```

## Padrões de Código Específicos

**1. Estado multi-cenário**: `useViability` mantém `paramsMap: Record<ScenarioType, SimulationParams>` para alternar entre cenários sem perder parâmetros. Exemplo:
```typescript
const currentParams = useMemo(() => paramsMap[scenario], [paramsMap, scenario]);
const projections = useMemo(() => calculateProjections(currentParams, scenario), [currentParams, scenario]);
```

**2. Persistência automática**: `useViability` sincroniza `paramsMap` com `localStorage` via `useEffect`. Use sempre `STORAGE_KEY` importado de [constants.ts](constants.ts).

**3. Snapshots versionados**: [hooks/useSnapshots.ts](hooks/useSnapshots.ts) gerencia até 10 snapshots com `id`, `name`, `description`, `timestamp`, `paramsMap`. Salvos em `tkx_snapshots`.

**4. Formatação monetária**: Componentes usam helpers `formatCurrency`, `formatNumber`, `formatPercent` com padrão `pt-BR`. Exemplo em [App.tsx](App.tsx#L29-L35).

**5. Sazonalidade no motor**: [financeEngine.ts](services/financeEngine.ts#L90-L95) aplica -15% (Jan/Jul) e +20% (Dez) na demanda. Crescimento em curva S controlado por `getStageGrowth(month)`.

## Pontos de Integração

**Charts**: Recharts configurado com tema escuro (`DarkTooltip`, `NeutralLegend` em [ChartUI.tsx](components/ChartUI.tsx)). Grid `stroke="rgba(148,163,184,0.1)"`, cores Yellow-300 para destaque.

**Exportação**: [App.tsx](App.tsx) possui callbacks `onExportExcel` usando `xlsx` lib. Gera sheets com DRE, KPIs, auditorias.

**Comparação de Cenários**: [ComparisonTab.tsx](components/ComparisonTab.tsx) e [TrendAnalysisTab.tsx](components/TrendAnalysisTab.tsx) consomem snapshots para análises side-by-side.

## Regras de Modificação

**Alterando regras de negócio**:
1. Edite [financeEngine.ts](services/financeEngine.ts) - toda lógica de GMV, cashback, take rate, custos está aqui
2. Se mudar assinatura de tipos, atualize [types.ts](types.ts) PRIMEIRO
3. Rode `npm run typecheck` antes de testar no browser
4. Valide resultados em aba "DRE" (tab 7) e "KPIs" (tab 8)

**Adicionando novos parâmetros**:
1. Declare em `SimulationParams` ([types.ts](types.ts#L8))
2. Adicione valor default em `INITIAL_PARAMS` ([constants.ts](constants.ts#L18))
3. Replique nos 3 cenários em `DEFAULT_VALUES` ([useViability.ts](hooks/useViability.ts#L13))
4. Implemente lógica no loop de 36 meses ([financeEngine.ts](services/financeEngine.ts#L28))

**Criando nova aba**:
1. Adicione objeto `{ id: N, label: 'NOME', icon: <Icon /> }` em [Layout.tsx](components/Layout.tsx#L13)
2. Adicione case em switch/render de [App.tsx](App.tsx)
3. Mantenha id sequencial (atual: 0-14)

## Debugging & Inspeção

- **localStorage**: Abra DevTools → Application → Local Storage → `tkx_simulation_params`, `tkx_snapshots`
- **Props drilling**: [App.tsx](App.tsx) passa `results`, `audits`, `params` para componentes filhos - trace aqui primeiro
- **Motor financeiro**: Para debug de cálculos, adicione `console.log` no loop de [financeEngine.ts](services/financeEngine.ts#L28-L150)
- **Performance**: `useMemo` em [useViability.ts](hooks/useViability.ts#L82-L85) evita recalcs - não remova sem profiling

## Atenção: Inconsistência Conhecida

**NÃO EXISTE** `useViability.ts` na raiz (busca confirma apenas [hooks/useViability.ts](hooks/useViability.ts)). Se encontrar referências a `./useViability` direto, é erro - import correto é `./hooks/useViability`.

## Dados de Negócio

- **Mercado**: Franca-SP, 355k hab, SAM 182k usuários digitais ([constants.ts](constants.ts#L3))
- **Competidores**: Uber (50%), 99 (20%), Maxim (18%), outros menores ([constants.ts](constants.ts#L8))
- **Meta TKX**: 15% market share, 27.4k usuários (SOM target)
- **Modelo de receita**: Take rate 15% fixo na fonte, cashback para motoristas, MPD (média produtividade diária) de 10.1 corridas/dia
