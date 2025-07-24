# Excel SMORT Formula Analysis

## Cell References Found in Code:
- **BA7**: Effective Volume = ((SUM(D7:AY7)*(1-$BA$1))*(1-$BB$1))*(1-$AZ$1)
- **BB7**: Required Agents = IF(BD7<=0,0,Agents($A$1,$B$1,BD7*2,BE7))
- **BC7**: Variance = POWER((BA7-BB7),2) or BA7-BB7
- **BF7**: Service Level = SLA(BA7,$B$1,BD7*2,BE7)
- **BG7**: Occupancy = Utilisation(BA7,BD7*2,BE7)

## Key Questions:
1. What is BD7? (Used as BD7*2)
2. What is BE7? 
3. What are the custom Excel functions:
   - Agents($A$1,$B$1,BD7*2,BE7)
   - SLA(BA7,$B$1,BD7*2,BE7)
   - Utilisation(BA7,BD7*2,BE7)

## Likely Excel Cell Meanings:
- $A$1 = SLA Target (80%)
- $B$1 = Service Time (30s)
- BA7 = Effective Volume (after shrinkage)
- BD7 = Traffic in half-hours (BD7*2 = hourly traffic)
- BE7 = AHT in hours or minutes

## Current Implementation Issues:
1. We might not be converting traffic intensity correctly
2. The "Call Trend" formula is unclear in Excel
3. The Agents() function might have specific Excel VBA logic we're missing
