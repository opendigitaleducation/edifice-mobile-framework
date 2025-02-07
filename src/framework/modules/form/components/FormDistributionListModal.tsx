import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { I18n } from '~/app/i18n';
import theme from '~/app/theme';
import PrimaryButton from '~/framework/components/buttons/primary';
import { UI_SIZES } from '~/framework/components/constants';
import ModalBox, { ModalBoxHandle } from '~/framework/components/ModalBox';
import { Svg } from '~/framework/components/picture';
import { BodyText, SmallText } from '~/framework/components/text';
import Toast from '~/framework/components/toast';
import { assertSession } from '~/framework/modules/auth/reducer';
import { DistributionStatus, IDistribution, IForm } from '~/framework/modules/form/model';
import { formService } from '~/framework/modules/form/service';

const styles = StyleSheet.create({
  flatListContainer: {
    marginVertical: UI_SIZES.spacing.medium,
    maxHeight: 300,
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 32,
  },
  itemIconMargin: {
    marginLeft: UI_SIZES.spacing.minor,
  },
  titleMargin: {
    marginTop: UI_SIZES.spacing.small,
  },
});

interface IFormDistributionListModalProps {
  distributions?: IDistribution[];
  form?: IForm;
  openDistribution: (id: number, status: DistributionStatus, form: IForm) => void;
}

const compareDistributions = (a: IDistribution, b: IDistribution): number => {
  if (!a.dateResponse || !b.dateResponse || a.dateResponse.isSame(b.dateResponse)) return 0;
  return a.dateResponse.isAfter(b.dateResponse) ? 1 : -1;
};

const FormDistributionListModal = React.forwardRef<ModalBoxHandle, IFormDistributionListModalProps>((props, ref) => {
  const [isLoading, setLoading] = React.useState(false);
  const data =
    props.distributions?.filter(distribution => distribution.status === DistributionStatus.FINISHED).sort(compareDistributions) ??
    [];

  const openDistributionCallback = (id: number, status: DistributionStatus) => {
    const { form } = props;

    if (form) {
      props.openDistribution(id, status, form);
    } else {
      Toast.showError(I18n.get('form-distributionlist-error-text'));
    }
  };

  const openSentDistribution = async (id: number) => {
    const { distributions, form } = props;

    if (form?.editable) {
      try {
        let distribution = distributions?.find(d => d.originalId === id && d.status === DistributionStatus.ON_CHANGE);

        if (!distribution) {
          const session = assertSession();
          distribution = await formService.distribution.duplicate(session, id);
        }
        openDistributionCallback(distribution.id, distribution.status);
      } catch {
        Toast.showError(I18n.get('form-distributionlist-error-text'));
      }
    } else {
      openDistributionCallback(id, DistributionStatus.FINISHED);
    }
  };

  const openNewDistribution = async () => {
    try {
      const { distributions } = props;
      let distribution = distributions?.find(d => d.status === DistributionStatus.TO_DO);

      if (!distribution) {
        setLoading(true);
        const session = assertSession();
        if (!session || !distributions) throw new Error();
        distribution = await formService.distribution.add(session, distributions[0].id);
        setLoading(false);
      }
      openDistributionCallback(distribution.id, distribution.status);
    } catch {
      setLoading(false);
      Toast.showError(I18n.get('form-distributionlist-error-text'));
    }
  };

  const renderListItem = (distribution: IDistribution, index: number) => {
    const { dateResponse } = distribution;
    const text = `${index}. ${I18n.get('form-distributionlist-formcard-answerdate', {
      date: dateResponse?.format('DD/MM/YYYY, HH:mm'),
    })}`;
    return (
      <TouchableOpacity onPress={() => openSentDistribution(distribution.id)} style={styles.itemContainer}>
        <SmallText>{text}</SmallText>
        <Svg width={20} height={20} name="ui-eye" fill={theme.palette.primary.regular} style={styles.itemIconMargin} />
      </TouchableOpacity>
    );
  };

  return (
    <ModalBox
      ref={ref}
      content={
        <View>
          <BodyText style={styles.titleMargin}>{`${I18n.get('form-distributionlist-listmodal-myanswers')} - ${
            props.form?.title
          }`}</BodyText>
          <FlatList
            data={data}
            initialNumToRender={data.length}
            keyExtractor={distribution => distribution.id.toString()}
            renderItem={({ index, item }) => renderListItem(item, index + 1)}
            persistentScrollbar
            style={styles.flatListContainer}
          />
          <PrimaryButton
            text={I18n.get('form-distributionlist-listmodal-action')}
            action={openNewDistribution}
            loading={isLoading}
          />
        </View>
      }
    />
  );
});

export default FormDistributionListModal;
