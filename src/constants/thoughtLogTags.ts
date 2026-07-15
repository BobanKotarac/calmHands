// Tagovi za log misli – vrednosti u Firestore, labele na srpskom

export type PlaceTag = 'home' | 'work' | 'transport' | 'other';
export type SituationTag = 'social' | 'health' | 'money' | 'work' | 'relationship' | 'other';
export type TimeOfDayTag = 'morning' | 'afternoon' | 'evening' | 'night';

export const PLACE_OPTIONS: { value: PlaceTag; label: string }[] = [
  { value: 'home', label: 'Kuća' },
  { value: 'work', label: 'Posao' },
  { value: 'transport', label: 'Prevoz' },
  { value: 'other', label: 'Ostalo' },
];

export const SITUATION_OPTIONS: { value: SituationTag; label: string }[] = [
  { value: 'social', label: 'Društvo' },
  { value: 'health', label: 'Zdravlje' },
  { value: 'money', label: 'Novac' },
  { value: 'work', label: 'Posao' },
  { value: 'relationship', label: 'Odnos' },
  { value: 'other', label: 'Ostalo' },
];

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDayTag; label: string }[] = [
  { value: 'morning', label: 'Jutro' },
  { value: 'afternoon', label: 'Popodne' },
  { value: 'evening', label: 'Veče' },
  { value: 'night', label: 'Noć' },
];
