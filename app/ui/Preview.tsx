import * as React from "react"
import { View, Text } from "react-native";
import { Paragraph, A } from "./Typography";
import I18n from "react-native-i18n"

export const Preview = ({ textContent }) => {
    let crop = false;
    let previewText = textContent;
    if (previewText.length > 175) {
        previewText = previewText.substring(0, 172) + "... ";
        crop = true;
    }

    return (
        <View>
            <Paragraph>
                <Text>{ previewText }</Text>
                { crop && <A>{ I18n.t("seeMore") }</A> }
            </Paragraph>
        </View>
    )
}