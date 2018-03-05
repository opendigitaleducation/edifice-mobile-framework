import { login } from "../actions/auth"
import { error } from "../actions/docs"
import { CREATE_ERROR, CREATE_SUCCESS } from "../constants/docs"
import { PATH_AUTH, PATH_LOGIN, PATH_LOGOUT, PATH_RECOVER_PASSWORD, PATH_SIGNUP } from "../constants/paths"
import { navigate } from "../utils/navHelper";
import { clearConversation } from '../actions/conversation';
import { clearTimeline } from '../actions/timeline';
import { Connection } from "../infra/Connection";
import { getLogin } from "../utils/Store";
import { readCurrentUser } from '../actions/users';

let initAuth = false

async function auth(dispatch) {
	try {
		const { email = "", password = "" } = await getLogin()

		if (email && password) {
			if(Connection.isOnline){
				login(dispatch)(email, password);
			}
			else{
				readCurrentUser(dispatch)();
			}
		}
		else{
			navigate("Login", { email: "" });
		}
		
	} catch (e) {
		navigate("Login", { email: "" })
	}
}

export default store => next => action => {
	try {
		
		if (action.type === PATH_AUTH) {
			auth(store.dispatch)
			initAuth = true
		}

		const returnValue = next(action)

		return returnValue
	} catch (ex) {
		store.dispatch(error(-1, ex.message))
	}
}
