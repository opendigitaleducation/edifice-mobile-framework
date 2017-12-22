import * as React from "react";
import { View, WebView, TextInput, KeyboardAvoidingView, TouchableHighlight } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Portal } from "./Portal";
import { Thread } from "../model/Thread";
import { ReadMailStyle } from "../styles/ReadMail";
import { StyleConf, navOptions } from "../styles/StyleConf";
import { DocFile } from "../model/Documents";

interface ReadMailState{
    newMessage: string,
    html: string,
    imagePath: string;
}

export class ReadMail extends React.Component<{ navigation: any, inbox: any }, ReadMailState> {
    document: DocFile;
    thread: Thread;
    webView: any;

    static navigationOptions = ({ navigation }) => navOptions(navigation.state.params.name);

    constructor(props){
        super(props);
        this.thread = props.inbox.threads.find(t => t.id === props.navigation.state.params.id);
        this.document = new DocFile();
        this.state = {
            newMessage: '',
            html: this.thread.html,
            imagePath: undefined
        };
    }

    async openCamera(){
        await this.document.openCamera();
        this.thread.temporarySendImage(this.document.uri, this.webView);
        this.setState({ html: this.thread.html, imagePath: this.document.uri });
        setTimeout(() => this.document.uploadImage().then(() => this.thread.sendImage(this.document.path)), 50);
    }

    render(){
        return (
            <Portal navigation={ this.props.navigation }>
                <KeyboardAvoidingView style={ ReadMailStyle.view } keyboardVerticalOffset={ StyleConf.navbarheight }>
                    <WebView style={ ReadMailStyle.webview } source={ { html: this.state.html, baseUrl: 'web/' } } ref={(webView) => this.webView = webView} />
                    <View style={ ReadMailStyle.inputView }>
                        <TouchableHighlight onPress={ () => this.openCamera() } style={ { backgroundColor: '#fff' } } underlayColor={ '#fff' }>
                            <Icon name="camera" size={ 30 } color={ StyleConf.primary } style={ ReadMailStyle.icon } />
                        </TouchableHighlight>
                        <TextInput underlineColorAndroid="transparent" placeholder="Ecrivez un message..." style={ ReadMailStyle.input } onChangeText={(value) => this.setState({ newMessage: value }) } />
                    </View>
                </KeyboardAvoidingView>
            </Portal>
        )
    }
}