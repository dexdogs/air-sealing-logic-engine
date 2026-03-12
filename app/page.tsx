"use client";
import { useState } from "react";
import { calculateImpact } from "../lib/calculator";
import { ProjectAssumptions, StrategyInput } from "../types";

const defaultAssumptions: ProjectAssumptions = {
  unitConditionedVolume: 12360, baselineUnitCompartmentalization: 3.565, baselineC_CFM50: 734.39,
  targetC_ACH50: 1.8, baselineWholeBuildingInfiltration: 1.21, targetI_ACH50: 0.95,
  ciRatio: 0.50, airDensity: 0.075, dischargeCoefficient: 0.6, cfm50PerSqInch: 18
};

const assumptionLabels: Record<keyof ProjectAssumptions, { label: string; note: string }> = {
  unitConditionedVolume: { label: "Unit Conditioned Volume", note: "Conditioned volume per unit from L x W x H" },
  baselineUnitCompartmentalization: { label: "Baseline Unit Compartmentalization (ACH50)", note: "Starting unit compartmentalization from HERS model or initial Blower Door test" },
  baselineC_CFM50: { label: "Baseline Unit Compartmentalization (CFM50)", note: "Starting unit compartmentalization in CFM50" },
  targetC_ACH50: { label: "Target Unit Compartmentalization (ACH50)", note: "Design target for unit compartmentalization from HERS model or code limit" },
  baselineWholeBuildingInfiltration: { label: "Baseline Whole-Building Infiltration (ACH50)", note: "Starting whole-building infiltration or initial Blower Door test" },
  targetI_ACH50: { label: "Target Whole-Building Infiltration (ACH50)", note: "Design target for whole-building infiltration from HERS model or code limit" },
  ciRatio: { label: "Unit Compartmentalization : Whole-Building Infiltration Ratio", note: "Infiltration as fraction of Compartmentalization, derived from baseline values (building science assumes 50/50)" },
  airDensity: { label: "Air Density", note: "Standard air density at sea level (standard)" },
  dischargeCoefficient: { label: "Discharge Coefficient", note: "Default crack or orifice discharge coefficient (literature)" },
  cfm50PerSqInch: { label: "CFM50 per sq inch of Effective Leakage area", note: "1 sq inch Effective Leakage area = 18 CFM50 (this is a constant, widely used in US building science tools including LBNL's infiltration calculators literature. Sources: Sherman & Grimsrud (1980), ASHRAE Handbook of Fundamentals, Chapter 27, ASTM E779)" }
};

const lockedAssumptionKeys = ['ciRatio', 'airDensity', 'dischargeCoefficient', 'cfm50PerSqInch'];

const initialStrategies: StrategyInput[] = [
  { 
    id: "AS-01", name: "Seal box beams to sleepers", type: "Linear",
    inputs: [
      { key: "length", label: "Sealed length of sill plate in ft", value: 5, unitLabel: "ft", note: "Represents the effective unsealed crack length so I am assuming only a small fraction of the sill plate perimeter has actual unsealed gaps large enough to matter. Assuming that most of the perimeter may already be reasonably tight from construction and only a few feet have meaningful crack width. Iow sealing 5 linear feet of crack at 0.1\" width removes enough leakage to bring C from 3.565 down to X" },
      { key: "width", label: "Crack width in inches", value: 0.1, unitLabel: "in", note: "Modeled number. Need actual measurements" }
    ],
    equationName: "Linear Leakage", equationDesc: "(Length in ft x 12) x (Crack width in inches) x (CFM50 per sq inch)",
    description: "Sill plates are the longest continuous junction in the shell. By sealing this line, you are neutralizing hundreds of feet of potential leakage in one shot.",
    sourceText: "PNNL: Sealing Sill Plates", sourceUrl: "https://basc.pnnl.gov/resource-guides/air-sealing-sill-plates"
  },
  { 
    id: "AS-02", name: "Foam mating wall gaps", type: "Void",
    inputs: [{ key: "fraction", label: "Fraction of that leakage attributable to the void being sealed", value: 0.495, unitLabel: "fraction", note: "PNNL: ~50% of unit leakage in mating wall" }],
    equationName: "Void Fraction", equationDesc: "(Baseline CFM50) x (Fraction of leakage attributable to void)",
    description: "Voids between modules act as unconditioned zones so sealing them will eliminate the highest shared air situation.",
    sourceText: "BSC: Sealing the Right Walls", sourceUrl: "https://buildingscience.com/documents/building-science-insights-newsletters/bsi-108-are-we-sealing-right-walls-buildings"
  },
  { 
    id: "AS-03", name: "Seal mechanical chases", type: "Stack",
    inputs: [
      { key: "area", label: "chase cross-section area of the unsealed gap/crack", value: 0.069, unitLabel: "sq ft", note: "I assumed 10 sq inch that's a roughly 3\" × 3.3\" opening" },
      { key: "height", label: "floor height driving the stack", value: 9, unitLabel: "ft", note: "This is post intervention effective height that is sealing chases at top and bottom of every floor level (isolate each floor)" },
      { key: "tempDiff", label: "temperature difference between inside and outside", value: 30, unitLabel: "F", note: "Constant" },
      { key: "empiricalRatio", label: "CFM50 per CFM natural empirical ratio", value: 20, unitLabel: "ratio", note: "Constant specific to stack-driven leakage in multifamily buildings" },
      { key: "tAvg", label: "T_avg", value: 527, unitLabel: "R", note: "average absolute temperature in Rankline" },
      { key: "gravity", label: "gravitational acceleration in ft per sq sec", value: 32.2, unitLabel: "ft/s²", note: "Constant" }
    ],
    equationName: "Stack Effect", equationDesc: "(Cd) x (Area in sq ft) x (Buoyancy velocity) x 60 x 20",
    description: "Height drives the straw effect as noted in the report.",
    sourceText: "BSC: Sealing Penetrations", sourceUrl: "https://www1.eere.energy.gov/buildings/publications/pdfs/building_america/sealing_penetrations.pdf"
  },
  { 
    id: "AS-04", name: "Stairwell drywall strip & sealant", type: "Linear",
    inputs: [
      { key: "length", label: "Sealed perimeter in ft", value: 150, unitLabel: "ft", note: "Modeled number. Need actual measurements" },
      { key: "width", label: "gap width in inches", value: 0.125, unitLabel: "in", note: "Modeled number. Need actual measurements" }
    ],
    equationName: "Linear Leakage", equationDesc: "(Perimeter in ft x 12) x (Gap width in inches) x (CFM50 per sq inch)",
    description: "Bridges the RC gap around unit boundaries.",
    sourceText: "DOE: Multifamily Separation Walls", sourceUrl: "https://www.energy.gov/cmei/buildings/articles/building-america-webinar-air-sealing-best-practices-and-code-compliance"
  },
  { 
    id: "AS-05", name: "Seal accessible MEP penetrations", type: "Linear",
    inputs: [
      { key: "length", label: "sealed length around the MEP penetration in ft", value: 150, unitLabel: "ft", note: "Modeled number. Need actual measurements" },
      { key: "width", label: "gap width in inches", value: 0.125, unitLabel: "in", note: "Modeled number. Need actual measurements" }
    ],
    equationName: "Linear Leakage", equationDesc: "(Perimeter length in ft x 12) x (Gap width in inches) x (CFM50 per sq inch)",
    description: "Air seal around all plumbing and piping installed through walls, ceilings, and flooring.",
    sourceText: "ES MFNC Field Checklist", sourceUrl: "https://www.energystar.gov/sites/default/files/asset/document/ENERGY%20STAR%20MFNC%20Rater%20Field%20Checklist%20Version%201_1.1_1.2_Rev04.pdf"
  },
  { 
    id: "AS-06", name: "Tape all subfloor seams", type: "Linear",
    inputs: [
      { key: "length", label: "sealed length around the MEP penetration in ft", value: 150, unitLabel: "ft", note: "Modeled number. Need actual measurements" },
      { key: "width", label: "gap width that is getting sealed", value: 0.069, unitLabel: "in", note: "I assumed 10 sq inch that's a roughly 3\" × 3.3\" opening" }
    ],
    equationName: "Linear Leakage", equationDesc: "(Sealed length in ft x 12) x (Gap width in inches) x (CFM50 per sq inch)",
    description: "We need to choose the primary pressure plane preventing air entry into floor cavities.",
    sourceText: "DOE: Air Seal Subfloor Penetrations", sourceUrl: "https://www.energy.gov/sites/default/files/2024-07/13-2_air-seal-large-penetrations-in-subfloor.pdf"
  },
  { 
    id: "AS-07", name: "Seal Zip sheathing at bottom", type: "Linear",
    inputs: [
      { key: "length", label: "Projected/Intervention sealed length", value: 10, unitLabel: "ft", note: "Modeled number. Need actual measurements" },
      { key: "width", label: "gap width that is getting sealed", value: 0.069, unitLabel: "in", note: "I assumed 10 sq inch that's a roughly 3\" × 3.3\" opening" }
    ],
    equationName: "Linear Leakage", equationDesc: "Same as Linear Leakage",
    description: "Required to connect Zip to foundation sleepers.",
    sourceText: "PHIUS basics", sourceUrl: "https://www.phius.org/passive-building/what-passive-building/passive-building-principles"
  },
  { 
    id: "AS-08", name: "Sealant beads at sleepers", type: "Linear",
    inputs: [
      { key: "length", label: "Projected/Intervention sealed length", value: 5, unitLabel: "ft", note: "Modeled number. Need actual measurements" },
      { key: "width", label: "gap width in inches", value: 0.125, unitLabel: "in", note: "Modeled number. Need actual measurements" }
    ],
    equationName: "Linear Leakage", equationDesc: "Same as Linear Leakage",
    description: "Replaces structural gaps with high performance gasket seal during box set.",
    sourceText: "PNNL: Modular Marriage Joints", sourceUrl: "https://basc.pnnl.gov/resource-guides/air-sealing-modular-home-marriage-joints"
  },
  { 
    id: "AS-09", name: "Sealant at rim joist perimeter", type: "RimJoist",
    inputs: [
      { key: "length", label: "Projected/Intervention sealed length", value: 10, unitLabel: "ft", note: "Modeled number. Need actual measurements" },
      { key: "fraction", label: "fraction of total envelope leakage attributable to rim joist", value: 0.15, unitLabel: "fraction", note: "This means 15% of total baseline envelope leakage comes from the rim joist at Gilman. From literature, BSC cites 15–25% as a typical range for rim joist contribution across residential buildings" }
    ],
    equationName: "Rim Joist %", equationDesc: "(Total baseline leakage flow at 50Pa) x (Fraction attributable to rim joist)",
    description: "Rim joists typically account for 15-25% of total envelope infiltration.",
    sourceText: "BSC: Air Barrier Research", sourceUrl: "https://buildingscience.com/sites/default/files/migrate/pdf/RR-0403_Air_barriers_BFG.pdf"
  },
  { 
    id: "AS-10", name: "Seal register boots", type: "DuctBypass",
    inputs: [
      { key: "boots", label: "Number of register boots", value: 18, unitLabel: "count", note: "Modeled number. Need actual count" },
      { key: "areaPerBoot", label: "gap area per boot in sq inches", value: 0.5, unitLabel: "sq in", note: "Modeled number. Need actual measurements" }
    ],
    equationName: "Duct Bypass", equationDesc: "(Number of boots) x (Gap area per boot in sq inches) x (CFM50 per sq inch)",
    description: "High pressure duct to wall cavity bypass leakage prevention.",
    sourceText: "PNNL: Sealing Drywall to Plate", sourceUrl: "https://basc.pnnl.gov/resource-guides/air-sealing-drywall-top-plate"
  },
  { 
    id: "AS-11", name: "Air seal bottom plates", type: "Linear",
    inputs: [{ key: "length", label: "length to air seal in bottom plates", value: 10, unitLabel: "ft", note: "Modeled number. Need actual measurements" }],
    equationName: "Linear Leakage", equationDesc: "Same as Linear Leakage",
    description: "This should address baseboard-to-floor bypasses found during Gilman testing.",
    sourceText: "PNNL: Air Sealing Plumbing", sourceUrl: "https://basc.pnnl.gov/resource-guides/air-sealing-plumbing-and-piping"
  },
  { 
    id: "AS-12", name: "Seal rim joist before Zip", type: "RimJoist",
    inputs: [{ key: "fraction", label: "fraction of total envelope leakage attributable to rim joist", value: 0.15, unitLabel: "fraction", note: "This means 15% of total baseline envelope leakage comes from the rim joist at Gilman. From literature, BSC cites 15–25% as a typical range for rim joist contribution across residential buildings" }],
    equationName: "Rim Joist %", equationDesc: "Same as AS-09",
    description: "Pre-sheathing ensures continuity in field or factory.",
    sourceText: "Siplast: Air Barrier Transitions", sourceUrl: "https://www.siplast.com/blog/building-enclosure/what-architects-should-know-about-air-barrier-transitions-281474980418303"
  },
  { 
    id: "AS-13", name: "Seal beam before Zip", type: "Linear",
    inputs: [{ key: "length", label: "Projected/Intervention sealed length", value: 10, unitLabel: "ft", note: "Modeled number. Need actual measurements" }],
    equationName: "Linear Leakage", equationDesc: "Same as Linear Leakage",
    description: "Sealant bead isolates structural frame from exterior sheathing as per ASHRAE 90.1.",
    sourceText: "PNNL: Modular Marriage Joints", sourceUrl: "https://basc.pnnl.gov/resource-guides/air-sealing-modular-home-marriage-joints"
  }
];

export default function Home() {
  const [assumptions, setAssumptions] = useState<ProjectAssumptions>(defaultAssumptions);
  const [strategies, setStrategies] = useState<StrategyInput[]>(initialStrategies);
  const [showPanel, setShowPanel] = useState<boolean>(true);
  const [unlockedFields, setUnlockedFields] = useState<Record<string, boolean>>({});
  const [pendingTargetI, setPendingTargetI] = useState<{value: number, newRatio: number} | null>(null);
  
  // Custom fixed tooltip state to prevent clipping
  const [tooltip, setTooltip] = useState<{show: boolean, text: string, x: number, y: number, isEquation?: boolean, eqName?: string}>({show: false, text: "", x: 0, y: 0});
  
  const handleAssumptionChange = (key: keyof ProjectAssumptions, value: number) => {
    if (key === 'targetI_ACH50') {
      const proposedRatio = value / assumptions.targetC_ACH50;
      if (Math.abs(proposedRatio - assumptions.ciRatio) > 0.001) {
        setPendingTargetI({ value, newRatio: proposedRatio });
        return;
      }
    }
    let newAssumptions = { ...assumptions, [key]: value };
    if (key === 'baselineUnitCompartmentalization') newAssumptions.baselineC_CFM50 = Number(((value * newAssumptions.unitConditionedVolume) / 60).toFixed(2));
    else if (key === 'baselineC_CFM50') newAssumptions.baselineUnitCompartmentalization = Number(((value * 60) / newAssumptions.unitConditionedVolume).toFixed(3));
    else if (key === 'unitConditionedVolume') newAssumptions.baselineC_CFM50 = Number(((newAssumptions.baselineUnitCompartmentalization * value) / 60).toFixed(2));
    else if (key === 'targetC_ACH50') newAssumptions.targetI_ACH50 = Number((value * newAssumptions.ciRatio).toFixed(2));
    else if (key === 'ciRatio') newAssumptions.targetI_ACH50 = Number((newAssumptions.targetC_ACH50 * value).toFixed(2));
    
    setAssumptions(newAssumptions);
    if (key !== 'targetI_ACH50') setPendingTargetI(null);
  };

  const handleMouseEnter = (e: React.MouseEvent, text: string, isEquation = false, eqName = "") => {
    setTooltip({ show: true, text, x: e.clientX, y: e.clientY, isEquation, eqName });
  };
  const handleMouseLeave = () => setTooltip({ ...tooltip, show: false });

  const results = calculateImpact(assumptions, strategies);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white text-black">
      
      {/* Global Tooltip Portal */}
      {tooltip.show && (
        <div 
          className="fixed bg-gray-900 text-white text-xs p-3 rounded-md z-[9999] w-72 shadow-2xl pointer-events-none"
          style={{ top: Math.min(tooltip.y + 15, window.innerHeight - 100), left: Math.min(tooltip.x + 15, window.innerWidth - 300) }}
        >
          {tooltip.isEquation && <p className="font-bold mb-1 text-blue-300">{tooltip.eqName}</p>}
          <p>{tooltip.text}</p>
        </div>
      )}

      {/* Left Panel: Independently Scrollable */}
      <div className={`flex flex-col h-full bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out z-40 ${showPanel ? "w-[350px] min-w-[350px]" : "w-16 min-w-16"}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          {showPanel && <h2 className="text-lg font-bold whitespace-nowrap overflow-hidden text-gray-800">Key Inputs</h2>}
          <button 
            onClick={() => setShowPanel(!showPanel)} 
            className="p-1 rounded-md hover:bg-gray-200 text-gray-700 focus:outline-none transition-colors"
            title="Toggle Panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        
        {showPanel && (
          <div className="p-4 overflow-y-auto flex-1">
            {(Object.keys(assumptions) as Array<keyof ProjectAssumptions>).map((key) => {
              const labelInfo = assumptionLabels[key];
              return (
                <div key={key} className="mb-5">
                  <div className="flex items-start gap-1 mb-1">
                    <label className="text-xs font-semibold text-gray-700 leading-tight flex-1">
                      {labelInfo.label}
                    </label>
                    <div 
                      className="cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex-shrink-0"
                      onMouseEnter={(e) => handleMouseEnter(e, labelInfo.note)}
                      onMouseLeave={handleMouseLeave}
                    >
                      i
                    </div>
                  </div>
                  <input type="number" step="any" value={assumptions[key]} onChange={(e) => handleAssumptionChange(key, Number(e.target.value))} disabled={lockedAssumptionKeys.includes(key) && !unlockedFields[key]} className={`w-full border p-2 rounded text-black text-sm outline-none ${lockedAssumptionKeys.includes(key) && !unlockedFields[key] ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-white'}`} />
                  {lockedAssumptionKeys.includes(key) && !unlockedFields[key] && <button type="button" onClick={() => setUnlockedFields({...unlockedFields, [key]: true})} className="text-[10px] text-blue-600 underline mt-1 text-left">Edit manually</button>}
                  {lockedAssumptionKeys.includes(key) && unlockedFields[key] && <p className="text-[10px] text-amber-600 mt-1 font-bold">⚠️ Default values from literature</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Panel: Independently Scrollable Viewport */}
      <div className="flex-1 h-full overflow-y-auto bg-white p-6 md:p-8">
        <div className="mb-8 max-w-[1400px]">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Air Sealing Logic Engine</h1>
        </div>
        
        <div className="overflow-x-auto pb-32 max-w-[1400px]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 w-3/12 font-bold text-gray-700">Strategy & Logic</th>
                <th className="p-3 w-3/12 font-bold text-gray-700">Inputs</th>
                <th className="p-3 font-bold text-gray-700">ΔCFM50 - Leakage Removed</th>
                <th className="p-3 font-bold text-gray-700">% leakage reduced</th>
                <th className="p-3 font-bold text-blue-800">Projected Unit Compartmentalization</th>
                <th className="p-3 font-bold text-green-800">Projected Whole-Building Infiltration</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s, index) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 align-top transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{s.id}</span>
                      <div 
                        className="cursor-help inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold"
                        onMouseEnter={(e) => handleMouseEnter(e, s.equationDesc, true, s.equationName)}
                        onMouseLeave={handleMouseLeave}
                      >
                        i
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">{s.name}</p>
                    <p className="text-[10px] leading-snug text-gray-500 mb-2">{s.description}</p>
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline block truncate max-w-[200px]">
                      Source: {s.sourceText}
                    </a>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-3">
                      {s.inputs.map(input => (
                        <div key={input.key} className="flex flex-col gap-1">
                          <div className="flex items-start gap-1">
                            <label className="text-[10px] font-semibold text-gray-600 leading-tight flex-1">{input.label}</label>
                            <div 
                              className="cursor-help inline-flex items-center justify-center w-3 h-3 rounded-full bg-gray-200 text-gray-600 text-[8px] font-bold flex-shrink-0"
                              onMouseEnter={(e) => handleMouseEnter(e, input.note)}
                              onMouseLeave={handleMouseLeave}
                            >
                              i
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              step="any"
                              value={input.value} 
                              onChange={(e) => handleStrategyInput(s.id, input.key, Number(e.target.value))} 
                              className="border border-gray-300 p-1.5 rounded w-20 text-black text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-[10px] text-gray-500 font-medium">{input.unitLabel}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-gray-700 font-medium">{results[index].cfmRemoved}</td>
                  <td className="p-3 font-mono text-red-600 font-bold">{results[index].cReduced}</td>
                  <td className="p-3 font-mono text-blue-700 font-bold">{results[index].projectedC}</td>
                  <td className="p-3 font-mono text-green-700 font-bold">{results[index].projectedI}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    <footer className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 text-center py-2 text-black text-xs z-[100] flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4 shadow-lg"><span className="font-bold">dexdogs // environment has a data problem</span><span>Solving the environmental data problem by standardizing field science. This tool is open for iterative feedback.</span><a href="mailto:ankur@dexdogs.earth" className="underline font-bold hover:text-gray-600">Send Feedback to ankur@dexdogs.earth</a></footer></main>
  );
}
