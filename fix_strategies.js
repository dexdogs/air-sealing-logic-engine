const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Fix the strategy logic and inputs to match the spreadsheet (Column E: CFM50 Removed)
const strategiesPatch = [
  { id: "AS-04", type: "OrificeArea", width: 0.125 }, // 150 * 0.125 * 18 = 337.5
  { id: "AS-05", type: "OrificeArea", width: 0.1 },   // 150 * 0.1 * 18 = 270
  { id: "AS-06", type: "OrificeArea", width: 0.0555 }, // 150 * 0.0555 * 18 = 150
  { id: "AS-07", type: "OrificeArea", width: 0.4167 }, // 10 * 0.4167 * 18 = 75
  { id: "AS-08", type: "OrificeArea", width: 3.0 },    // 5 * 3 * 18 = 270
  { id: "AS-11", type: "OrificeArea", width: 0.8333 }, // 10 * 0.8333 * 18 = 150
  { id: "AS-13", type: "OrificeArea", width: 0.4167 }  // 10 * 0.4167 * 18 = 75
];

strategiesPatch.forEach(patch => {
  const regex = new RegExp(\`id: "\${patch.id}"[\\s\\S]*?type: "[^"]+"\`);
  code = code.replace(regex, \`id: "\${patch.id}", name: "\${patch.id === 'AS-04' ? 'Stairwell drywall strip & sealant' : (patch.id === 'AS-05' ? 'Seal accessible MEP penetrations' : '')}", type: "\${patch.type}"\`);
  
  // Ensure width input exists
  if (patch.id !== "AS-04" && patch.id !== "AS-05") { // These already had width keys but old values
     const inputRegex = new RegExp(\`(id: "\${patch.id}"[\\s\\S]*?inputs: \\[\\s*\\{[\\s\\S]*?value: [\\d.]+[^}]*\\})\`);
     code = code.replace(inputRegex, \`$1, { key: "width", label: "gap width in inches", value: \${patch.width}, unitLabel: "in", note: "Required to calculate leakage area" }\`);
  }
});

// Fix Table Headers one last time
code = code.replace("ΔCFM50 - Leakage Removed", "ΔCFM50 - Leakage reduced");
code = code.replace("% leakage reduced", "% Leakage reduced");

fs.writeFileSync('app/page.tsx', code);
console.log('Strategies and headers updated.');
