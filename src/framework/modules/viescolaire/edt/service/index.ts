import moment, { Moment } from 'moment';

import { ISession } from '~/framework/modules/auth/model';
import { IClass, IEdtCourse, ISlot, IUserChild } from '~/framework/modules/viescolaire/edt/model';
import { fetchJSONWithCache } from '~/infra/fetchWithCache';

type IBackendClass = {
  notEmptyClass: boolean;
  name: string;
  externalId: string;
  id: string;
  source: string;
  type_groupe: number;
  color: string;
};

type IBackendCourse = {
  _id: string;
  structureId: string;
  subjectId: string;
  teacherIds: string[];
  tagIds: number[];
  classes: string[];
  classesExternalIds: string[];
  groups: string[];
  groupsExternalIds: string[];
  roomLabels: string[];
  dayOfWeek: number;
  manual: boolean;
  theoretical: boolean;
  updated: string;
  lastUser: string;
  recurrence: string;
  idStartSlot: string;
  idEndSlot: string;
  startDate: string;
  endDate: string;
  subject: {
    id: string;
    code: string;
    externalId: string;
    name: string;
    rank: number;
  };
  color: string;
  is_periodic: boolean;
  startCourse: string;
  endCourse: string;
  tags: {
    id: number;
    structureId: string;
    label: string;
    abbreviation: string;
    isPrimary: boolean;
    allowRegister: boolean;
    isHidden: boolean;
    isUsed: boolean;
    createdAt: string;
  }[];
};

type IBackendSlot = {
  name: string;
  startHour: string;
  endHour: string;
  id: string;
};

type IBackendUserChild = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  classes: string[];
  idClasses: string[];
  structures: {
    id: string;
    name: string;
  }[];
};

type IBackendClassList = IBackendClass[];
type IBackendCourseList = IBackendCourse[];
type IBackendSlotList = IBackendSlot[];
type IBackendUserChildren = IBackendUserChild[];

const classAdapter = (data: IBackendClass): IClass => {
  return {
    color: data.color,
    groupType: data.type_groupe,
    id: data.id,
    name: data.name,
    notEmptyClass: data.notEmptyClass,
  } as IClass;
};

const courseAdapter = (data: IBackendCourse): IEdtCourse => {
  return {
    classes: data.classes,
    endDate: moment(data.endDate),
    groups: data.groups,
    id: data._id,
    roomLabels: data.roomLabels,
    startDate: moment(data.startDate),
    subject: data.subject,
    tags: data.tags,
    teacherIds: data.teacherIds,
  } as IEdtCourse;
};

const slotAdapter = (data: IBackendSlot): ISlot => {
  return {
    endHour: moment('2000-01-01 ' + data.endHour + ':00'),
    id: data.id,
    name: data.name,
    startHour: moment('2000-01-01 ' + data.startHour + ':00'),
  } as ISlot;
};

const userChildAdapter = (data: IBackendUserChild): IUserChild => {
  return {
    classes: data.classes,
    displayName: data.displayName,
    firstName: data.firstName,
    id: data.id,
    idClasses: data.idClasses,
    lastName: data.lastName,
  } as IUserChild;
};

export const edtService = {
  classes: {
    get: async (session: ISession, structureId: string) => {
      const api = `/viescolaire/classes?idEtablissement=${structureId}&isEdt=true`;
      const classes = (await fetchJSONWithCache(api)) as IBackendClassList;
      return classes.map(c => classAdapter(c)) as IClass[];
    },
  },
  courses: {
    get: async (
      session: ISession,
      structureId: string,
      startDate: Moment,
      endDate: Moment,
      groupIds: string[],
      groupNames: string[],
    ) => {
      const startDateString = startDate.format('YYYY-MM-DD');
      const endDateString = endDate.format('YYYY-MM-DD');
      const api = `/edt/structures/${structureId}/common/courses/${startDateString}/${endDateString}`;
      const body = JSON.stringify({
        teacherIds: [],
        union: true,
        groupExternalIds: [],
        groupIds,
        groupNames,
      });
      const courses = (await fetchJSONWithCache(api, {
        method: 'POST',
        body,
      })) as IBackendCourseList;
      return courses.map(course => courseAdapter(course)) as IEdtCourse[];
    },
    getFromTeacher: async (session: ISession, structureId: string, startDate: Moment, endDate: Moment, teacherId: string) => {
      const startDateString = startDate.format('YYYY-MM-DD');
      const endDateString = endDate.format('YYYY-MM-DD');
      const api = `/edt/structures/${structureId}/common/courses/${startDateString}/${endDateString}`;
      const body = JSON.stringify({
        teacherIds: [teacherId],
        union: true,
        groupExternalIds: [],
        groupIds: [],
        groupNames: [],
      });
      const courses = (await fetchJSONWithCache(api, {
        method: 'POST',
        body,
      })) as IBackendCourseList;
      return courses.map(course => courseAdapter(course)) as IEdtCourse[];
    },
  },
  slots: {
    get: async (session: ISession, structureId: string) => {
      const api = `/edt/time-slots?structureId=${structureId}`;
      const slots = (await fetchJSONWithCache(api)) as IBackendSlotList;
      return slots.map(slot => slotAdapter(slot)) as ISlot[];
    },
  },
  userChildren: {
    get: async (session: ISession) => {
      const api = '/edt/user/children';
      const userChildren = (await fetchJSONWithCache(api)) as IBackendUserChildren;
      return userChildren.map(child => userChildAdapter(child)) as IUserChild[];
    },
  },
};
