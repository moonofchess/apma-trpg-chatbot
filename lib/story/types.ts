export type StatKey = '침식률' | '기안력' | '통찰력' | '정치력' | '생존력' | '호감도';

export type StatDelta = Partial<Record<StatKey, number>>;

export type ChoiceResultType = 'correct' | 'death' | 'penalty' | 'neutral';

export type ChoiceResult = {
  type: ChoiceResultType;
  lines: string[];
  stats?: StatDelta;
  nextId: string; // 'RETRY' = current node again
};

export type Choice = {
  label: 'A' | 'B' | 'C';
  text: string;
  badge?: string;
  result: ChoiceResult;
};

export type StoryNode = {
  id: string;
  sessionId: string;
  tag?: string;
  title?: string;
  time?: string;
  lines: string[];
  systemMessages?: string[];
  statsOnEnter?: StatDelta;
  horrorMode?: boolean;
  choices?: Choice[];
  nextId?: string;
  sessionClear?: number;
};

export type Session = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  firstNodeId: string;
};

export const DEFAULT_STATS: Record<StatKey, number> = {
  침식률: 0,
  기안력: 0,
  통찰력: 0,
  정치력: 0,
  생존력: 0,
  호감도: 0,
};
