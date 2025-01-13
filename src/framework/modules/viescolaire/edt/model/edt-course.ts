import { ITimetableCourse } from '../../common/components/Timetable';

export interface IEdtCourse extends ITimetableCourse {
  classes: string[];
  groups: string[];
  id: string;
  roomLabels: string[];
  subject: {
    id: string;
    name: string;
    rank: number;
  };
  tags: {
    id: number;
    label: string;
    abbreviation: string;
  }[];
  teacherIds: string[];
}
