const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Define the mapping of old text to new text
const replacements = {
    "ΔCFM50": "ΔCFM50 - Leakage reduced",
    "% reduced": "% Leakage reduced",
    "Proj C (ACH50)": "Projected Unit Compartmentalization (ACH50)",
    "Proj I (ACH50)": "Projected Whole-Building Infiltration (ACH50)"
};

// Perform the replacements
Object.keys(replacements).forEach(key => {
    // This regex looks for the key specifically when it's inside a table header/cell
    const regex = new RegExp(\`>\${key}<\`, 'g');
    code = code.replace(regex, \`>\${replacements[key]}<\`);
});

fs.writeFileSync('app/page.tsx', code);
console.log('Table headers updated successfully!');
