import * as React from "react"
import { Provider } from "react-redux"
import AppScreen from "./connectors/AppScreen"
import configureStore from "./store"

export class AppStore extends React.Component {
	public store = configureStore()

	public render() {
		return (
			<Provider store={this.store}>
				<AppScreen/>
			</Provider>
		)
	}
}
