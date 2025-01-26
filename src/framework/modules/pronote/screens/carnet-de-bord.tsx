import * as React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';

import type { NativeStackNavigationOptions, NativeStackScreenProps } from '@react-navigation/native-stack';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';

import { I18n } from '~/app/i18n';
import { IGlobalState } from '~/app/store';
import theme from '~/app/theme';
import SecondaryButton from '~/framework/components/buttons/secondary';
import { OverviewCard, TouchableOverviewCard } from '~/framework/components/card';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyScreen } from '~/framework/components/empty-screens';
import { PageView } from '~/framework/components/page';
import type { PictureProps } from '~/framework/components/picture';
import { BodyBoldText, SmallBoldText, SmallText } from '~/framework/components/text';
import UserList, { IUserListItem } from '~/framework/components/UserList';
import { ContentLoader } from '~/framework/hooks/loader';
import type { AuthLoggedAccount } from '~/framework/modules/auth/model';
import { getSession } from '~/framework/modules/auth/reducer';
import { loadCarnetDeBordAction } from '~/framework/modules/pronote/actions/carnet-de-bord';
import {
  CarnetDeBordSection,
  formatCarnetDeBordCompetencesValue,
  formatCarnetDeBordReleveDeNotesDevoirNoteBareme,
  formatCarnetDeBordVieScolaireType,
  getSummaryItem,
  ICarnetDeBord,
  PronoteCdbInitError,
} from '~/framework/modules/pronote/model/carnet-de-bord';
import moduleConfig from '~/framework/modules/pronote/module-config';
import { PronoteNavigationParams, pronoteRouteNames } from '~/framework/modules/pronote/navigation';
import { ICarnetDeBordStateData } from '~/framework/modules/pronote/reducer/carnet-de-bord';
import redirect from '~/framework/modules/pronote/service/redirect';
import { preferences } from '~/framework/modules/pronote/storage';
import { navBarOptions } from '~/framework/navigation/navBar';
import { displayDate } from '~/framework/util/date';
import { tryActionLegacy } from '~/framework/util/redux/actions';

export interface CarnetDeBordScreenDataProps {
  session?: AuthLoggedAccount;
  data: ICarnetDeBordStateData;
  error?: Error | PronoteCdbInitError;
  structures?: AuthLoggedAccount['user']['structures'];
}
export interface CarnetDeBordScreenEventProps {
  handleLoadData: () => Promise<ICarnetDeBord[]>;
}
export type CarnetDeBordScreenNavParams = undefined;
export type CarnetDeBordScreenProps = CarnetDeBordScreenDataProps &
  CarnetDeBordScreenEventProps &
  NativeStackScreenProps<PronoteNavigationParams, typeof pronoteRouteNames.carnetDeBord>;

export const computeNavBar = ({
  navigation,
  route,
}: NativeStackScreenProps<PronoteNavigationParams, typeof pronoteRouteNames.carnetDeBord>): NativeStackNavigationOptions => ({
  ...navBarOptions({
    navigation,
    route,
    title: I18n.get('carnetdebord'),
  }),
});

const styles = StyleSheet.create({
  button: {
    marginBottom: UI_SIZES.screen.bottomInset
      ? UI_SIZES.spacing.large + UI_SIZES.spacing.big - UI_SIZES.screen.bottomInset
      : UI_SIZES.spacing.large + UI_SIZES.spacing.medium,
    marginTop: UI_SIZES.spacing.large,
  },
  card: {
    marginHorizontal: UI_SIZES.spacing.medium,
    marginTop: UI_SIZES.spacing.medium,
  },
  emptyRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  textLabel: {
    flex: 1,
    marginRight: UI_SIZES.spacing.small,
  },
  textRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

function CarnetDeBordScreen({ data, error, handleLoadData, navigation, session, structures }: CarnetDeBordScreenProps) {
  // UserList info & selected user
  const getUsers = React.useCallback(
    (_data: typeof data) => _data.map(cdb => ({ avatarId: cdb.id, id: cdb.idPronote ?? cdb.id, name: cdb.firstName })),
    [],
  );
  const users = React.useMemo(() => getUsers(data), [getUsers, data]);
  const usersRef = React.useRef(users);
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const selectUser = React.useCallback(async (id: string | undefined) => {
    // Prevent selecting a non-existing user. Fallback onto the first of the list.
    const idToBeSelected = usersRef.current.find(u => u.id === id) ? id : usersRef.current[0]?.id;
    if (!idToBeSelected) throw new Error(`idToBeSelected is undefined. CarnetDeBord need to select an existing user`);
    setSelectedId(idToBeSelected);
    preferences.set('carnet-de-bord.selected-user', idToBeSelected);
  }, []);
  const isUserListShown = React.useMemo(
    () => /* session.user.type === UserType.Relative || */ users.length > 1,
    [/*session, */ users],
  );

  // Data & content
  const loadData = React.useCallback(async () => {
    const savedSelectedId = preferences.getString('carnet-de-bord.selected-user');
    const newData = await handleLoadData();
    usersRef.current = getUsers(newData);
    await selectUser(savedSelectedId ?? undefined);
  }, [selectUser, handleLoadData, getUsers]);
  const selectedCdbData = React.useMemo(() => {
    return data.find(d => d.idPronote === selectedId);
  }, [data, selectedId]);
  const isStructureShown = React.useMemo(() => {
    const dataOfUser = data.filter(d => d.id === selectedCdbData?.id);
    return dataOfUser.length > 1;
  }, [data, selectedCdbData]);
  const renderContent = React.useMemo(
    () =>
      CarnetDeBordScreen.getRenderContent(
        selectedCdbData!,
        users,
        selectedId,
        selectUser,
        isUserListShown,
        isStructureShown,
        navigation,
        structures,
        session,
      ),
    [selectedCdbData, users, selectedId, selectUser, isUserListShown, isStructureShown, navigation, structures, session],
  );

  const is50xError = React.useMemo(() => error instanceof PronoteCdbInitError, [error]);

  return (
    <PageView>
      <ContentLoader
        renderError={refreshControl => {
          return (
            <ScrollView refreshControl={refreshControl}>
              {is50xError ? (
                <EmptyScreen
                  svgImage="empty-pronote-uri"
                  title={I18n.get('pronote-initfailed-title')}
                  text={I18n.get('pronote-initfailed-text')}
                />
              ) : (
                <EmptyScreen
                  svgImage="empty-light"
                  title={I18n.get('pronote-nodata-title')}
                  text={I18n.get('pronote-nodata-text')}
                />
              )}
            </ScrollView>
          );
        }}
        loadContent={loadData}
        renderContent={renderContent}
      />
    </PageView>
  );
}
CarnetDeBordScreen.getRenderContent =
  (
    data: ICarnetDeBord | undefined,
    users: readonly IUserListItem[],
    selectedId: string | undefined,
    setSelected: (id: string) => void,
    isUserListShown: boolean,
    isStructureShown: boolean,
    navigation: CarnetDeBordScreenProps['navigation'],
    structures: CarnetDeBordScreenProps['structures'],
    session?: AuthLoggedAccount,
  ) =>
  (refreshControl: ScrollViewProps['refreshControl']) => {
    return (
      <ScrollView refreshControl={refreshControl}>
        {isUserListShown ? (
          <UserList
            horizontal
            data={users}
            style={styles.card}
            selectedId={selectedId}
            onSelect={setSelected}
            bottomInset={false}
          />
        ) : null}
        {isStructureShown ? (
          <BodyBoldText style={styles.card}>{structures?.find(s => s.id === data?.structureId)?.name ?? ' '}</BodyBoldText>
        ) : null}
        {data && data.idPronote && data.address && data.structureId ? (
          <>
            <CarnetDeBordScreen.SectionContent
              title={I18n.get('pronote-cahierdetextes-title')}
              picture={{
                cached: true,
                name: 'ui-calendar',
                type: 'Svg',
              }}
              {...(() => {
                const taf = getSummaryItem(
                  data.PageCahierDeTextes?.TravailAFairePast,
                  data.PageCahierDeTextes?.TravailAFaireFuture,
                );
                return taf
                  ? {
                      textLabel: taf.Matiere ?? I18n.get('pronote-noinfo'),
                      valueLabel: taf.PourLe
                        ? I18n.get('pronote-cahierdetextes-pourdate', {
                            date: displayDate(taf.PourLe, 'short'),
                          }).toLowerCase()
                        : I18n.get('pronote-noinfo'),
                    }
                  : {};
              })()}
              emptyLabel={I18n.get('pronote-cahierdetextes-empty')}
              navigation={navigation}
              type={CarnetDeBordSection.CAHIER_DE_TEXTES}
              data={data}
            />
            <CarnetDeBordScreen.SectionContent
              title={I18n.get('pronote-transcript-title')}
              picture={{
                cached: true,
                name: 'ui-success',
                type: 'Svg',
              }}
              {...(() => {
                const note = getSummaryItem(data.PageReleveDeNotes?.DevoirsPast, data.PageReleveDeNotes?.DevoirsFuture);
                return (
                  note && {
                    textLabel: note?.Matiere || I18n.get('pronote-noinfo'),
                    valueLabel: note?.Note
                      ? formatCarnetDeBordReleveDeNotesDevoirNoteBareme(note.Note, note.Bareme)
                      : I18n.get('pronote-noinfo'),
                  }
                );
              })()}
              emptyLabel={I18n.get('pronote-transcript-empty')}
              navigation={navigation}
              type={CarnetDeBordSection.NOTES}
              data={data}
            />
            <CarnetDeBordScreen.SectionContent
              title={I18n.get('pronote-skills-title')}
              picture={{
                cached: true,
                name: 'ui-skills',
                type: 'Svg',
              }}
              {...(() => {
                const comp = getSummaryItem(data.PageCompetences?.CompetencesPast, data.PageCompetences?.CompetencesFuture);
                return (
                  comp && {
                    textLabel: comp?.Matiere || I18n.get('pronote-noinfo'),
                    valueLabel: formatCarnetDeBordCompetencesValue(comp.NiveauDAcquisition?.Genre),
                  }
                );
              })()}
              emptyLabel={I18n.get('pronote-skills-empty')}
              navigation={navigation}
              type={CarnetDeBordSection.COMPETENCES}
              data={data}
            />
            <CarnetDeBordScreen.SectionContent
              title={I18n.get('pronote-viescolaire-title')}
              picture={{
                cached: true,
                name: 'ui-flag',
                type: 'Svg',
              }}
              {...(() => {
                const vsco = getSummaryItem(data.PageVieScolaire?.VieScolairePast, data.PageVieScolaire?.VieScolaireFuture);
                return (
                  vsco && {
                    textLabel: formatCarnetDeBordVieScolaireType(vsco?.type),
                    valueLabel:
                      vsco.type === 'Absence'
                        ? vsco.DateDebut && vsco.DateFin
                          ? vsco.DateDebut.isSame(vsco.DateFin, 'day')
                            ? vsco.DateDebut.isSame(vsco.DateFin, 'minute')
                              ? displayDate(vsco.DateDebut, 'short')
                              : displayDate(vsco.DateDebut, 'short') +
                                I18n.get('common-space') +
                                I18n.get('pronote-viescolaire-datefromto', {
                                  end: vsco.DateFin.format('LT'),
                                  start: vsco.DateDebut.format('LT'),
                                })
                            : I18n.get('pronote-viescolaire-datefromto', {
                                end: displayDate(vsco.DateFin, 'short'),
                                start: displayDate(vsco.DateDebut, 'short'),
                              })
                          : I18n.get('pronote-noinfo')
                        : vsco.Date
                          ? vsco.type === 'Retard' || vsco.type === 'PassageInfirmerie'
                            ? displayDate(vsco.Date, 'short') + I18n.get('common-space') + vsco.Date.format('LT')
                            : displayDate(vsco.Date, 'short')
                          : I18n.get('pronote-noinfo'),
                  }
                );
              })()}
              emptyLabel={I18n.get('pronote-viescolaire-empty')}
              navigation={navigation}
              type={CarnetDeBordSection.VIE_SCOLAIRE}
              data={data}
            />
            <SecondaryButton
              style={styles.button}
              action={() => {
                if (session) redirect(session, data.address!);
              }}
              iconRight="pictos-external-link"
              text={I18n.get('pronote-openinpronote')}
            />
          </>
        ) : (
          <EmptyScreen
            svgImage="empty-timeline"
            title={I18n.get('pronote-nodatachild-title')}
            text={I18n.get('pronote-nodatachild-text')}
          />
        )}
      </ScrollView>
    );
  };
CarnetDeBordScreen.STORAGE_KEY = `${moduleConfig.name}.CarnetDeBord.selectedUserId`;
CarnetDeBordScreen.SectionContent = function (props: {
  textLabel?: string;
  valueLabel?: string;
  emptyLabel: string;
  title: string;
  picture: PictureProps;
  navigation: CarnetDeBordScreenProps['navigation'];
  type: CarnetDeBordSection;
  data: ICarnetDeBord;
}) {
  // React ESLint doesn't allow hooks in components that are defined with `CarnetDeBord.SectionContent = ...`
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const goToDetails = React.useCallback(() => {
    props.navigation.navigate(pronoteRouteNames.carnetDeBordDetails, { data: props.data, type: props.type });
  }, [props.navigation, props.type, props.data]);
  const isNotEmpty = props.textLabel && props.valueLabel;
  const CC = isNotEmpty ? TouchableOverviewCard : OverviewCard;
  return (
    <CC picture={props.picture} title={props.title} style={styles.card} onPress={goToDetails}>
      {isNotEmpty ? (
        <View style={styles.textRow}>
          <SmallBoldText numberOfLines={1} style={styles.textLabel}>
            {props.textLabel || I18n.get('pronote-noinfo')}
          </SmallBoldText>
          <SmallText numberOfLines={1}>{props.valueLabel || I18n.get('pronote-noinfo')}</SmallText>
        </View>
      ) : (
        <View style={styles.emptyRow}>
          <SmallText numberOfLines={1} style={{ color: theme.ui.text.light }}>
            {props.emptyLabel}
          </SmallText>
        </View>
      )}
    </CC>
  );
};

export default connect(
  (state: IGlobalState) => {
    return {
      data: moduleConfig.getState(state).carnetDeBord.data,
      error: moduleConfig.getState(state).carnetDeBord.error,
      session: getSession(),
      structures: getSession()?.user.structures,
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        handleLoadData: tryActionLegacy(loadCarnetDeBordAction, undefined, true) as unknown as () => Promise<ICarnetDeBord[]>, // Some TS issue with ThunkDispatch
      },
      dispatch,
    ),
)(CarnetDeBordScreen);
