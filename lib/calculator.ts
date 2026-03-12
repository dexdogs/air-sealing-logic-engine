import { ProjectAssumptions, StrategyInput } from "../types";

export function calculateImpact(assumptions: ProjectAssumptions, strategies: StrategyInput[]) {
  const baselineCFM50 = (assumptions.baselineUnitCompartmentalization * assumptions.unitConditionedVolume) / 60;
  // Use the ciRatio directly from the Key Inputs panel
  const ciRatio = assumptions.ciRatio;
  
  const getVal = (strategy: StrategyInput, key: string) => strategy.inputs.find(i => i.key === key)?.value || 0;

  return strategies.map(strategy => {
    let cfmRemoved = 0;
    switch (strategy.type) {
      case "Linear":
        // (Length in ft * 12) * Width in in * Factor
        cfmRemoved = (getVal(strategy, 'length') * 12) * getVal(strategy, 'width') * assumptions.cfm50PerSqInch;
        break;
      case "OrificeArea":
        // Perimeter in ft * Width in in * Factor
        cfmRemoved = getVal(strategy, 'length') * getVal(strategy, 'width') * assumptions.cfm50PerSqInch;
        break;
      case "Void":
      case "RimJoist":
        cfmRemoved = baselineCFM50 * getVal(strategy, 'fraction');
        break;
      case "Stack":
        const velocity = Math.sqrt((2 * getVal(strategy, 'gravity') * getVal(strategy, 'height') * getVal(strategy, 'tempDiff')) / getVal(strategy, 'tAvg'));
        cfmRemoved = assumptions.dischargeCoefficient * getVal(strategy, 'area') * velocity * 60 * getVal(strategy, 'empiricalRatio');
        break;
      case "DuctBypass":
        cfmRemoved = getVal(strategy, 'boots') * getVal(strategy, 'areaPerBoot') * assumptions.cfm50PerSqInch;
        break;
    }

    const percentReduced = (cfmRemoved / baselineCFM50) * 100;
    const projectedC = ((baselineCFM50 - cfmRemoved) * 60) / assumptions.unitConditionedVolume;
    
    return {
      id: strategy.id,
      name: strategy.name,
      cfmRemoved: cfmRemoved.toFixed(2),
      cReduced: percentReduced.toFixed(2) + '%',
      projectedC: Math.max(0, projectedC).toFixed(2),
      projectedI: Math.max(0, projectedC * ciRatio).toFixed(2)
    };
  });
}
