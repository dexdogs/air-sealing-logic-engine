import { ProjectAssumptions, StrategyInput } from "../types";

export function calculateImpact(assumptions: ProjectAssumptions, strategies: StrategyInput[]) {
  const baselineCFM50 = (assumptions.baselineUnitCompartmentalization * assumptions.unitConditionedVolume) / 60;
  const ciRatio = assumptions.baselineWholeBuildingInfiltration / assumptions.baselineUnitCompartmentalization;
  
  const getVal = (strategy: StrategyInput, key: string) => strategy.inputs.find(i => i.key === key)?.value || 0;

  return strategies.map(strategy => {
    let cfmRemoved = 0;
    switch (strategy.type) {
      case "Linear":
        cfmRemoved = (getVal(strategy, 'length') * 12) * getVal(strategy, 'width') * assumptions.cfm50PerSqInch;
        break;
      case "Void":
      case "RimJoist":
        cfmRemoved = baselineCFM50 * getVal(strategy, 'fraction');
        break;
      case "Stack":
        const gravity = getVal(strategy, 'gravity');
        const height = getVal(strategy, 'height');
        const tempDiff = getVal(strategy, 'tempDiff');
        const tAvg = getVal(strategy, 'tAvg');
        const velocity = Math.sqrt((2 * gravity * height * tempDiff) / tAvg);
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
      projectedC: projectedC.toFixed(2),
      projectedI: (projectedC * ciRatio).toFixed(2)
    };
  });
}
