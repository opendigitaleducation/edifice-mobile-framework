import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { moveMailsToFolderAction, moveMailsToInboxAction } from "../actions/mail";
import MoveToFolderModalComponent from "../components/Modals/MoveToFolderModal";
import { getInitMailListState, IFolder } from "../state/initMails";

type MoveToFolderModalProps = {
  folders: IFolder[];
  show: boolean;
  mail: any;
  closeModal: () => any;
  moveToFolder: (ids: string[], folder: string) => any;
  moveToInbox: (ids: string[]) => any;
  successCallback: () => any;
};

type MoveToFolderModalState = {
  selectedFolder: string | null;
};

class MoveToFolderModal extends React.Component<MoveToFolderModalProps, MoveToFolderModalState> {
  constructor(props) {
    super(props);
    this.state = {
      selectedFolder: null,
    };
  }

  selectFolder = (selectedFolder: string) => {
    this.setState({
      selectedFolder,
    });
  };

  confirm = async () => {
    const { moveToFolder, moveToInbox, mail, successCallback } = this.props;
    const { selectedFolder } = this.state;
    await this.props.closeModal();

    let mailsIds = [] as any;
    if (Array.isArray(mail)) mail.map(mailInfos => mailsIds.push(mailInfos.id));
    else mailsIds.push(mail.id);

    if (!selectedFolder) return;
    else if (selectedFolder === "inbox") await moveToInbox(mailsIds);
    else await moveToFolder(mailsIds, selectedFolder);
    successCallback();
  };

  public render() {
    return (
      <MoveToFolderModalComponent
        {...this.props}
        selectedFolder={this.state.selectedFolder}
        selectFolder={this.selectFolder}
        confirm={this.confirm}
      />
    );
  }
}

const mapStateToProps = (state: any) => {
  return {
    folders: getInitMailListState(state).data.folders,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators(
    {
      moveToFolder: moveMailsToFolderAction,
      moveToInbox: moveMailsToInboxAction,
    },
    dispatch
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(MoveToFolderModal);
