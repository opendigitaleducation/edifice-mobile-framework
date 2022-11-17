import moment from 'moment';

import { DEPRECATED_getCurrentPlatform } from '~/framework/util/_legacy_appConf';
import { LocalFile } from '~/framework/util/fileHandler';
import { IUserSession } from '~/framework/util/session';
import { fetchJSONWithCache, signedFetchJson } from '~/infra/fetchWithCache';
import {
  DistributionStatus,
  IDistribution,
  IForm,
  IQuestion,
  IQuestionChoice,
  IQuestionResponse,
  IResponseFile,
  ISection,
} from '~/modules/form/reducer';

interface IBackendDistribution {
  id: number;
  form_id: number;
  sender_id: string;
  sender_name: string;
  responder_id: string;
  responder_name: string;
  status: string;
  date_sending: string;
  date_response?: string;
  active: boolean;
  structure?: string;
}

interface IBackendForm {
  id: number;
  title: string;
  description: string;
  picture: string;
  owner_id: string;
  owner_name: string;
  date_creation: string;
  date_modification: string;
  sent: boolean;
  collab: boolean;
  archived: boolean;
  date_opening: string;
  date_ending?: string;
  multiple: boolean;
  anonymous: boolean;
  reminded: boolean;
  response_notified: boolean;
  editable: boolean;
  rgpd: boolean;
  rgpd_goal: string;
  rgpd_lifetime: number;
  is_public: boolean;
  public_key?: number;
}

interface IBackendQuestion {
  id: number;
  form_id: number;
  title: string;
  position?: number;
  question_type: number;
  statement: string;
  mandatory: boolean;
  original_question_id: number;
  section_id: number;
  section_position: number;
  conditional: boolean;
  placeholder?: string;
  matrix_id?: number;
  matrix_position?: number;
  cursor_min_val?: number;
  cursor_max_val?: number;
  cursor_step?: number;
  cursor_label_min_val?: string;
  cursor_label_max_val?: string;
}

interface IBackendQuestionChoice {
  id: number;
  question_id: number;
  value?: string;
  type?: string;
  position?: number;
  next_section_id?: number | null;
}

interface IBackendQuestionResponse {
  id: number;
  question_id: number;
  answer: string;
  responder_id: string;
  choice_id?: number;
  distribution_id: number;
  original_id?: number;
}

interface IBackendResponseFile {
  id: string;
  response_id: number;
  filename: string;
  type: string;
}

interface IBackendSection {
  id: number;
  form_id: number;
  title: string;
  description: string;
  position: number;
  original_section_id?: number;
}

type IBackendDistributionList = IBackendDistribution[];
type IBackendFormList = IBackendForm[];
type IBackendQuestionList = IBackendQuestion[];
type IBackendQuestionChoiceList = IBackendQuestionChoice[];
type IBackendQuestionResponseList = IBackendQuestionResponse[];
type IBackendResponseFileList = IBackendResponseFile[];
type IBackendSectionList = IBackendSection[];

const distributionAdapter: (data: IBackendDistribution) => IDistribution = data => {
  return {
    id: data.id,
    formId: data.form_id,
    senderId: data.sender_id,
    senderName: data.sender_name,
    responderId: data.responder_id,
    responderName: data.responder_name,
    status: data.status as DistributionStatus,
    dateSending: moment(data.date_sending),
    dateResponse: moment(data.date_response),
    active: data.active,
    structure: data.structure,
  } as IDistribution;
};

const formAdapter: (data: IBackendForm) => IForm = data => {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    picture: data.picture,
    ownerName: data.owner_name,
    archived: data.archived,
    multiple: data.multiple,
    editable: data.editable,
  } as IForm;
};

const questionAdapter: (data: IBackendQuestion) => IQuestion = data => {
  return {
    id: data.id,
    formId: data.form_id,
    title: data.title,
    position: data.position,
    type: data.question_type,
    statement: data.statement,
    mandatory: data.mandatory,
    sectionId: data.section_id,
    conditional: data.conditional,
    placeholder: data.placeholder,
    cursorMinVal: data.cursor_min_val,
    cursorMaxVal: data.cursor_max_val,
    cursorStep: data.cursor_step,
    cursorLabelMinVal: data.cursor_label_min_val,
    cursorLabelMaxVal: data.cursor_label_max_val,
  } as IQuestion;
};

const questionChoiceAdapter: (data: IBackendQuestionChoice) => IQuestionChoice = data => {
  return {
    id: data.id,
    questionId: data.question_id,
    value: data.value,
    type: data.type,
    position: data.position,
    nextSectionId: data.next_section_id,
  } as IQuestionChoice;
};

const questionResponseAdapter: (data: IBackendQuestionResponse) => IQuestionResponse = data => {
  return {
    id: data.id,
    questionId: data.question_id,
    answer: data.answer,
    choiceId: data.choice_id,
  } as IQuestionResponse;
};

const responseFileAdapter: (data: IBackendResponseFile) => IResponseFile = data => {
  return {
    id: data.id,
    responseId: data.response_id,
    filename: data.filename,
    type: data.type,
  } as IResponseFile;
};

const sectionAdapter: (data: IBackendSection) => ISection = data => {
  return {
    id: data.id,
    formId: data.form_id,
    title: data.title,
    description: data.description,
    position: data.position,
  } as ISection;
};

export const formService = {
  distributions: {
    listMine: async (session: IUserSession) => {
      const api = '/formulaire/distributions/listMine';
      const distributions = (await fetchJSONWithCache(api)) as IBackendDistributionList;
      return distributions.map(distribution => distributionAdapter(distribution)) as IDistribution[];
    },
  },
  distribution: {
    get: async (session: IUserSession, distributionId: number) => {
      const api = `/formulaire/distributions/${distributionId}`;
      const distribution = (await fetchJSONWithCache(api)) as IBackendDistribution;
      return distributionAdapter(distribution) as IDistribution;
    },
    add: async (session: IUserSession, distributionId: number) => {
      const api = `/formulaire/distributions/${distributionId}/add`;
      const distribution = (await fetchJSONWithCache(api, { method: 'post' })) as IBackendDistribution;
      return distributionAdapter(distribution) as IDistribution;
    },
    getResponses: async (session: IUserSession, distributionId: number) => {
      const api = `/formulaire/distributions/${distributionId}/responses`;
      const responses = (await fetchJSONWithCache(api)) as IBackendQuestionResponseList;
      return responses.map(response => questionResponseAdapter(response)) as IQuestionResponse[];
    },
    deleteQuestionResponses: async (session: IUserSession, distributionId: number, questionId: number) => {
      const api = `/formulaire/responses/${distributionId}/questions/${questionId}`;
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'DELETE',
      }) as Promise<[]>;
    },
    put: async (session: IUserSession, distribution: IDistribution) => {
      const api = `/formulaire/distributions/${distribution.id}`;
      const body = JSON.stringify(distribution);
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        body,
        method: 'PUT',
      }) as Promise<IDistribution>;
    },
  },
  forms: {
    getReceived: async (session: IUserSession) => {
      const api = '/formulaire/forms/sent';
      const forms = (await fetchJSONWithCache(api)) as IBackendFormList;
      return forms.map(form => formAdapter(form)) as IForm[];
    },
  },
  form: {
    getElementsCount: async (session: IUserSession, formId: number) => {
      const api = `/formulaire/forms/${formId}/elements/count`;
      const data = (await fetchJSONWithCache(api)) as { count: number };
      return data.count;
    },
    getQuestions: async (session: IUserSession, formId: number) => {
      const api = `/formulaire/forms/${formId}/questions`;
      const questions = (await fetchJSONWithCache(api)) as IBackendQuestionList;
      return questions.map(question => questionAdapter(question)) as IQuestion[];
    },
    getSections: async (session: IUserSession, formId: number) => {
      const api = `/formulaire/forms/${formId}/sections`;
      const sections = (await fetchJSONWithCache(api)) as IBackendSectionList;
      return sections.map(section => sectionAdapter(section)) as ISection[];
    },
  },
  questions: {
    getAllChoices: async (session: IUserSession, questionIds: number[]) => {
      let api = `/formulaire/questions/choices/all?`;
      questionIds.forEach((value, index) => (api += `${index}=${value}&`));
      const choices = (await fetchJSONWithCache(api)) as IBackendQuestionChoiceList;
      return choices.map(choice => questionChoiceAdapter(choice)) as IQuestionChoice[];
    },
  },
  question: {
    createResponse: async (
      session: IUserSession,
      questionId: number,
      distributionId: number,
      choiceId: number | null,
      answer: string,
    ) => {
      const api = `/formulaire/questions/${questionId}/responses`;
      const body = JSON.stringify({
        question_id: questionId,
        distribution_id: distributionId,
        choice_id: choiceId,
        answer,
        responder_id: session.user.id,
      });
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'POST',
        body,
      }) as Promise<IQuestionResponse>;
    },
    getChoices: async (session: IUserSession, questionId: number) => {
      const api = `/formulaire/questions/${questionId}/choices`;
      const choices = (await fetchJSONWithCache(api)) as IBackendQuestionChoiceList;
      return choices.map(choice => questionChoiceAdapter(choice)) as IQuestionChoice[];
    },
    getDistributionResponses: async (session: IUserSession, questionId: number, distributionId: number) => {
      const api = `/formulaire/questions/${questionId}/distributions/${distributionId}/responses`;
      const responses = (await fetchJSONWithCache(api)) as IBackendQuestionResponseList;
      return responses.map(response => questionResponseAdapter(response)) as IQuestionResponse[];
    },
  },
  response: {
    put: async (
      session: IUserSession,
      responseId: number,
      distributionId: number,
      questionId: number,
      choiceId: number | null,
      answer: string,
    ) => {
      const api = `/formulaire/responses/${responseId}`;
      const body = JSON.stringify({
        distribution_id: distributionId,
        question_id: questionId,
        choice_id: choiceId,
        answer,
        reponder_id: session.user.id,
      });
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'PUT',
        body,
      }) as Promise<IQuestionResponse>;
    },
    getFiles: async (session: IUserSession, responseId: number) => {
      const api = `/formulaire/responses/${responseId}/files/all`;
      const files = (await fetchJSONWithCache(api)) as IBackendResponseFileList;
      return files.map(file => responseFileAdapter(file)) as IResponseFile[];
    },
    addFile: async (session: IUserSession, responseId: number, file: LocalFile) => {
      const api = `/formulaire/responses/${responseId}/files`;
      const formdata = new FormData();
      formdata.append('file', {
        fileId: file.filepath,
        name: file.filename,
        type: file.filetype,
      });
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        body: formdata,
        method: 'POST',
      }) as Promise<[]>;
    },
    deleteFiles: async (session: IUserSession, responseId: number) => {
      const api = `/formulaire/responses/${responseId}/files`;
      return signedFetchJson(`${DEPRECATED_getCurrentPlatform()!.url}${api}`, {
        method: 'DELETE',
      }) as Promise<[]>;
    },
  },
  section: {
    getQuestions: async (session: IUserSession, sectionId: number) => {
      const api = `/formulaire/sections/${sectionId}/questions`;
      const questions = (await fetchJSONWithCache(api)) as IBackendQuestionList;
      return questions.map(question => questionAdapter(question)) as IQuestion[];
    },
  },
};