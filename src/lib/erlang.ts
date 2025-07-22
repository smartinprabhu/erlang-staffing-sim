// Erlang-C and related mathematical functions
// JavaScript implementation of Excel VBA functions from SMORT.xlsm

/**
 * Calculates the factorial of a number with overflow protection
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  if (n > 170) return Infinity; // JavaScript number limit
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Calculates power with overflow protection
 */
function safePower(base: number, exponent: number): number {
  if (exponent === 0) return 1;
  if (base === 0) return 0;
  if (exponent > 700) return Infinity; // Prevent overflow
  return Math.pow(base, exponent);
}

/**
 * Calculates Erlang B (blocking probability) - Excel VBA compatible
 * @param traffic - Traffic intensity (Erlangs)
 * @param agents - Number of agents
 * @returns Blocking probability
 */
export function erlangB(traffic: number, agents: number): number {
  if (traffic <= 0 || agents <= 0) return 0;
  if (agents > 170) return 0; // Prevent overflow
  
  // Use iterative method to prevent overflow (Excel VBA approach)
  let erlangB = 1;
  for (let i = 1; i <= agents; i++) {
    erlangB = (traffic * erlangB) / (i + traffic * erlangB);
  }
  
  return erlangB;
}

/**
 * Calculates Erlang C (queuing probability) - Excel VBA compatible
 * @param traffic - Traffic intensity (Erlangs)
 * @param agents - Number of agents
 * @returns Queuing probability
 */
export function erlangC(traffic: number, agents: number): number {
  if (traffic <= 0 || agents <= 0) return 1;
  if (agents <= traffic) return 1; // Unstable system
  
  const rho = traffic / agents;
  const erlangBValue = erlangB(traffic, agents);
  
  // Excel VBA formula: ErlangC = ErlangB / (1 - rho + rho * ErlangB)
  return erlangBValue / (1 - rho + rho * erlangBValue);
}

/**
 * Calculates the number of agents required to meet SLA
 * @param slaTarget - SLA target (e.g., 0.8 for 80%)
 * @param serviceTime - Service time threshold in seconds
 * @param traffic - Traffic intensity
 * @param aht - Average Handle Time in seconds
 * @returns Required number of agents
 */
export function calculateAgents(slaTarget: number, serviceTime: number, traffic: number, aht: number): number {
  if (traffic <= 0 || aht <= 0) return 0;
  
  const trafficIntensity = traffic * (aht / 3600); // Convert to Erlangs
  let agents = Math.ceil(trafficIntensity);
  
  // Iterate to find minimum agents to meet SLA
  for (let n = agents; n <= agents + 50; n++) {
    const sla = calculateSLA(traffic, aht, serviceTime, n);
    if (sla >= slaTarget) {
      return n;
    }
  }
  
  return agents;
}

/**
 * Calculates Service Level Achievement - Excel VBA SLA function
 * @param volume - Call volume for the interval
 * @param aht - Average Handle Time in seconds
 * @param serviceTime - Service time threshold in seconds
 * @param agents - Number of agents
 * @returns Service level percentage (0-1)
 */
export function calculateSLA(volume: number, aht: number, serviceTime: number, agents: number): number {
  if (volume <= 0 || aht <= 0 || agents <= 0) return 1;
  
  // Convert to Erlangs: Traffic Intensity = Volume * AHT / 3600
  const trafficIntensity = (volume * aht) / 3600;
  
  if (agents <= trafficIntensity) return 0; // Unstable system
  
  // Excel VBA SLA formula
  const erlangCValue = erlangC(trafficIntensity, agents);
  const rho = trafficIntensity / agents;
  
  // Service time in hours
  const serviceTimeHours = serviceTime / 3600;
  
  // Excel formula: SLA = 1 - (ErlangC * EXP(-agents * (1 - rho) * serviceTime / AHT))
  const avgServiceTime = aht / 3600; // AHT in hours
  const waitingProb = erlangCValue * Math.exp(-agents * (1 - rho) * serviceTimeHours / avgServiceTime);
  
  return Math.max(0, Math.min(1, 1 - waitingProb));
}

/**
 * Calculates agent utilization (occupancy)
 * @param traffic - Traffic intensity (calls per interval)
 * @param aht - Average Handle Time in seconds
 * @param agents - Number of agents
 * @returns Utilization percentage (0-1)
 */
export function calculateUtilization(traffic: number, aht: number, agents: number): number {
  if (traffic <= 0 || aht <= 0 || agents <= 0) return 0;
  
  const trafficIntensity = traffic * (aht / 3600); // Convert to Erlangs
  return Math.min(1, trafficIntensity / agents);
}

/**
 * Calculates effective volume after applying shrinkage factors
 * @param volume - Raw volume
 * @param outOfOfficeShrinkage - Out of office shrinkage percentage
 * @param inOfficeShrinkage - In office shrinkage percentage
 * @param billableBreak - Billable break percentage
 * @returns Effective volume
 */
export function calculateEffectiveVolume(
  volume: number,
  outOfOfficeShrinkage: number,
  inOfficeShrinkage: number,
  billableBreak: number
): number {
  // Formula from Excel: ((Volume * (1 - OutOfOffice)) * (1 - InOffice)) * (1 - BillableBreak)
  return volume * (1 - outOfOfficeShrinkage / 100) * (1 - inOfficeShrinkage / 100) * (1 - billableBreak / 100);
}

/**
 * Calculates staff hours required
 * @param volume - Call volume
 * @param aht - Average Handle Time in seconds
 * @returns Staff hours required
 */
export function calculateStaffHours(volume: number, aht: number): number {
  return (volume * aht) / 3600; // Convert seconds to hours
}

/**
 * Calculates agent work hours per interval considering shrinkage
 * @param intervalHours - Interval duration in hours (e.g., 0.5 for 30 minutes)
 * @param outOfOfficeShrinkage - Out of office shrinkage percentage
 * @param inOfficeShrinkage - In office shrinkage percentage
 * @param billableBreak - Billable break percentage
 * @returns Agent work hours per interval
 */
export function calculateAgentWorkHours(
  intervalHours: number,
  outOfOfficeShrinkage: number,
  inOfficeShrinkage: number,
  billableBreak: number
): number {
  return intervalHours * (1 - (outOfOfficeShrinkage + inOfficeShrinkage + billableBreak) / 100);
}

/**
 * Calculates required agents using exact Excel formula
 * @param volume - Call volume
 * @param aht - Average Handle Time in seconds
 * @param outOfOfficeShrinkage - Out of office shrinkage percentage
 * @param inOfficeShrinkage - In office shrinkage percentage
 * @param billableBreak - Billable break percentage
 * @returns Required number of agents
 */
export function calculateRequiredAgents(
  volume: number,
  aht: number,
  outOfOfficeShrinkage: number,
  inOfficeShrinkage: number,
  billableBreak: number
): number {
  if (volume <= 0 || aht <= 0) return 0;
  
  const staffHours = calculateStaffHours(volume, aht);
  const agentWorkHours = calculateAgentWorkHours(0.5, outOfOfficeShrinkage, inOfficeShrinkage, billableBreak);
  
  return staffHours / agentWorkHours;
}

/**
 * Calculates variance between actual and required agents
 * @param actualAgents - Actual number of agents scheduled
 * @param requiredAgents - Required number of agents
 * @returns Variance (positive = overstaffed, negative = understaffed)
 */
export function calculateVariance(actualAgents: number, requiredAgents: number): number {
  return actualAgents - requiredAgents;
}

/**
 * Calculates occupancy percentage
 * @param volume - Call volume
 * @param aht - Average Handle Time in seconds
 * @param agents - Number of agents
 * @param intervalHours - Interval duration in hours
 * @returns Occupancy percentage (0-100)
 */
export function calculateOccupancy(
  volume: number,
  aht: number,
  agents: number,
  intervalHours: number
): number {
  if (agents <= 0 || intervalHours <= 0) return 0;
  
  const totalCallTime = (volume * aht) / 3600; // Convert to hours
  const totalAvailableTime = agents * intervalHours;
  
  return Math.min(100, (totalCallTime / totalAvailableTime) * 100);
}

/**
 * Calculates influx (calls per hour)
 * @param volume - Call volume for the interval
 * @param intervalHours - Interval duration in hours
 * @returns Calls per hour
 */
export function calculateInflux(volume: number, intervalHours: number): number {
  return volume / intervalHours;
}

/**
 * Calculates agent distribution ratio
 * @param agentsInInterval - Number of agents in this interval
 * @param totalAgents - Total number of agents across all intervals
 * @returns Distribution ratio as percentage
 */
export function calculateAgentDistributionRatio(agentsInInterval: number, totalAgents: number): number {
  if (totalAgents <= 0) return 0;
  return (agentsInInterval / totalAgents) * 100;
}

/**
 * Excel SMORT: Calculates the number of agents required using Erlang-C
 * @param slaTarget - SLA target (0.8 for 80%)
 * @param serviceTime - Service time threshold in seconds
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param aht - Average Handle Time in seconds
 * @returns Required number of agents
 */
export function erlangAgents(slaTarget: number, serviceTime: number, trafficIntensity: number, aht: number): number {
  if (trafficIntensity <= 0 || aht <= 0) return 0;
  
  // Start with minimum agents (traffic intensity rounded up)
  let agents = Math.ceil(trafficIntensity);
  
  // Excel VBA approach: iterate until SLA is met
  for (let n = agents; n <= agents + 100; n++) {
    const sla = calculateSLA(trafficIntensity * 3600 / aht, aht, serviceTime, n);
    if (sla >= slaTarget) {
      return n;
    }
  }
  
  return agents;
}

/**
 * Excel SMORT: Calculates utilization/occupancy
 * @param trafficIntensity - Traffic intensity in Erlangs
 * @param agents - Number of agents
 * @returns Utilization percentage (0-1)
 */
export function erlangUtilization(trafficIntensity: number, agents: number): number {
  if (agents <= 0 || trafficIntensity <= 0) return 0;
  return Math.min(1, trafficIntensity / agents);
}

/**
 * Excel SMORT: Calculates Call Trend (volume vs forecast comparison)
 * @param actualVolume - Actual call volume
 * @param forecastVolume - Forecasted call volume
 * @returns Call trend percentage
 */
export function calculateCallTrend(actualVolume: number, forecastVolume: number): number {
  if (forecastVolume <= 0) return 100;
  return (actualVolume / forecastVolume) * 100;
}