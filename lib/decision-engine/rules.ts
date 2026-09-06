/**
 * Dispatcher Rules Registry
 * Extracted verbatim from dispatcher_interview.txt, client agreements, and operational history.
 */

import { DispatcherRule } from './types';

export const DISPATCHER_RULES: Record<string, DispatcherRule> = {
  'R-001': {
    ruleId: 'R-001',
    name: 'Winter Delhi NCR BS6 Restriction',
    condition: 'Route touches Delhi NCR (Delhi, Gurgaon, Faridabad, Noida) during winter months (October to February) AND vehicle is BS4.',
    decision: 'INELIGIBLE',
    priority: 100,
    category: 'seasonal',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview lines 14-15: "October to February, no BS4 vehicle goes on any Delhi NCR route... BS6 only on Delhi routes in winter, I don\'t care if the BS4 truck is parked twenty meters from the loading dock."',
  },

  'R-002': {
    ruleId: 'R-002',
    name: 'Hill Route Winter Engine Heater Requirement',
    condition: 'Route destination is hill terrain (Rudrapur, Nainital, Uttarakhand hills) during winter months (November to February) AND vehicle lacks an operational engine heater.',
    decision: 'INELIGIBLE',
    priority: 95,
    category: 'seasonal',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 18: "Rudrapur, and anything going up toward Nainital side from there. November to February, two rules. The vehicle must have an engine heater... without a heater, you are gambling."',
  },

  'R-003': {
    ruleId: 'R-003',
    name: 'Hill Route 30-Day Brake Work Restriction',
    condition: 'Route destination is hill terrain (Rudrapur, Nainital, Uttarakhand hills) AND vehicle has had brake maintenance in the past 30 days.',
    decision: 'INELIGIBLE',
    priority: 95,
    category: 'maintenance',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 18: "I never send a vehicle on a hill route if it has had any brake work in the last thirty days. Any brake work... Thirty days of flat running first, then hills."',
  },

  'R-004': {
    ruleId: 'R-004',
    name: '<50km Origin Hub Replacement Sourcing',
    condition: 'Breakdown occurs within 50 km of its origin hub (kmFromOriginHub <= 50) AND candidate replacement is located at an intermediate or third-party hub.',
    decision: 'INELIGIBLE',
    priority: 90,
    category: 'route',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 36: "If a vehicle breaks down within 50 kilometers of its origin hub, the replacement comes from the origin hub. Always... You empty out a small hub for a breakdown 40 km away and then a Shakti order lands there in the evening and you have nothing."',
  },

  'R-005': {
    ruleId: 'R-005',
    name: 'Service Overdue Grounding Rule',
    condition: 'Vehicle is > 30 days overdue on scheduled service OR flagged as GROUNDED / MAINTENANCE.',
    decision: 'INELIGIBLE',
    priority: 100,
    category: 'maintenance',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 38: "Any vehicle that is more than 30 days past its due service date is grounded. It does not move, I don\'t care what the emergency is. An overdue truck sent on an emergency becomes the next emergency."',
  },

  'R-006': {
    ruleId: 'R-006',
    name: 'Temporary Repair (Guddu Jugaad) 7-Day Regional Boundary',
    condition: 'Vehicle operates under temporary roadside patch ("Guddu ka jugaad") AND route is outside home region OR repair age exceeds 7 days.',
    decision: 'INELIGIBLE',
    priority: 85,
    category: 'maintenance',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 42: "Whatever he patched must get a permanent repair within seven days, and until then that vehicle does not leave its home region... Seven days. Write it in red."',
  },

  'R-007': {
    ruleId: 'R-007',
    name: 'Orion Pharma Minimum Model Year Requirement',
    condition: 'Client is Orion Pharma AND candidate vehicle model year is older than 2020.',
    decision: 'INELIGIBLE',
    priority: 90,
    category: 'client',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 28: "Orion Pharma... their consignments always get the newest available vehicle, 2020 or later. Pharma audit requirement, they check the RC copy. Send a 2016 truck and the load is rejected at the gate."',
  },

  'R-008': {
    ruleId: 'R-008',
    name: 'Shakti Cement 36-Hour Operational SLA Window',
    condition: 'Client is Shakti Cement.',
    decision: 'APPLIED',
    priority: 80,
    category: 'sla',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 22: "Shakti Cement\'s contract says 48 hour delivery window. Forget the contract. If a Shakti load crosses 36 hours, their plant head calls our MD directly... Plan everything to 36."',
  },

  'R-009': {
    ruleId: 'R-009',
    name: 'Vertex Retail Ludhiana 6:00 PM Gate Cutoff',
    condition: 'Client is Vertex Retail AND destination is Ludhiana warehouse.',
    decision: 'APPLIED',
    priority: 80,
    category: 'client',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 24: "Vertex Retail... their warehouse at Ludhiana stops accepting after 6 pm. Not 6:15. The gate man will not open. So if a Vertex truck is going to reach after 6, don\'t let it reach after 6. Hold it at the last halt, deliver next morning at 8."',
  },

  'R-010': {
    ruleId: 'R-010',
    name: 'Apex Chemicals Vehicle Plate Rotation Rule',
    condition: 'Client is Apex Chemicals AND candidate vehicle was involved in a breakdown on its previous Apex dispatch.',
    decision: 'INELIGIBLE',
    priority: 85,
    category: 'client',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 26: "Apex Chemicals... If a truck has any issue on an Apex run, a breakdown, a late arrival, anything, that same truck does not go back to Apex on the very next dispatch. Send a different vehicle at least once in between."',
  },

  'R-011': {
    ruleId: 'R-011',
    name: 'Monsoon Eastern Route 20% Transit Buffer',
    condition: 'Month is in monsoon season (July to September) AND destination is east of Lucknow (e.g. Gorakhpur, Patna, Varanasi).',
    decision: 'APPLIED',
    priority: 75,
    category: 'seasonal',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 32: "July to September, anything going east of Lucknow, add twenty percent to whatever time the computer says, minimum... In monsoon on eastern routes I never promise the standard SLA to any client."',
  },

  'R-012': {
    ruleId: 'R-012',
    name: 'Active Inventory & Payload Capacity Eligibility',
    condition: 'Vehicle status is not Active/AVAILABLE OR capacity is insufficient for the load.',
    decision: 'INELIGIBLE',
    priority: 100,
    category: 'vehicle',
    source: 'fleet_master.csv',
    sourceReference: 'Fleet master vehicle status and capacity specification.',
  },

  'R-013': {
    ruleId: 'R-013',
    name: 'Driver Night Solo Experience Requirement',
    condition: 'Driver tenure with Meridian is less than 6 months AND dispatch is a solo night run.',
    decision: 'INELIGIBLE',
    priority: 80,
    category: 'driver',
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 46: "New drivers, less than six months with us, never go solo on a night run. Pair them or give them day dispatches... Six months of days and paired nights, then they earn the night solo."',
  },
};
