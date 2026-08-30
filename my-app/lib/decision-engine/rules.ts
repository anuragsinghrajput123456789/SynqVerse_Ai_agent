/**
 * Dispatcher Rules Registry
 * Extracted verbatim from dispatcher_interview.txt, client agreements, and operational history.
 */

import { DispatcherRule } from '../types';

export const DISPATCHER_RULES: Record<string, DispatcherRule> = {
  'R-001': {
    ruleId: 'R-001',
    name: 'Winter Delhi NCR BS6 Restriction',
    description: 'Between October and February, only BS6 vehicles are permitted on routes touching Delhi NCR (Delhi, Gurgaon, Faridabad, Noida) due to winter GRAP pollution regulations.',
    conditions: [
      'Month is in [October, November, December, January, February]',
      'Route origin, destination, or transit path touches Delhi NCR',
      'Vehicle must have bsStage === "BS6"',
    ],
    decision: 'BS4 vehicles are strictly ineligible on Delhi NCR routes in winter; BS6 vehicle required regardless of proximity.',
    priority: 100,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview lines 14-15: "October to February, no BS4 vehicle goes on any Delhi NCR route... BS6 only on Delhi routes in winter, I don\'t care if the BS4 truck is parked twenty meters from the loading dock."',
  },

  'R-002': {
    ruleId: 'R-002',
    name: 'Hill Route Winter Engine Heater Requirement',
    description: 'Between November and February, any vehicle dispatched to hill routes (Rudrapur, Nainital, Uttarakhand hills) must be equipped with an operational engine heater for cold starts.',
    conditions: [
      'Month is in [November, December, January, February]',
      'Destination or route is hill terrain (e.g., Rudrapur, Nainital)',
      'Vehicle must have engineHeater === true',
    ],
    decision: 'Vehicles without engine heaters are strictly ineligible for winter hill routes.',
    priority: 95,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 18: "Rudrapur, and anything going up toward Nainital side from there. November to February, two rules. The vehicle must have an engine heater... without a heater, you are gambling."',
  },

  'R-003': {
    ruleId: 'R-003',
    name: 'Hill Route 30-Day Brake Work Quarantine',
    description: 'No vehicle that has had brake maintenance (pads, drums, lining) in the last 30 days may be dispatched on hill routes until verified with 30 days of flat running.',
    conditions: [
      'Destination or route is hill terrain (e.g., Rudrapur, Nainital)',
      'Vehicle has had brake maintenance in the past 30 days',
    ],
    decision: 'Vehicle is strictly ineligible for hill routes until 30 days of flat running completed.',
    priority: 95,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 18: "I never send a vehicle on a hill route if it has had any brake work in the last thirty days. Any brake work... Thirty days of flat running first, then hills."',
  },

  'R-004': {
    ruleId: 'R-004',
    name: 'Breakdown < 50km Origin Hub Replacement Sourcing',
    description: 'If a breakdown occurs within 50 km of its origin hub, the replacement vehicle must be sourced from the origin hub, not intermediate or third-party hubs, preserving small hub spares for premium clients.',
    conditions: [
      'kmFromOriginHub <= 50',
    ],
    decision: 'Replacement vehicle MUST be sourced from the origin hub.',
    priority: 90,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 36: "If a vehicle breaks down within 50 kilometers of its origin hub, the replacement comes from the origin hub. Always... You empty out a small hub for a breakdown 40 km away and then a Shakti order lands there in the evening and you have nothing."',
  },

  'R-005': {
    ruleId: 'R-005',
    name: 'Service Overdue Grounding Rule',
    description: 'Any vehicle overdue for scheduled maintenance (> 30 days overdue or flagged grounded) is grounded and must not be dispatched under any circumstances.',
    conditions: [
      'Vehicle maintenance is overdue > 30 days OR status is "GROUNDED" OR "MAINTENANCE"',
    ],
    decision: 'Vehicle is grounded and strictly ineligible for replacement dispatch.',
    priority: 100,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 38: "Any vehicle that is more than 30 days past its due service date is grounded. It does not move, I don\'t care what the emergency is. An overdue truck sent on an emergency becomes the next emergency."',
  },

  'R-006': {
    ruleId: 'R-006',
    name: 'Temporary Repair (Guddu Jugaad) 7-Day Regional Restriction',
    description: 'Any vehicle operating under temporary roadside repair ("Guddu ka jugaad") must undergo permanent workshop repair within 7 days and must not be dispatched on long-distance routes outside its home region.',
    conditions: [
      'Vehicle has an open temporary repair / roadside patch note',
      'Destination is outside vehicle home hub region OR repair age > 7 days',
    ],
    decision: 'Vehicle is restricted to home region short-haul only until permanent workshop repair is completed.',
    priority: 85,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 42: "Whatever he patched must get a permanent repair within seven days, and until then that vehicle does not leave its home region... Seven days. Write it in red."',
  },

  'R-007': {
    ruleId: 'R-007',
    name: 'Orion Pharma Minimum Model Year Requirement',
    description: 'Consignments for Orion Pharma strictly require vehicles with model year 2020 or newer due to client pharma audit compliance.',
    conditions: [
      'Client is "Orion Pharma"',
      'Vehicle model year < 2020',
    ],
    decision: 'Vehicles manufactured prior to 2020 are ineligible and will be rejected at Orion Pharma client gate.',
    priority: 90,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 28: "Orion Pharma... their consignments always get the newest available vehicle, 2020 or later. Pharma audit requirement, they check the RC copy. Send a 2016 truck and the load is rejected at the gate."',
  },

  'R-008': {
    ruleId: 'R-008',
    name: 'Shakti Cement 36-Hour Operational SLA Window',
    description: 'Shakti Cement delivery dispatches are strictly planned against a 36-hour operational window, overriding the 48-hour paper contract.',
    conditions: [
      'Client is "Shakti Cement"',
    ],
    decision: 'Enforce 36-hour operational SLA window and trigger high-priority breakdown resolution.',
    priority: 80,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 22: "Shakti Cement\'s contract says 48 hour delivery window. Forget the contract. If a Shakti load crosses 36 hours, their plant head calls our MD directly... Plan everything to 36."',
  },

  'R-009': {
    ruleId: 'R-009',
    name: 'Vertex Retail Ludhiana 6:00 PM Gate Cutoff',
    description: 'Vertex Retail warehouse at Ludhiana strictly stops accepting deliveries after 6:00 PM. Deliveries arriving later must be scheduled for next morning 8:00 AM without marking failed delivery.',
    conditions: [
      'Client is "Vertex Retail"',
      'Destination is "Ludhiana"',
    ],
    decision: 'Enforce 6:00 PM warehouse cutoff. Schedule next-morning delivery if arrival exceeds 18:00.',
    priority: 80,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 24: "Vertex Retail... their warehouse at Ludhiana stops accepting after 6 pm. Not 6:15. The gate man will not open. So if a Vertex truck is going to reach after 6, don\'t let it reach after 6. Hold it at the last halt, deliver next morning at 8."',
  },

  'R-010': {
    ruleId: 'R-010',
    name: 'Apex Chemicals Vehicle Plate Rotation Rule',
    description: 'If a vehicle encounters a breakdown or issue on an Apex Chemicals run, the exact same vehicle cannot be reassigned on the immediately subsequent Apex Chemicals dispatch.',
    conditions: [
      'Client is "Apex Chemicals"',
      'Candidate vehicle was involved in previous breakdown for Apex Chemicals',
    ],
    decision: 'Candidate vehicle is ineligible for immediate consecutive Apex dispatch; rotate to a different plate.',
    priority: 85,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 26: "Apex Chemicals... If a truck has any issue on an Apex run, a breakdown, a late arrival, anything, that same truck does not go back to Apex on the very next dispatch. Send a different vehicle at least once in between."',
  },

  'R-011': {
    ruleId: 'R-011',
    name: 'Monsoon Eastern Route 20% Transit Buffer',
    description: 'Between July and September, all routes east of Lucknow (Patna, Gorakhpur, Varanasi, etc.) must add a minimum 20% transit time buffer to SLA calculations.',
    conditions: [
      'Month is in [July, August, September]',
      'Route destination is east of Lucknow (e.g. Gorakhpur, Patna, Varanasi)',
    ],
    decision: 'Add 20% time buffer to standard ETA.',
    priority: 75,
    source: 'dispatcher_interview.txt',
    sourceReference: 'Rajender Pal Yadav interview line 32: "July to September, anything going east of Lucknow, add twenty percent to whatever time the computer says, minimum... In monsoon on eastern routes I never promise the standard SLA to any client."',
  },

  'R-012': {
    ruleId: 'R-012',
    name: 'Active Inventory & Payload Capacity Eligibility',
    description: 'Replacement vehicles must have status === "Active" / "AVAILABLE" and have sufficient rated payload capacity for the consignment.',
    conditions: [
      'Vehicle status must be "Active" or "AVAILABLE"',
      'Vehicle capacity must meet consignment requirement',
    ],
    decision: 'Vehicles currently in transit, under repair, or with insufficient capacity are ineligible.',
    priority: 100,
    source: 'fleet_master.csv',
    sourceReference: 'Fleet inventory master specification.',
  },
};
