import { combineReducers } from "redux";

import filter from "./filter";
import messages, { IConversationMessageList, IConversationMessage } from "./messages";
import threadList, { IConversationThread, IConversationThreadList } from "./threadList";
import threadSelected from "./threadSelected";
import receiversDisplay, { IConversationReceiverList } from "./receiversDisplay";
import users from "./users";

const rootReducer = combineReducers({
  filter,
  messages,
  threadList,
  threadSelected,
  receiversDisplay,
  users
});
export { IConversationMessageList, IConversationMessage, IConversationReceiverList, IConversationThread, IConversationThreadList }
export default rootReducer;
