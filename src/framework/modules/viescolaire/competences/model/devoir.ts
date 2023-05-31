import { Moment } from 'moment';

export interface IDevoir {
  coefficient: string;
  competencesCount: number;
  date: Moment;
  diviseur: number;
  id: number;
  isEvaluated: boolean;
  moyenne: string;
  name: string;
  note: string;
  subjectId: string;
  teacher: string;
  termId: number;
  libelle?: string;
}
