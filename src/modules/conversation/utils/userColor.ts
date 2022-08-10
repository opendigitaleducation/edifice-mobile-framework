import theme from '~/app/theme';
import { mailContentService } from '~/modules/conversation/service/mailContent';

enum UserRole {
  STUDENT = 'STUDENT',
  RELATIVE = 'RELATIVE',
  TEACHER = 'TEACHER',
  PERSONNEL = 'PERSONNEL',
  GUEST = 'GUEST',
}

export const getUserColor = async (userId: string) => {
  try {
    const { result } = userId
      ? await mailContentService.getUserInfos(userId)
      : { result: [{ id: '', displayNames: '', type: [''] }] };
    return getProfileColor(result?.[0].type[0]);
  } catch (err) {
    return getProfileColor();
  }
};

export const getProfileColor = (role?) => {
  switch (role?.toUpperCase()) {
    case UserRole.STUDENT:
      return theme.color.profileTypes.student;
    case UserRole.RELATIVE:
      return theme.color.profileTypes.relative;
    case UserRole.TEACHER:
      return theme.color.profileTypes.teacher;
    case UserRole.PERSONNEL:
      return theme.color.profileTypes.personnel;
    case 'PrincTeacherGroup':
      return theme.palette.grey.graphite;
    case UserRole.GUEST:
      return theme.color.profileTypes.guest;
    default:
      return theme.palette.grey.grey;
  }
};
