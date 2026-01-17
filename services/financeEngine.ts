
import { SimulationParams, ScenarioType, MonthlyResult, YearAudit } from '../types';
import { MONTH_NAMES, FRANCA_STATS } from '../constants';

export const calculateProjections = (
  params: SimulationParams,
  scenario: ScenarioType
): MonthlyResult[] => {
  const results: MonthlyResult[] = [];
  
  // Teto de usuários (curva S, teto especificado)
  const MAX_USERS_SCENARIO = 27398;
  
  // Capacidade máxima de frota por cenário (mantém variação por cenário)
  let driverCap = 2000;
  if (scenario === ScenarioType.PESSIMISTA) driverCap = 800;
  if (scenario === ScenarioType.OTIMISTA) driverCap = 3000;

  let currentDrivers = params.activeDrivers;
  // Base inicial de usuários começa em 0 para evitar números residuais ao zerar cenários
  let currentUsers = 0; 
  let accumulatedProfit = -params.initialInvestment;

  // Crescimento em S por faixas de meses
  const getStageGrowth = (monthNumber: number) => {
    if (monthNumber <= 6) return 0.07; // meses 1-6: 7%
    if (monthNumber <= 24) return 0.15; // meses 7-24: 15%
    return 0.04; // meses 25-36: 4%
  };

  for (let m = 0; m < 36; m++) {
    const year = 2026 + Math.floor(m / 12);
    const monthIndex = m % 12;

    if (!params.isMaintenanceActive) {
      results.push({
        month: m + 1,
        year,
        monthName: MONTH_NAMES[monthIndex],
        drivers: 0,
        users: 0,
        rides: 0,
        grossRevenue: 0,
        takeRateGross: 0,
        cashback: 0,
        takeRateRevenue: 0,
        taxes: 0,
        variableCosts: 0,
        fixedCosts: 0,
        marketing: 0,
        tech: 0,
        campaignCosts: 0,
        eliteDriversCost: 0,
        fidelidadePassageirosCost: 0,
        reservaOperacionalCost: 0,
        ebitda: 0,
        netProfit: 0,
        accumulatedProfit: -params.initialInvestment,
        margin: 0,
        contributionMargin: 0,
        cac: 0,
        ltv: 0,
        grossPerDriver: 0,
        netPerDriver: 0,
        ridesPerDriver: 0,
        ridesPerDriverDay: 0,
        supplyCapacity: 0,
        demandedRides: 0,
        isSupplyBottleneck: false,
        demandGap: 0,
        newUsersAdded: 0
      });
      continue;
    }

    // --- Cálculos principais ---
    const previousUsers = currentUsers;
    const stageGrowth = getStageGrowth(m + 1);
    const saturationFactor = Math.max(0, 1 - (currentUsers / MAX_USERS_SCENARIO));
    const effectiveGrowthRate = stageGrowth * saturationFactor;
    currentUsers = (currentDrivers > 0 && (params.ridesPerUserMonth ?? 0) > 0)
      ? Math.min(MAX_USERS_SCENARIO, currentUsers * (1 + effectiveGrowthRate))
      : 0;
    const newUsersAdded = Math.max(0, currentUsers - previousUsers);
    const userChurnRate = (params.churnRate || 2) / 100;

    // Frota
    currentDrivers = Math.min(driverCap, currentDrivers + (params.driverAdditionMonthly || 0));

    // Demanda e sazonalidade
    const MPD = 10.1, workingDaysPerMonth = 30.5;
    const ridesPerUserMonth = params.ridesPerUserMonth ?? 4.2;
    let demandedRides = currentUsers * ridesPerUserMonth;
    if (monthIndex === 0 || monthIndex === 6) demandedRides *= 0.85;
    else if (monthIndex === 11) demandedRides *= 1.20;

    // Capacidade
    const supplyCapacity = currentDrivers * MPD * workingDaysPerMonth;
    const actualRides = Math.min(demandedRides, supplyCapacity);
    const isSupplyBottleneck = demandedRides > supplyCapacity;
    const demandGap = isSupplyBottleneck ? demandedRides - supplyCapacity : 0;
    const ridesPM = currentDrivers > 0 ? actualRides / currentDrivers : 0;

    // Receita e custos
    const avgRidesPerDriver = ridesPM;
    let takeRateEfetivo = 15;
    if (avgRidesPerDriver >= 450) takeRateEfetivo = 10;
    else if (avgRidesPerDriver >= 300) takeRateEfetivo = 12;
    const grossRevenue = actualRides * params.avgFare;
    const takeRateGross = grossRevenue * 0.15;
    const takeRateRevenue = grossRevenue * (takeRateEfetivo / 100);
    const cashback = takeRateGross - takeRateRevenue;
    const taxes = takeRateGross * 0.112;
    const campaignSpend = (params.adesaoTurbo || 0) + (params.trafegoPago || 0) + (params.parceriasBares || 0) + (params.indiqueGanhe || 0) + (params.mktMensalOff || 0);
    const totalMarketing = (params.marketingMonthly || 0) + campaignSpend;
    const totalTech = actualRides * 0.15;
    const variableCosts = (actualRides * 0.40) + (grossRevenue * 0.02);
    const currentFixedCosts = (params.fixedCosts || 0) + (params.custoComercialMkt || 0);
    const eliteDriversCost = (m > 0 && (m + 1) % 6 === 0) ? (params.eliteDriversSemestral || 0) : 0;
    const fidelidadePassageirosCost = (m > 0 && (m + 1) % 12 === 0) ? (params.fidelidadePassageirosAnual || 0) : 0;
    const ebitdaPrelim = takeRateRevenue - taxes - variableCosts - currentFixedCosts - totalTech - totalMarketing - eliteDriversCost - fidelidadePassageirosCost;
    let reservaOperacionalCost = 0;
    if (params.reservaOperacionalGMV > 0 && ebitdaPrelim > 0) reservaOperacionalCost = ebitdaPrelim * (params.reservaOperacionalGMV / 100);
    const totalFidelityCosts = eliteDriversCost + fidelidadePassageirosCost + reservaOperacionalCost;
    const ebitda = takeRateRevenue - taxes - variableCosts - currentFixedCosts - totalTech - totalMarketing - totalFidelityCosts;
    const netProfit = ebitda;
    accumulatedProfit += netProfit;
    const contributionMarginVal = takeRateRevenue - taxes - variableCosts;
    const avgMarginPerUser = currentUsers > 0 ? contributionMarginVal / currentUsers : 0;
    const ltv = userChurnRate > 0 ? avgMarginPerUser / userChurnRate : 0;
    const grossNewUsersForCAC = Math.max(newUsersAdded, 0.1);
    const cac = grossNewUsersForCAC > 0 ? totalMarketing / grossNewUsersForCAC : 0;

    results.push({
      month: m + 1,
      year,
      monthName: MONTH_NAMES[monthIndex],
      drivers: Math.round(currentDrivers),
      users: Math.round(currentUsers),
      rides: Math.round(actualRides),
      grossRevenue,
      takeRateGross,
      cashback,
      takeRateRevenue,
      taxes,
      variableCosts,
      fixedCosts: currentFixedCosts,
      marketing: totalMarketing,
      tech: totalTech,
      campaignCosts: 0,
      eliteDriversCost,
      fidelidadePassageirosCost,
      reservaOperacionalCost,
      ebitda,
      netProfit,
      accumulatedProfit,
      margin: takeRateRevenue > 0 ? (netProfit / takeRateRevenue) * 100 : 0,
      contributionMargin: takeRateRevenue > 0 ? (contributionMarginVal / takeRateRevenue) * 100 : 0,
      cac,
      ltv,
      grossPerDriver: currentDrivers > 0 ? grossRevenue / currentDrivers : 0,
      netPerDriver: currentDrivers > 0 ? (grossRevenue - takeRateRevenue) / currentDrivers : 0,
      ridesPerDriver: ridesPM,
      ridesPerDriverDay: ridesPM / 30,
      supplyCapacity,
      demandedRides,
      isSupplyBottleneck,
      demandGap,
      newUsersAdded
    });
  }

  return results;
};

export const auditYears = (results: MonthlyResult[]): YearAudit[] => {
  const audits: YearAudit[] = [];
  const years = [...new Set(results.map(r => r.year))];
  
  years.forEach((y, i) => {
    const data = results.filter(r => r.year === y);
    if (data.length === 0) return;
    
    const totalGMV = data.reduce((a, b) => a + b.grossRevenue, 0);
    const totalRev = data.reduce((a, b) => a + b.takeRateRevenue, 0);
    const totalCashback = data.reduce((a, b) => a + b.cashback, 0);
    const totalProfit = data.reduce((a, b) => a + b.netProfit, 0);
    const totalEbitda = data.reduce((a, b) => a + b.ebitda, 0);
    const totalRides = data.reduce((a, b) => a + b.rides, 0);
    
    const totalOpCosts = data.reduce((a, b) => a + b.marketing + b.tech + b.variableCosts, 0);
    const endUsers = data[data.length - 1].users;
    const endDrivers = data[data.length - 1].drivers;
    const avgMonthlyRides = totalRides / data.length;
    
    audits.push({
      year: y,
      totalGMV,
      totalRevenue: totalRev,
      totalCashback,
      totalNetProfit: totalProfit,
      totalEbitda,
      totalRides,
      avgMonthlyProfit: totalProfit / data.length,
      avgRidesPerDriverDay: data.reduce((a, b) => a + b.ridesPerDriverDay, 0) / data.length,
      growthFromPrev: i === 0 ? 0 : (audits[i-1] && audits[i-1].totalRevenue > 0 ? ((totalRev - audits[i-1].totalRevenue) / audits[i-1].totalRevenue) * 100 : 0),
      bestMonth: [...data].sort((a,b) => b.netProfit - a.netProfit)[0].monthName,
      worstMonth: [...data].sort((a,b) => a.netProfit - b.netProfit)[0].monthName,
      endUsers,
      endDrivers,
      avgMonthlyRides,
      totalOpCosts
    });
  });
  return audits;
};
