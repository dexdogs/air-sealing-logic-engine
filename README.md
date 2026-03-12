# Air Sealing Logic Engine

### About
A modular modeling engine designed to quantify the impact of specific air sealing strategies on Unit Compartmentalization ($ACH_{50}$) and Whole-Building Infiltration.

### Who is this for?
Built for **Dexdogs** to empower building scientists, modular manufacturers, and HERS raters to transition from anecdotal field measurements to verifiable, data-driven projections.

### Why is this important?
This tool standardizes inconsistent field observations. By applying verified physics equations to observable defects, it allows teams to prioritize high-ROI interventions for building performance.

### Equations Used
1. **Linear Leakage**: $CFM_{50} = (L_{ft} \times 12) \times W_{in} \times 18$
2. **Void Fraction / Rim Joist**: $CFM_{50} = \text{Baseline}_{CFM50} \times \text{Fraction}$
3. **Stack Effect**: $CFM_{50} = C_d \times A_{ft^2} \times \sqrt{\frac{2g \cdot h \cdot \Delta T}{T_{avg}}} \times 60 \times 20$
4. **Duct Bypass**: $CFM_{50} = \text{Boots} \times A_{in^2} \times 18$

### Literature & Sources
- [PNNL: Sealing Sill Plates](https://basc.pnnl.gov/resource-guides/air-sealing-sill-plates)
- [BSC: Sealing the Right Walls](https://buildingscience.com/documents/building-science-insights-newsletters/bsi-108-are-we-sealing-right-walls-buildings)
- [EERE: Sealing Penetrations](https://www1.eere.energy.gov/buildings/publications/pdfs/building_america/sealing_penetrations.pdf)
- [DOE: MF Air Sealing](https://www.energy.gov/cmei/buildings/articles/building-america-webinar-air-sealing-best-practices-and-code-compliance)
- [Energy Star: Rater Checklist](https://www.energystar.gov/sites/default/files/asset/document/ENERGY%20STAR%20MFNC%20Rater%20Field%20Checklist%20Version%201_1.1_1.2_Rev04.pdf)
- [DOE: Subfloor Sealing](https://www.energy.gov/sites/default/files/2024-07/13-2_air-seal-large-penetrations-in-subfloor.pdf)
- [PHIUS: Passive Principles](https://www.phius.org/passive-building/what-passive-building/passive-building-principles)
- [PNNL: Marriage Joints](https://basc.pnnl.gov/resource-guides/air-sealing-modular-home-marriage-joints)
- [BSC: Air Barriers](https://buildingscience.com/sites/default/files/migrate/pdf/RR-0403_Air_barriers_BFG.pdf)
- [PNNL: Drywall Sealing](https://basc.pnnl.gov/resource-guides/air-sealing-drywall-top-plate)
- [PNNL: Plumbing Sealing](https://basc.pnnl.gov/resource-guides/air-sealing-plumbing-and-piping)
- [Siplast: Barrier Transitions](https://www.siplast.com/blog/building-enclosure/what-architects-should-know-about-air-barrier-transitions-281474980418303)
