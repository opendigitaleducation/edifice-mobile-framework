import styled from '@emotion/native';
import * as React from 'react';
import { ImageURISource } from 'react-native';

import Avatar, { Size } from './Avatar';

export interface IAvatarsProps {
  users:
    | string[]
    | {
        id?: string;
        isGroup: boolean;
      }[];
  fallback?: ImageURISource;
}

export class GridAvatars extends React.Component<IAvatarsProps> {
  public render() {
    const { users, fallback } = this.props;

    if (users.length > 4) {
      users.length = 4;
    }

    return (
      <Container>
        {users.map((user, idx) => (
          <Avatar size={Size.small} key={idx} index={idx} count={users.length} sourceOrId={user} fallback={fallback} />
        ))}
      </Container>
    );
  }
}

const Container = styled.View({
  alignItems: 'center',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  justifyContent: 'center',
  width: 45,
  height: 45,
});
