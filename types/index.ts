export interface ProjectAssumptions {
  unitConditionedVolume: number;
  baselineUnitCompartmentalization: number;
  baselineC_CFM50: number;
  targetC_ACH50: number;
  baselineWholeBuildingInfiltration: number;
  targetI_ACH50: number;
  ciRatio: number;
  airDensity: number;
  dischargeCoefficient: number;
  cfm50PerSqInch: number;
}

export interface StrategyInputField {
  key: string;
  label: string;
  value: number;
  unitLabel: string;
  note: string;
}

export interface StrategyInput {
  id: string;
  name: string;
  type: "Linear" | "Void" | "Stack" | "DuctBypass" | "RimJoist";
  inputs: StrategyInputField[];
  equationName: string;
  equationDesc: string;
  description: string;
  sourceText: string;
  sourceUrl: string;
}
