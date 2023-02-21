import I18n from 'i18n-js';
import * as React from 'react';
import { Alert, ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/AppStore';
import theme from '~/app/theme';
import UserList, { IUserListItem, UserListProps } from '~/framework/components/UserList';
import { ActionButton } from '~/framework/components/buttons/action';
import { OverviewCard, TouchableOverviewCard } from '~/framework/components/card';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyScreen } from '~/framework/components/emptyScreen';
import { PageView } from '~/framework/components/page';
import { PictureProps } from '~/framework/components/picture';
import { BodyBoldText, SmallBoldText, SmallText, TextFontStyle, TextSizeStyle } from '~/framework/components/text';
import { ContentLoader } from '~/framework/hooks/loader';
import { displayDate } from '~/framework/util/date';
import { IEntcoreApp } from '~/framework/util/moduleTool';
import { tryAction } from '~/framework/util/redux/actions';
import { IUserSession, getUserSession } from '~/framework/util/session';
import { getItemJson, setItemJson } from '~/framework/util/storage';
import {
  CarnetDeBordSection,
  ICarnetDeBord,
  PronoteCdbInitError,
  formatCarnetDeBordCompetencesValue,
  formatCarnetDeBordReleveDeNotesDevoirNoteBareme,
  formatCarnetDeBordVieScolaireType,
  getSummaryItem,
} from '~/modules/pronote/model/carnetDeBord';
import moduleConfig from '~/modules/pronote/moduleConfig';
import redirect from '~/modules/pronote/service/redirect';
import { loadCarnetDeBordAction } from '~/modules/pronote/state/carnetDeBord/actions';
import { ICarnetDeBordStateData } from '~/modules/pronote/state/carnetDeBord/reducer';
import { IUserInfoState } from '~/user/state/info';

export interface CarnetDeBordScreenDataProps {
  session: IUserSession;
  data: ICarnetDeBordStateData;
  error?: Error | PronoteCdbInitError;
  structures: IUserInfoState['structureNodes'];
}
export interface CarnetDeBordScreenEventProps {
  handleLoadData: () => Promise<ICarnetDeBord[]>;
}
export type CarnetDeBordScreenProps = CarnetDeBordScreenDataProps & CarnetDeBordScreenEventProps & NavigationInjectedProps;

function CarnetDeBordScreen({ data, error, session, handleLoadData, navigation, structures }: CarnetDeBordScreenProps) {
  // UserList info & selected user
  const getUsers = React.useCallback(
    (_data: typeof data) => _data.map(cdb => ({ id: cdb.idPronote ?? cdb.id, avatarId: cdb.id, name: cdb.firstName })),
    [],
  );
  const users: UserListProps['data'] = React.useMemo(() => getUsers(data), [getUsers, data]);
  const usersRef = React.useRef(users);
  const [selectedId, setSelectedId] = React.useState<string | undefined>(undefined);
  const selectUser = React.useCallback(async (id: string | undefined) => {
    // Prevent selecting a non-existing user. Fallback onto the first of the list.
    const idToBeSelected = usersRef.current.find(u => u.id === id) ? id : usersRef.current[0]?.id;
    if (!idToBeSelected) throw new Error(`idToBeSelected is undefined. CarnetDeBord need to select an existing user`);
    setSelectedId(idToBeSelected);
    setItemJson(CarnetDeBordScreen.STORAGE_KEY, idToBeSelected);
  }, []);
  const isUserListShown = React.useMemo(
    () => /* session.user.type === UserType.Relative || */ users.length > 1,
    [/*session, */ users],
  );

  // Data & content
  const loadData = React.useCallback(async () => {
    const [newData, savedSelectedId] = await Promise.all([handleLoadData(), getItemJson<string>(CarnetDeBordScreen.STORAGE_KEY)]);
    usersRef.current = getUsers(newData);
    await selectUser(savedSelectedId);
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
    <PageView
      navigation={navigation}
      navBarWithBack={{
        title: I18n.t(`CarnetDeBord`),
      }}>
      <ContentLoader
        renderError={refreshControl => {
          return (
            <ScrollView refreshControl={refreshControl}>
              {is50xError ? (
                <EmptyScreen
                  svgImage="empty-pronote-uri"
                  title={I18n.t('pronote.carnetDeBord.initFailed.title')}
                  text={I18n.t('pronote.carnetDeBord.initFailed.text')}
                />
              ) : (
                <EmptyScreen
                  svgImage="empty-light"
                  title={I18n.t('pronote.carnetDeBord.noData.title')}
                  text={I18n.t('pronote.carnetDeBord.noData.text')}
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
    users: Readonly<IUserListItem[]>,
    selectedId: string | undefined,
    setSelected: (id: string) => void,
    isUserListShown: boolean,
    isStructureShown: boolean,
    navigation: CarnetDeBordScreenProps['navigation'],
    structures: CarnetDeBordScreenProps['structures'],
    session: IUserSession,
  ) =>
  (refreshControl: ScrollViewProps['refreshControl']) => {
    return (
      <ScrollView refreshControl={refreshControl}>
        {isUserListShown ? (
          <UserList
            horizontal
            data={users}
            style={CarnetDeBordScreen.styles.card}
            selectedId={selectedId}
            onSelect={setSelected}
            bottomInset={false}
          />
        ) : null}
        {isStructureShown ? (
          <BodyBoldText style={CarnetDeBordScreen.styles.card}>
            {structures.find(s => s.id === data?.structureId)?.name ?? ' '}
          </BodyBoldText>
        ) : null}
        {data && data.idPronote && data.address && data.structureId ? (
          <>
            <CarnetDeBordScreen.SectionContent
              title={I18n.t('pronote.carnetDeBord.cahierDeTextes.title')}
              picture={{
                type: 'NamedSvg',
                name: 'ui-calendar',
                cached: true,
              }}
              {...(() => {
                const taf = getSummaryItem(
                  data.PageCahierDeTextes?.TravailAFairePast,
                  data.PageCahierDeTextes?.TravailAFaireFuture,
                );
                return taf
                  ? {
                      textLabel: taf.Matiere ?? I18n.t('pronote.carnetDeBord.noInfo'),
                      valueLabel: taf.PourLe
                        ? I18n.t('pronote.carnetDeBord.cahierDeTextes.pourDate', {
                            date: displayDate(taf.PourLe, 'short'),
                          })
                        : I18n.t('pronote.carnetDeBord.noInfo'),
                    }
                  : {};
              })()}
              emptyLabel={I18n.t('pronote.carnetDeBord.cahierDeTextes.empty')}
              navigation={navigation}
              type={CarnetDeBordSection.CAHIER_DE_TEXTES}
              data={data}
            />
            <CarnetDeBordScreen.SectionContent
              title={I18n.t('pronote.carnetDeBord.releveDeNotes.title')}
              picture={{
                type: 'NamedSvg',
                name: 'ui-success',
                cached: true,
              }}
              {...(() => {
                const note = getSummaryItem(data.PageReleveDeNotes?.DevoirsPast, data.PageReleveDeNotes?.DevoirsFuture);
                return (
                  note && {
                    textLabel: note?.Matiere || I18n.t('pronote.carnetDeBord.noInfo'),
                    valueLabel: note?.Note
                      ? formatCarnetDeBordReleveDeNotesDevoirNoteBareme(note.Note, note.Bareme)
                      : I18n.t('pronote.carnetDeBord.noInfo'),
                  }
                );
              })()}
              emptyLabel={I18n.t('pronote.carnetDeBord.releveDeNotes.empty')}
              navigation={navigation}
              type={CarnetDeBordSection.NOTES}
              data={data}
            />
            <CarnetDeBordScreen.SectionContent
              title={I18n.t('pronote.carnetDeBord.competences.title')}
              picture={{
                type: 'NamedSvg',
                name: 'ui-skills',
                cached: true,
              }}
              {...(() => {
                const comp = getSummaryItem(data.PageCompetences?.CompetencesPast, data.PageCompetences?.CompetencesFuture);
                return (
                  comp && {
                    textLabel: comp?.Matiere || I18n.t('pronote.carnetDeBord.noInfo'),
                    valueLabel: formatCarnetDeBordCompetencesValue(comp.NiveauDAcquisition?.Genre),
                  }
                );
              })()}
              emptyLabel={I18n.t('pronote.carnetDeBord.competences.empty')}
              navigation={navigation}
              type={CarnetDeBordSection.COMPETENCES}
              data={data}
            />
            <CarnetDeBordScreen.SectionContent
              title={I18n.t('pronote.carnetDeBord.vieScolaire.title')}
              picture={{
                type: 'NamedSvg',
                name: 'ui-flag',
                cached: true,
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
                                I18n.t('common.space') +
                                I18n.t('pronote.carnetDeBord.vieScolaire.dateFromTo', {
                                  start: vsco.DateDebut.format('LT'),
                                  end: vsco.DateFin.format('LT'),
                                })
                            : I18n.t('pronote.carnetDeBord.vieScolaire.dateFromTo', {
                                start: displayDate(vsco.DateDebut, 'short'),
                                end: displayDate(vsco.DateFin, 'short'),
                              })
                          : I18n.t('pronote.carnetDeBord.noInfo')
                        : vsco.Date
                        ? vsco.type === 'Retard' || vsco.type === 'PassageInfirmerie'
                          ? displayDate(vsco.Date, 'short') + I18n.t('common.space') + vsco.Date.format('LT')
                          : displayDate(vsco.Date, 'short')
                        : I18n.t('pronote.carnetDeBord.noInfo'),
                  }
                );
              })()}
              emptyLabel={I18n.t('pronote.carnetDeBord.vieScolaire.empty')}
              navigation={navigation}
              type={CarnetDeBordSection.VIE_SCOLAIRE}
              data={data}
            />
            <ActionButton
              style={CarnetDeBordScreen.styles.button}
              type="secondary"
              action={() => {
                redirect(session, data.address!);
              }}
              iconName="pictos-external-link"
              text={I18n.t('pronote.carnetDeBord.openInPronote')}
            />
          </>
        ) : (
          <EmptyScreen
            svgImage="empty-timeline"
            title={I18n.t('pronote.carnetDeBord.noDataChild.title')}
            text={I18n.t('pronote.carnetDeBord.noDataChild.text')}
          />
        )}
      </ScrollView>
    );
  };
CarnetDeBordScreen.STORAGE_KEY = `${moduleConfig.name}.CarnetDeBord.selectedUserId`;
CarnetDeBordScreen.styles = StyleSheet.create({
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  emptyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
  textLabel: {
    flex: 1,
    marginRight: UI_SIZES.spacing.small,
  },
  card: {
    marginHorizontal: UI_SIZES.spacing.medium,
    marginTop: UI_SIZES.spacing.medium,
  },
  button: {
    marginTop: UI_SIZES.spacing.large,
    marginBottom: UI_SIZES.screen.bottomInset
      ? UI_SIZES.spacing.large + UI_SIZES.spacing.big - UI_SIZES.screen.bottomInset
      : UI_SIZES.spacing.large + UI_SIZES.spacing.medium,
  },
});
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
    props.navigation.navigate(`${moduleConfig.routeName}/carnetDeBord/details`, { type: props.type, data: props.data });
  }, [props.navigation, props.type, props.data]);
  const isNotEmpty = props.textLabel && props.valueLabel;
  const CC = isNotEmpty ? TouchableOverviewCard : OverviewCard;
  return (
    <CC picture={props.picture} title={props.title} style={CarnetDeBordScreen.styles.card} onPress={goToDetails}>
      {isNotEmpty ? (
        <View style={CarnetDeBordScreen.styles.textRow}>
          <SmallBoldText numberOfLines={1} style={CarnetDeBordScreen.styles.textLabel}>
            {props.textLabel || I18n.t('pronote.carnetDeBord.noInfo')}
          </SmallBoldText>
          <SmallText numberOfLines={1}>{props.valueLabel || I18n.t('pronote.carnetDeBord.noInfo')}</SmallText>
        </View>
      ) : (
        <View style={CarnetDeBordScreen.styles.emptyRow}>
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
      session: getUserSession(),
      structures: state.user.info.structureNodes,
    };
  },
  (dispatch: ThunkDispatch<any, any, any>) =>
    bindActionCreators(
      {
        handleLoadData: tryAction(loadCarnetDeBordAction, undefined, true) as unknown as () => Promise<ICarnetDeBord[]>, // Some TS issue with ThunkDispatch
      },
      dispatch,
    ),
)(CarnetDeBordScreen);