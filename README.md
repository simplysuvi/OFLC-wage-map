# OFLC-wage-map

This project visualizes prevailing wage data published by the U.S. Department of Labor's Office of Foreign Labor Certification (OFLC) for Labor Condition Applications (LCAs). It enables interactive exploration of wage levels across U.S. regions for different occupational codes (SOC) and geographic areas.

## What It Does

- Loads and cleans official ALC wage data from the Department of Labor
- Allows filtering by job role (SOC code/title), wage level (1–4 or average)
- Visualizes wages on a U.S. map by region (MSA or non-MSA)
- Supports analysis and justification for LCA/PERM filings

## Data Source

All wage data used in this project was downloaded from the official DOL OFLC website: [https://flag.dol.gov/wage-data/wage-data-downloads](https://flag.dol.gov/wage-data/wage-data-downloads)


## Files Used

| File | Purpose |
|------|---------|
| `data/ALC_Export.csv` | Official OFLC wage data (Level 1–4, Average) by SOC and Area |
| `data/Geography.csv` | Maps `Area` codes to MSA/region names and states |
| `data/oes_soc_occs.csv` | SOC code to official job title + description |
| `data/Wage Year 2024–25 ACWIA Crosswalks.xlsx` | Maps O*NET codes to ACWIA-compatible SOC codes |
| `data/Wage Year 2024–25 Appendix A, Job Zone, and Education.xlsx` | Contains job zone and education level info per SOC |


## Disclaimer

This project uses publicly available data from the U.S. Department of Labor. It is intended for analysis, research, and visualization purposes only. Always refer to official guidance when submitting immigration applications.
