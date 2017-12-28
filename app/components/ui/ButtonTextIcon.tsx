import PropTypes from 'prop-types'
import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import styles from '../styles/index'
import { NavIcon } from '..'


export interface ButtonTextIconProps {
    onPress: () => any
    disabled: boolean,
    leftName?: string,
    rightName?: string,
    title: string,
    whiteSpace?: string
}

export const ButtonTextIcon = ({
                                   onPress,
                                   disabled = false,
                                   title,
                                   leftName = '',
                                   rightName = '',
                                   whiteSpace = ' ',
                                   ...props
                               }: ButtonTextIconProps) => {
    return (
        <TouchableOpacity onPress={onPress} disabled={disabled}>
            <Text style={styles.buttonStyle}>
                {leftName.length > 0 && <NavIcon name={leftName} {...props} />}
                {whiteSpace}
                {title}
                {whiteSpace}
                {rightName.length > 0 && <NavIcon name={rightName} {...props} />}
            </Text>
        </TouchableOpacity>
    )
}

