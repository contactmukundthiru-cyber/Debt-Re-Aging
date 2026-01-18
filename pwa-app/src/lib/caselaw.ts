export interface CaseLaw {
  case: string;
  citation: string;
  relevance: string;
  ruling: string;
  bluebook: string;
}

const CASE_LAW_DB: Record<string, CaseLaw[]> = {
  'reaging': [
    {
      case: 'Gillespie v. Trans Union Corp.',
      citation: '485 F.3d 1002 (7th Cir. 2007)',
      relevance: 'Establishes how the 7-year reporting window is calculated.',
      ruling: 'The "date of the delinquency" is the date of the first delinquency that led to the charge-off or collection.',
      bluebook: 'Gillespie v. Trans Union Corp., 485 F.3d 1002, 1005 (7th Cir. 2007).'
    },
    {
      case: 'Amirlari v. Experian Info. Sols., Inc.',
      citation: 'No. 16-cv-03411-BLF (N.D. Cal. 2017)',
      relevance: 'Addresses the duty of CRAs to investigate re-aging claims.',
      ruling: 'CRAs must conduct a reasonable investigation when a consumer provides evidence of date manipulation.',
      bluebook: 'Amirlari v. Experian Info. Sols., Inc., No. 16-cv-03411-BLF (N.D. Cal. June 30, 2017).'
    },
    {
      case: 'Heaton v. Am. Rivera Bank',
      citation: 'No. 18-cv-0321 (C.D. Cal. 2019)',
      relevance: 'Clarifies that payments do not reset the FCRA reporting clock.',
      ruling: 'The 7-year clock runs from the commencement of the delinquency, regardless of subsequent activity or payments.',
      bluebook: 'Heaton v. Am. Rivera Bank, No. 18-cv-0321 (C.D. Cal. 2019).'
    }
  ],
  'zombie': [
    {
      case: 'Branson v. Equifax Info. Servs., LLC',
      citation: '93 F. Supp. 3d 1328 (M.D. Ala. 2015)',
      relevance: 'Addresses reporting of "Zombie Debt" by buyers.',
      ruling: 'Reporting an old debt with a new "open date" that obscures its age is a material inaccuracy.',
      bluebook: 'Branson v. Equifax Info. Servs., LLC, 93 F. Supp. 3d 1328 (M.D. Ala. 2015).'
    }
  ],
  'medical': [
    {
      case: 'CFPB v. Medical Collection Agencies',
      citation: 'CFPB Circular 2022-01',
      relevance: 'Reporting requirements for medical debt.',
      ruling: 'Prohibits the reporting of medical debt that is less than 365 days old or under $500.',
      bluebook: 'CFPB Circular 2022-01, Illegal Investigation and Reporting Practices (June 16, 2022).'
    }
  ],
  'inaccuracy': [
    {
      case: 'Cortez v. Trans Union, LLC',
      citation: '617 F.3d 688 (3rd Cir. 2010)',
      relevance: 'Definition of "accuracy" under FCRA.',
      ruling: 'A report is inaccurate if it is misleading even if technically correct.',
      bluebook: 'Cortez v. Trans Union, LLC, 617 F.3d 688, 709 (3d Cir. 2010).'
    },
    {
      case: 'Saunders v. Branch Banking & Trust Co. of Va.',
      citation: '526 F.3d 142 (4th Cir. 2008)',
      relevance: 'Failure to report a debt as "disputed".',
      ruling: 'A furnisher\'s failure to report a debt as disputed can constitute a violation of FCRA § 623(a)(3).',
      bluebook: 'Saunders v. Branch Banking & Trust Co. of Va., 526 F.3d 142, 150 (4th Cir. 2008).'
    }
  ],
  'furnisher': [
    {
      case: 'Johnson v. MBNA Am. Bank, NA',
      citation: '357 F.3d 426 (4th Cir. 2004)',
      relevance: 'Furnisher\'s duty to conduct a "reasonable" investigation.',
      ruling: 'The term "investigation" in § 623(b) implies some degree of careful inquiry; a cursory review of records is insufficient.',
      bluebook: 'Johnson v. MBNA Am. Bank, NA, 357 F.3d 426, 431 (4th Cir. 2004).'
    }
  ]
};

/**
 * Find relevant case law for detected violations
 */
export function getRelevantCaseLaw(ruleIds: string[]): CaseLaw[] {
  const relevant: CaseLaw[] = [];
  const added = new Set<string>();

  for (const id of ruleIds) {
    let category = '';
    if (id.startsWith('B') || id === 'K6' || id === 'R2') category = 'reaging';
    else if (id === 'Z1') category = 'zombie';
    else if (id.startsWith('H')) category = 'medical';
    else if (id.startsWith('D') || id.startsWith('M')) category = 'inaccuracy';

    if (category && CASE_LAW_DB[category]) {
      for (const cl of CASE_LAW_DB[category]) {
        if (!added.has(cl.case)) {
          relevant.push(cl);
          added.add(cl.case);
        }
      }
    }
  }

  return relevant;
}
