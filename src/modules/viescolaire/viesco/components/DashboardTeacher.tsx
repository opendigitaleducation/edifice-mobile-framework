import I18n from 'i18n-js';
import * as React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { NavigationActions } from 'react-navigation';

import { Text } from '~/framework/components/text';
import CallList from '~/modules/viescolaire/presences/containers/TeacherCallList';
import { BottomColoredItem } from '~/modules/viescolaire/viesco/components/Item';
import StructurePicker from '~/modules/viescolaire/viesco/containers/StructurePicker';
import { CommonStyles } from '~/styles/common/styles';
import { PageContainer } from '~/ui/ContainerContent';

const styles = StyleSheet.create({
  dashboardPart: { paddingVertical: 8, paddingHorizontal: 15 },
  coursesPart: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: CommonStyles.elevation,
    shadowColor: CommonStyles.shadowColor,
    shadowOffset: CommonStyles.shadowOffset,
    shadowOpacity: CommonStyles.shadowOpacity,
    shadowRadius: CommonStyles.shadowRadius,
    marginBottom: 10,
  },
  coursesPartHeight: {
    height: 'auto',
  },
  coursesPartHeightDefined: {
    height: 400,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  gridButtonContainer: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: CommonStyles.elevation,
    shadowColor: CommonStyles.shadowColor,
    shadowOffset: CommonStyles.shadowOffset,
    shadowOpacity: CommonStyles.shadowOpacity,
    shadowRadius: CommonStyles.shadowRadius,
  },
  gridButton: {
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#FFF',
  },
  gridButtonEnabled: {
    opacity: 1,
  },
  gridButtonDisabled: {
    opacity: 0.6,
  },
  gridButtonImage: {
    height: 70,
    width: 70,
  },
});

interface ImageButtonProps {
  imageSrc: string;
  color: string;
  text: string;
  onPress: any;
  disabled?: boolean;
}

const ImageButtonModule = ({ imageSrc, color, text, onPress, disabled }: ImageButtonProps) => {
  return (
    <View style={styles.gridButtonContainer}>
      <BottomColoredItem
        shadow
        style={[styles.gridButton, disabled ? styles.gridButtonDisabled : styles.gridButtonEnabled]}
        color={color}
        onPress={onPress}
        disabled={disabled}>
        <Image source={imageSrc} style={styles.gridButtonImage} resizeMode="contain" />
        <Text>{text}</Text>
      </BottomColoredItem>
    </View>
  );
};

export default props => {
  return (
    <PageContainer>
      <ScrollView overScrollMode="never" bounces={false}>
        <View
          style={[
            styles.coursesPart,
            props.authorizedViescoApps.presences ? styles.coursesPartHeightDefined : styles.coursesPartHeight,
          ]}>
          <StructurePicker />
          {props.authorizedViescoApps.presences && <CallList {...props} />}
        </View>
        <View style={styles.dashboardPart}>
          <View style={styles.grid}>
            {props.authorizedViescoApps.edt && (
              <ImageButtonModule
                onPress={() => props.navigation.navigate('Timetable')}
                text={I18n.t('viesco-timetable')}
                color="#162EAE"
                imageSrc={require('ASSETS/viesco/edt.png')}
              />
            )}
            {props.authorizedViescoApps.diary && (
              <ImageButtonModule
                onPress={() =>
                  props.navigation.navigate(
                    'cdt',
                    {},
                    NavigationActions.navigate({
                      routeName: 'CdtTeachers',
                    }),
                  )
                }
                text={I18n.t('Homework')}
                color="#2BAB6F"
                imageSrc={require('ASSETS/viesco/cdt.png')}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </PageContainer>
  );
};
