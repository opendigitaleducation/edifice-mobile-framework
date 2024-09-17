import moduleConfig from '~/framework/modules/timeline/module-config';
import {
  AsyncState,
  createAsyncActionCreators,
  createAsyncActionTypes,
  createSessionAsyncReducer,
} from '~/framework/util/redux/async';

// State

export interface IEntcoreFlashMessage {
  color: string | null; // Background color
  contents: {
    // Message content (several languages)
    fr?: string; // French version
    en?: string; // English version
    es?: string; // Spanish version
    de?: string; // German version
    pt?: string; // Portuguese version
    it?: string; // Italian version
    null: string; // Undefined-language version
  };
  customColor: string | null; // Custom background color
  id: number; // Flash message unique ID
  signature: string; // Message signature
  signatureColor: string; // Signature color
  dismiss?: boolean; // Has the user asked for dismiss
}

export type FlashMessagesStateData = IEntcoreFlashMessage[];
export type FlashMessagesState = AsyncState<FlashMessagesStateData>;

// Reducer

const initialState: FlashMessagesStateData = [];

export const actionTypes = {
  ...createAsyncActionTypes(moduleConfig.namespaceActionType('FLASHMESSAGES')),
  dismissRequest: moduleConfig.namespaceActionType('FLASHMESSAGE_DISMISS_REQUEST'),
  dismissReceipt: moduleConfig.namespaceActionType('FLASHMESSAGE_DISMISS_RECEIPT'),
  dismissError: moduleConfig.namespaceActionType('FLASHMESSAGE_DISMISS_ERROR'),
};
export const actions = {
  ...createAsyncActionCreators<FlashMessagesStateData>(actionTypes),
  dismissRequest: (flashMessageId: number) => ({ type: actionTypes.dismissRequest, flashMessageId }),
  dismissReceipt: (flashMessageId: number) => ({ type: actionTypes.dismissReceipt, flashMessageId }),
  dismissError: (flashMessageId: number) => ({ type: actionTypes.dismissError, flashMessageId }),
};

const dismissFlashMessageActionsHandlerMap = {
  [actionTypes.dismissRequest]: (state: FlashMessagesStateData, action) => {
    return state.map(flashMessage =>
      flashMessage.id === action.flashMessageId ? { ...flashMessage, dismiss: true } : flashMessage,
    );
  },
  [actionTypes.dismissReceipt]: (state: FlashMessagesStateData, action) =>
    state.filter(flashMessage => flashMessage.id !== action.flashMessageId),
  [actionTypes.dismissError]: (state: FlashMessagesStateData, action) => {
    return state.map(flashMessage =>
      flashMessage.id === action.flashMessageId ? { ...flashMessage, dismiss: false } : flashMessage,
    );
  },
};

export default createSessionAsyncReducer(initialState, actionTypes, dismissFlashMessageActionsHandlerMap);
