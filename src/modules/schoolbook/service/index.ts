/**
 * Schoolbook services
 */
import moment from 'moment';

import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { IResourceUriCaptureFunction } from '~/framework/util/notifications';
import { IUserSession } from '~/framework/util/session';
import { fetchJSONWithCache, signedFetchJson } from '~/infra/fetchWithCache';
import { IStudentAndParentWordList, ITeacherWordList, IWordReport } from '~/modules/schoolbook/reducer';

export type IEntcoreTeacherWordList = IEntcoreReportedWord[];

export interface IEntcoreStudentAndParentWord {
  acknowledgments: IEntcoreAcknowledgment[];
  category: string;
  id: number;
  owner: string;
  owner_name: string;
  reply: boolean;
  responses: IEntcoreResponse[] | null;
  sending_date: string;
  text: string;
  title: string;
}

export type IEntcoreStudentAndParentWordList = IEntcoreStudentAndParentWord[];

export interface IEntcoreAcknowledgment {
  id: number;
  owner: string;
  parent_name: string;
}

export interface IEntcoreResponse {
  comment: string;
  id: number;
  modified: string;
  owner: string;
  parent_name: string;
}

export interface IEntcoreConcernedStudent {
  acknowledgments: IEntcoreAcknowledgment[];
  owner: string;
  owner_name: string;
  responses: IEntcoreResponse[] | null;
}

export interface IEntcoreWord {
  category: string;
  id: number;
  owner_id: string;
  owner_name: string;
  reply: boolean;
  sending_date: string;
  shared: ({ userId?: string; groupId?: string } & any)[] | [];
  text: string;
  title: string;
}

export interface IEntcoreReportedWord extends IEntcoreWord {
  ack_number: number;
  resp_number: number;
  total: number;
}

export interface IEntcoreWordReport {
  report: IEntcoreConcernedStudent[];
  word: IEntcoreReportedWord;
}

export const teacherWordListAdapter = (teacherWordList: IEntcoreTeacherWordList) => {
  const ret = teacherWordList?.map(teacherWord => ({
    ackNumber: teacherWord.ack_number,
    category: teacherWord.category,
    id: teacherWord.id,
    respNumber: teacherWord.resp_number,
    sendingDate: moment(teacherWord.sending_date),
    text: teacherWord.text,
    title: teacherWord.title,
    total: teacherWord.total,
  }));
  return ret as ITeacherWordList;
};

export const studentAndParentWordListAdapter = (studentAndParentWordList: IEntcoreStudentAndParentWordList) => {
  const ret = studentAndParentWordList?.map(studentAndParentWord => ({
    acknowledgments: studentAndParentWord.acknowledgments?.map(acknowledgment => ({
      id: acknowledgment.id,
      owner: acknowledgment.owner,
      parentName: acknowledgment.parent_name,
    })),
    category: studentAndParentWord.category,
    id: studentAndParentWord.id,
    owner: studentAndParentWord.owner,
    ownerName: studentAndParentWord.owner_name,
    responses: studentAndParentWord.responses?.map(response => ({
      comment: response.comment,
      id: response.id,
      modified: moment(response.modified),
      owner: response.owner,
      parentName: response.parent_name,
    })),
    sendingDate: moment(studentAndParentWord.sending_date),
    text: studentAndParentWord.text,
    title: studentAndParentWord.title,
  }));
  return ret as IStudentAndParentWordList;
};

export const wordReportAdapter = (wordReport: IEntcoreWordReport) => {
  const report = wordReport.report;
  const word = wordReport.word;
  const ret = {
    report: report?.map(student => ({
      acknowledgments: student.acknowledgments?.map(acknowledgment => ({
        id: acknowledgment.id,
        owner: acknowledgment.owner,
        parentName: acknowledgment.parent_name,
      })),
      owner: student.owner,
      ownerName: student.owner_name,
      responses: student.responses?.map(response => ({
        comment: response.comment,
        id: response.id,
        modified: moment(response.modified),
        owner: response.owner,
        parentName: response.parent_name,
      })),
    })),
    word: {
      ackNumber: word?.ack_number,
      category: word?.category,
      id: word?.id,
      ownerId: word?.owner_id,
      ownerName: word?.owner_name,
      sendingDate: moment(word?.sending_date),
      text: word?.text,
      title: word?.title,
      total: word?.total,
    },
  };
  return ret as IWordReport;
};

export const schoolbookUriCaptureFunction: IResourceUriCaptureFunction<{ wordId: string }> = url => {
  const wordIdRegex = /^\/schoolbook.+\/word\/(\d+)/;
  const reportIdRegex = /^\/schoolbook.+\/report\/(\d+)/;
  const wordIdMatch = url.match(wordIdRegex);
  return {
    wordId: (wordIdMatch && wordIdMatch[1]) || url.match(reportIdRegex)?.[1],
  };
};

export const schoolbookService = {
  list: {
    teacher: async (session: IUserSession, filter: string, page: number) => {
      const api = `/schoolbook/list`;
      const body = JSON.stringify({ filter, page });
      const entcoreTeacherWordList = signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'POST',
        body,
      }) as unknown as IEntcoreTeacherWordList;
      return teacherWordListAdapter(entcoreTeacherWordList) as ITeacherWordList;
    },
    studentAndParent: async (session: IUserSession, pageNumber: string, studentId: string) => {
      const api = `/schoolbook/list/${pageNumber}/${studentId}`;
      const entcoreStudentAndParentWordList = (await fetchJSONWithCache(api)) as IEntcoreStudentAndParentWordList;
      return studentAndParentWordListAdapter(entcoreStudentAndParentWordList) as IStudentAndParentWordList;
    },
  },
  word: {
    get: async (session: IUserSession, wordId: string) => {
      const api = `/schoolbook/report/${wordId}`;
      const entcoreWordReport = (await fetchJSONWithCache(api)) as IEntcoreWordReport;
      return wordReportAdapter(entcoreWordReport) as IWordReport;
    },
    resend: async (session: IUserSession, wordId: string) => {
      const api = `/schoolbook/word/resend/${wordId}`;
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'POST',
      }) as Promise<{ count: number; word_id: string }>;
    },
    delete: async (session: IUserSession, wordId: string) => {
      const api = `/schoolbook/delete/${wordId}`;
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'DELETE',
      }) as Promise<{ rows: number }>;
    },
    acknowledge: async (session: IUserSession, wordId: string, studentId: string) => {
      const api = `/schoolbook/relation/acknowledge/${wordId}/${studentId}`;
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'POST',
      }) as Promise<{ id: number }>;
    },
    reply: async (session: IUserSession, wordId: string, studentId: string, text: string) => {
      const api = `/schoolbook/relation/reply/${wordId}`;
      const body = JSON.stringify({ studentId, text });
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'POST',
        body,
      }) as Promise<{ response_id: number }>;
    },
    updateReply: async (session: IUserSession, wordId: string, replyId: string, text: string) => {
      const api = `/schoolbook/relation/reply/${wordId}/${replyId}`;
      const body = JSON.stringify({ text });
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'PUT',
        body,
      }) as Promise<{ rows: number }>;
    },
  },
};
