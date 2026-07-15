export type Mudra = {
  id: string;
  titleKey: string;
  summaryKey: string;
  howKey: string;
  breathKey: string;
  focusKey: string;
  mistakeKeys: string[];
  benefitKeys: string[];
  keywordKeys: string[];
  cautionKey?: string;
  durationMinDefault: number;
};

export const MUDRAS: Mudra[] = [
  {
    id: 'gyan',
    titleKey: 'mudras.gyan.title',
    summaryKey: 'mudras.gyan.summary',
    howKey: 'mudras.gyan.how',
    breathKey: 'mudras.gyan.breath',
    focusKey: 'mudras.gyan.focus',
    mistakeKeys: ['mudras.gyan.mistake_0', 'mudras.gyan.mistake_1', 'mudras.gyan.mistake_2'],
    benefitKeys: ['mudras.gyan.benefit_0', 'mudras.gyan.benefit_1'],
    keywordKeys: ['mudras.gyan.keyword_0', 'mudras.gyan.keyword_1', 'mudras.gyan.keyword_2', 'mudras.gyan.keyword_3'],
    cautionKey: 'mudras.gyan.caution',
    durationMinDefault: 10,
  },
  {
    id: 'prana',
    titleKey: 'mudras.prana.title',
    summaryKey: 'mudras.prana.summary',
    howKey: 'mudras.prana.how',
    breathKey: 'mudras.prana.breath',
    focusKey: 'mudras.prana.focus',
    mistakeKeys: ['mudras.prana.mistake_0', 'mudras.prana.mistake_1', 'mudras.prana.mistake_2'],
    benefitKeys: ['mudras.prana.benefit_0', 'mudras.prana.benefit_1'],
    keywordKeys: ['mudras.prana.keyword_0', 'mudras.prana.keyword_1', 'mudras.prana.keyword_2', 'mudras.prana.keyword_3'],
    cautionKey: 'mudras.prana.caution',
    durationMinDefault: 7,
  },
  {
    id: 'apana',
    titleKey: 'mudras.apana.title',
    summaryKey: 'mudras.apana.summary',
    howKey: 'mudras.apana.how',
    breathKey: 'mudras.apana.breath',
    focusKey: 'mudras.apana.focus',
    mistakeKeys: ['mudras.apana.mistake_0', 'mudras.apana.mistake_1', 'mudras.apana.mistake_2'],
    benefitKeys: ['mudras.apana.benefit_0', 'mudras.apana.benefit_1'],
    keywordKeys: ['mudras.apana.keyword_0', 'mudras.apana.keyword_1', 'mudras.apana.keyword_2', 'mudras.apana.keyword_3', 'mudras.apana.keyword_4'],
    cautionKey: 'mudras.apana.caution',
    durationMinDefault: 10,
  },
  {
    id: 'dhyana',
    titleKey: 'mudras.dhyana.title',
    summaryKey: 'mudras.dhyana.summary',
    howKey: 'mudras.dhyana.how',
    breathKey: 'mudras.dhyana.breath',
    focusKey: 'mudras.dhyana.focus',
    mistakeKeys: ['mudras.dhyana.mistake_0', 'mudras.dhyana.mistake_1', 'mudras.dhyana.mistake_2'],
    benefitKeys: ['mudras.dhyana.benefit_0', 'mudras.dhyana.benefit_1'],
    keywordKeys: ['mudras.dhyana.keyword_0', 'mudras.dhyana.keyword_1', 'mudras.dhyana.keyword_2', 'mudras.dhyana.keyword_3'],
    cautionKey: 'mudras.dhyana.caution',
    durationMinDefault: 10,
  },
  {
    id: 'anjali',
    titleKey: 'mudras.anjali.title',
    summaryKey: 'mudras.anjali.summary',
    howKey: 'mudras.anjali.how',
    breathKey: 'mudras.anjali.breath',
    focusKey: 'mudras.anjali.focus',
    mistakeKeys: ['mudras.anjali.mistake_0', 'mudras.anjali.mistake_1', 'mudras.anjali.mistake_2'],
    benefitKeys: ['mudras.anjali.benefit_0', 'mudras.anjali.benefit_1'],
    keywordKeys: ['mudras.anjali.keyword_0', 'mudras.anjali.keyword_1', 'mudras.anjali.keyword_2', 'mudras.anjali.keyword_3', 'mudras.anjali.keyword_4'],
    cautionKey: 'mudras.anjali.caution',
    durationMinDefault: 2,
  },
  {
    id: 'shuni',
    titleKey: 'mudras.shuni.title',
    summaryKey: 'mudras.shuni.summary',
    howKey: 'mudras.shuni.how',
    breathKey: 'mudras.shuni.breath',
    focusKey: 'mudras.shuni.focus',
    mistakeKeys: ['mudras.shuni.mistake_0', 'mudras.shuni.mistake_1', 'mudras.shuni.mistake_2'],
    benefitKeys: ['mudras.shuni.benefit_0', 'mudras.shuni.benefit_1'],
    keywordKeys: ['mudras.shuni.keyword_0', 'mudras.shuni.keyword_1', 'mudras.shuni.keyword_2', 'mudras.shuni.keyword_3', 'mudras.shuni.keyword_4'],
    durationMinDefault: 7,
  },
  {
    id: 'surya',
    titleKey: 'mudras.surya.title',
    summaryKey: 'mudras.surya.summary',
    howKey: 'mudras.surya.how',
    breathKey: 'mudras.surya.breath',
    focusKey: 'mudras.surya.focus',
    mistakeKeys: ['mudras.surya.mistake_0', 'mudras.surya.mistake_1', 'mudras.surya.mistake_2'],
    benefitKeys: ['mudras.surya.benefit_0', 'mudras.surya.benefit_1'],
    keywordKeys: ['mudras.surya.keyword_0', 'mudras.surya.keyword_1', 'mudras.surya.keyword_2', 'mudras.surya.keyword_3', 'mudras.surya.keyword_4'],
    cautionKey: 'mudras.surya.caution',
    durationMinDefault: 5,
  },
  {
    id: 'buddhi',
    titleKey: 'mudras.buddhi.title',
    summaryKey: 'mudras.buddhi.summary',
    howKey: 'mudras.buddhi.how',
    breathKey: 'mudras.buddhi.breath',
    focusKey: 'mudras.buddhi.focus',
    mistakeKeys: ['mudras.buddhi.mistake_0', 'mudras.buddhi.mistake_1', 'mudras.buddhi.mistake_2'],
    benefitKeys: ['mudras.buddhi.benefit_0', 'mudras.buddhi.benefit_1'],
    keywordKeys: ['mudras.buddhi.keyword_0', 'mudras.buddhi.keyword_1', 'mudras.buddhi.keyword_2', 'mudras.buddhi.keyword_3', 'mudras.buddhi.keyword_4'],
    durationMinDefault: 5,
  },
];
