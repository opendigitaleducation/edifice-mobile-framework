import I18n from 'i18n-js';
import * as React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';

import { IGlobalState } from '~/AppStore';
import { ActionButton } from '~/framework/components/ActionButton';
import { OverviewCard, TouchableOverviewCard } from '~/framework/components/card';
import { UI_SIZES } from '~/framework/components/constants';
import { EmptyContentScreen } from '~/framework/components/emptyContentScreen';
import { PageView } from '~/framework/components/page';
import { PictureProps } from '~/framework/components/picture';
import { FontStyle, Text, TextColorStyle, TextSizeStyle } from '~/framework/components/text';
import { ContentLoader } from '~/framework/hooks/loader';
import { tryAction } from '~/framework/util/redux/actions';
import { IUserSession, getUserSession } from '~/framework/util/session';
import { getItemJson, setItemJson } from '~/framework/util/storage';
import { TextBold } from '~/ui/Typography';
import { IUserInfoState } from '~/user/state/info';

import UserList, { IUserListItem, UserListProps } from '../../../framework/components/UserList';
import { CarnetDeBordSection, ICarnetDeBord } from '../model/carnetDeBord';
import moduleConfig from '../moduleConfig';
import redirect from '../service/redirect';
import { loadCarnetDeBordAction } from '../state/carnetDeBord/actions';
import { ICarnetDeBordStateData } from '../state/carnetDeBord/reducer';
import CarnetDeBordDetailsScreen from './CarnetDeBordDetails';

export interface CarnetDeBordScreenDataProps {
  session: IUserSession;
  data: ICarnetDeBordStateData;
  structures: IUserInfoState['structureNodes'];
}
export interface CarnetDeBordScreenEventProps {
  handleLoadData: () => Promise<ICarnetDeBord[]>;
}
export type CarnetDeBordScreenProps = CarnetDeBordScreenDataProps & CarnetDeBordScreenEventProps & NavigationInjectedProps;

function CarnetDeBordScreen({ data, session, handleLoadData, navigation, structures }: CarnetDeBordScreenProps) {
  // UserList info & selected user
  const getUsers = React.useCallback(
    (_data: typeof data) => _data.map(cdb => ({ id: cdb.idPronote, avatarId: cdb.id, name: cdb.firstName })),
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
  const [isEmpty, setIsEmpty] = React.useState(false);

  // Data & content
  const loadData = React.useCallback(async () => {
    try {
      const [newData, savedSelectedId] = await Promise.all([handleLoadData(), getItemJson<string>(CarnetDeBordScreen.STORAGE_KEY)]);
      usersRef.current = getUsers(newData);
      await selectUser(savedSelectedId);
    } catch (e) {
      setIsEmpty(true);
    }
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
      isEmpty
        ? () => <EmptyContentScreen />
        : CarnetDeBordScreen.getRenderContent(
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
    [selectedCdbData, users, selectedId, selectUser, isUserListShown, isStructureShown, navigation, isEmpty, structures, session],
  );

  return (
    <PageView
      navigation={navigation}
      navBarWithBack={{
        title: I18n.t(`CarnetDeBord`),
      }}>
      <ContentLoader loadContent={loadData} renderContent={renderContent} />
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
          <UserList horizontal data={users} selectedId={selectedId} onSelect={setSelected} bottomInset={false} />
        ) : (
          <View style={CarnetDeBordScreen.styles.card} /> // for top-page spacing
        )}
        {isStructureShown ? (
          <Text style={[CarnetDeBordScreen.styles.card, FontStyle.Bold, TextSizeStyle.SlightBig]}>
            {structures.find(s => s.id === data?.structureId)?.name ?? ' '}
          </Text>
        ) : null}
        {data ? (
          <>
            <CarnetDeBordScreen.SectionContent
              title={I18n.t('pronote.carnetDeBord.cahierDeTextes.title')}
              picture={{
                type: 'NamedSvg',
                name: 'ui-calendar',
              }}
              textLabel={data.PageCahierDeTextes?.CahierDeTextes?.[0]?.Matiere}
              valueLabel={
                data.PageCahierDeTextes?.CahierDeTextes?.[0] &&
                I18n.t('pronote.carnetDeBord.cahierDeTextes.pourDate', {
                  date:
                    data.PageCahierDeTextes.CahierDeTextes?.[0].TravailAFaire?.[0]?.PourLe &&
                    CarnetDeBordDetailsScreen.formatDatePast(
                      data.PageCahierDeTextes.CahierDeTextes?.[0].TravailAFaire?.[0]?.PourLe,
                    ),
                })
              }
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
              }}
              textLabel={data.PageReleveDeNotes?.Devoir?.[0]?.Matiere}
              valueLabel={
                data.PageReleveDeNotes?.Devoir?.[0] && data.PageReleveDeNotes.Devoir?.[0].Bareme
                  ? I18n.t('pronote.carnetDeBord.releveDeNotes.note', {
                      note: data.PageReleveDeNotes.Devoir?.[0].Note,
                      bareme: data.PageReleveDeNotes.Devoir?.[0].Bareme,
                    })
                  : data.PageReleveDeNotes?.Devoir?.[0].Note
              }
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
              }}
              textLabel={data.PageCompetences?.Competences?.[0]?.Matiere}
              valueLabel={
                data.PageCompetences?.Competences?.[0] && `${data.PageCompetences.Competences?.[0]?.NiveauDAcquisition.Libelle}`
              }
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
              }}
              textLabel={data.PageVieScolaire?.VieScolaire?.[0] && data.PageVieScolaire.VieScolaire?.[0]?.type.toLocaleUpperCase()}
              valueLabel={
                data.PageVieScolaire?.VieScolaire?.[0] &&
                (data.PageVieScolaire.VieScolaire?.[0].type === 'Absence'
                  ? data.PageVieScolaire.VieScolaire?.[0].DateDebut.isSame(data.PageVieScolaire.VieScolaire?.[0].DateFin, 'day')
                    ? data.PageVieScolaire.VieScolaire?.[0].DateDebut.fromNow()
                    : I18n.t('pronote.carnetDeBord.vieScolaire.dateFromTo', {
                        start: CarnetDeBordDetailsScreen.formatDate(data.PageVieScolaire.VieScolaire?.[0].DateDebut),
                        end: CarnetDeBordDetailsScreen.formatDate(data.PageVieScolaire.VieScolaire?.[0].DateFin),
                      })
                  : data.PageVieScolaire.VieScolaire?.[0].Date.fromNow(false))
              }
              emptyLabel={I18n.t('pronote.carnetDeBord.vieScolaire.empty')}
              navigation={navigation}
              type={CarnetDeBordSection.VIE_SCOLAIRE}
              data={data}
            />
            <ActionButton
              style={CarnetDeBordScreen.styles.button}
              type="secondary"
              action={() => {
                redirect(session, data.address);
              }}
              iconName="pictos-external-link"
              text={I18n.t('pronote.carnetDeBord.openInPronote')}
            />
          </>
        ) : null}
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
    marginRight: UI_SIZES.spacing.medium,
  },
  card: {
    marginHorizontal: UI_SIZES.spacing.large,
    marginBottom: UI_SIZES.spacing.large,
  },
  button: {
    marginTop: UI_SIZES.spacing.extraLarge,
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
          <TextBold numberOfLines={1} style={CarnetDeBordScreen.styles.textLabel}>
            {props.textLabel}
          </TextBold>
          <Text numberOfLines={1}>{props.valueLabel}</Text>
        </View>
      ) : (
        <View style={CarnetDeBordScreen.styles.emptyRow}>
          <Text numberOfLines={1} style={TextColorStyle.Light}>
            {props.emptyLabel}
          </Text>
        </View>
      )}
    </CC>
  );
};

export default connect(
  (state: IGlobalState) => {
    return {
      data: moduleConfig.getState(state).carnetDeBord.data,
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
