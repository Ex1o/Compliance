import { PrismaClient, DeadlineCategory, DeadlineFrequency, EntityType, GstStatus, Industry } from '@prisma/client';
const prisma = new PrismaClient();

const rules = [
  {
    lawName: 'GST', formNumber: 'GSTR-1', title: 'GSTR-1 Monthly',
    description: 'Monthly outward supplies return for regular taxpayers with turnover > ₹5 Crore',
    category: DeadlineCategory.GST, frequency: DeadlineFrequency.MONTHLY,
    dueDateFormula: 'day:11:next_month',
    applicableEntityTypes: [], applicableGstStatuses: [GstStatus.REGULAR],
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '₹50/day', penaltyPerDay: 50, portalUrl: 'https://gst.gov.in',
  },
  {
    lawName: 'GST', formNumber: 'GSTR-3B', title: 'GSTR-3B Monthly',
    description: 'Monthly summary return and tax payment',
    category: DeadlineCategory.GST, frequency: DeadlineFrequency.MONTHLY,
    dueDateFormula: 'day:20:next_month',
    applicableEntityTypes: [], applicableGstStatuses: [GstStatus.REGULAR],
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '₹50/day + 18% p.a. interest', penaltyPerDay: 50, portalUrl: 'https://gst.gov.in',
  },
  {
    lawName: 'TDS', formNumber: 'Challan 281', title: 'TDS Deposit (Salary)',
    description: 'Monthly TDS deposit for salary deductions',
    category: DeadlineCategory.TDS, frequency: DeadlineFrequency.MONTHLY,
    dueDateFormula: 'day:7:next_month',
    applicableEntityTypes: [], applicableGstStatuses: [],
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '1.5%/month', penaltyRate: 1.5, portalUrl: 'https://tdscpc.gov.in',
  },
  {
    lawName: 'PF', formNumber: 'ECR', title: 'PF Contribution Deposit',
    description: 'Monthly Provident Fund contribution for employers with 20+ employees',
    category: DeadlineCategory.PF, frequency: DeadlineFrequency.MONTHLY,
    dueDateFormula: 'day:15:next_month',
    applicableEntityTypes: [], applicableGstStatuses: [], minEmployees: 20,
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '12% p.a. + damages', penaltyRate: 12, portalUrl: 'https://epfindia.gov.in',
  },
  {
    lawName: 'ESI', formNumber: 'ESI Challan', title: 'ESI Contribution Deposit',
    description: 'Monthly ESI deposit for employers with 10+ employees',
    category: DeadlineCategory.PF, frequency: DeadlineFrequency.MONTHLY,
    dueDateFormula: 'day:15:next_month',
    applicableEntityTypes: [], applicableGstStatuses: [], minEmployees: 10,
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: 'Prosecution + interest', penaltyRate: 12, portalUrl: 'https://esic.in',
  },
  {
    lawName: 'MCA', formNumber: 'AOC-4', title: 'Annual Financial Statements (AOC-4)',
    description: 'Annual filing of financial statements with MCA',
    category: DeadlineCategory.MCA, frequency: DeadlineFrequency.ANNUAL,
    dueDateFormula: 'annual:10:30',
    applicableEntityTypes: [EntityType.PVT_LTD], applicableGstStatuses: [],
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '₹100/day', penaltyPerDay: 100, portalUrl: 'https://mca.gov.in',
  },
  {
    lawName: 'MCA', formNumber: 'MGT-7', title: 'Annual Return (MGT-7)',
    description: 'Annual return filing for Pvt Ltd companies',
    category: DeadlineCategory.MCA, frequency: DeadlineFrequency.ANNUAL,
    dueDateFormula: 'annual:11:29',
    applicableEntityTypes: [EntityType.PVT_LTD], applicableGstStatuses: [],
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '₹100/day', penaltyPerDay: 100, portalUrl: 'https://mca.gov.in',
  },
  {
    lawName: 'MCA', formNumber: 'DIR-3 KYC', title: 'Director KYC (DIR-3)',
    description: 'Annual KYC for all directors with DIN',
    category: DeadlineCategory.MCA, frequency: DeadlineFrequency.ANNUAL,
    dueDateFormula: 'annual:9:30',
    applicableEntityTypes: [EntityType.PVT_LTD, EntityType.LLP], applicableGstStatuses: [],
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '₹5,000 fixed', penaltyFixed: 5000, portalUrl: 'https://mca.gov.in',
  },
  {
    lawName: 'Income Tax', formNumber: 'ITR', title: 'Income Tax Return (Non-Audit)',
    description: 'Annual ITR filing for non-audit cases',
    category: DeadlineCategory.INCOME_TAX, frequency: DeadlineFrequency.ANNUAL,
    dueDateFormula: 'annual:7:31',
    applicableEntityTypes: [], applicableGstStatuses: [],
    applicableIndustries: [], applicableStates: [],
    penaltyFormula: '₹5,000 (₹1,000 if income < ₹5L)', penaltyFixed: 5000, portalUrl: 'https://incometax.gov.in',
  },
  {
    lawName: 'FSSAI', formNumber: 'FSSAI Renewal', title: 'FSSAI License Renewal',
    description: 'Annual renewal of FSSAI food safety license',
    category: DeadlineCategory.INDUSTRY, frequency: DeadlineFrequency.ANNUAL,
    dueDateFormula: 'annual:3:31',
    applicableEntityTypes: [], applicableGstStatuses: [],
    applicableIndustries: [Industry.FOOD], applicableStates: [],
    penaltyFormula: 'Up to ₹5 lakh + closure', penaltyFixed: 500000, portalUrl: 'https://foscos.fssai.gov.in',
  },
];

async function main() {
  console.log('Seeding deadline rules...');
  for (const rule of rules) {
    await prisma.deadlineRule.upsert({
      where: { id: rule.formNumber + '_' + rule.category },
      create: { ...rule, id: rule.formNumber + '_' + rule.category },
      update: rule,
    }).catch(() =>
      prisma.deadlineRule.create({ data: rule })
    );
  }
  console.log(`Seeded ${rules.length} deadline rules`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
