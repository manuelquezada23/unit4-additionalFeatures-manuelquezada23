import { Select } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import * as bi from "react-icons/bi";
import * as ri from "react-icons/ri";
import { FrontendNodeGateway } from "../../../nodes";
import {
  IFolderNode,
  INode,
  INodeProperty,
  makeINodeProperty,
} from "../../../types";
import { Button } from "../../Button";
import { ContextMenuItems } from "../../ContextMenu";
import { EditableText } from "../../EditableText";
import "./NodeHeader.scss";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  selectedNodeState,
  isLinkingState,
  refreshState,
  alertOpenState,
  alertTitleState,
  alertMessageState,
  currentNodeState,
} from "../../../global/Atoms";
interface INodeHeaderProps {
  onHandleCompleteLinkClick: () => void;
  onHandleStartLinkClick: () => void;
  onDeleteButtonClick: (node: INode) => void;
  onMoveButtonClick: (node: INode) => void;
}

export const NodeHeader = (props: INodeHeaderProps) => {
  const {
    onDeleteButtonClick,
    onMoveButtonClick,
    onHandleStartLinkClick,
    onHandleCompleteLinkClick,
  } = props;
  const currentNode = useRecoilValue(currentNodeState);
  const [refresh, setRefresh] = useRecoilState(refreshState);
  const isLinking = useRecoilValue(isLinkingState);
  const setSelectedNode = useSetRecoilState(selectedNodeState);
  const [title, setTitle] = useState(currentNode.title);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const setAlertIsOpen = useSetRecoilState(alertOpenState);
  const setAlertTitle = useSetRecoilState(alertTitleState);
  const setAlertMessage = useSetRecoilState(alertMessageState);

  /* Method to update the current folder view */
  const handleUpdateFolderView = async (e: React.ChangeEvent) => {
    const nodeProperty: INodeProperty = makeINodeProperty(
      "viewType",
      (e.currentTarget as any).value as any
    );
    const updateViewResp = await FrontendNodeGateway.updateNode(
      currentNode.nodeId,
      [nodeProperty]
    );
    if (updateViewResp.success) {
      setSelectedNode(updateViewResp.payload);
    } else {
      setAlertIsOpen(true);
      setAlertTitle("View not updated");
      setAlertMessage(updateViewResp.message);
    }
  };

  /* Method to update the node title */
  const handleUpdateTitle = async (title: string) => {
    // [Lab]: Task 9
    setTitle(title);
    const nodeProperty: INodeProperty = makeINodeProperty("title", title);
    const titleUpdateResp = await FrontendNodeGateway.updateNode(
      currentNode.nodeId,
      [nodeProperty]
    );
    if (!titleUpdateResp.success) {
      setAlertIsOpen(true);
      setAlertTitle("Title update failed");
      setAlertMessage(titleUpdateResp.message);
    }
    setRefresh(!refresh);
  };

  /* Method called on title right click */
  const handleTitleRightClick = () => {
    // [Lab]: Task 10
    ContextMenuItems.splice(0, ContextMenuItems.length);
    const menuItem: JSX.Element = (
      <div
        key={"titleRename"}
        className="contextMenuItem"
        onClick={() => {
          ContextMenuItems.splice(0, ContextMenuItems.length);
          setEditingTitle(true);
        }}
      >
        <div className="itemTitle">Rename</div>
        <div className="itemShortcut">ctrl + shift + R</div>
      </div>
    );
    ContextMenuItems.push(menuItem);
  };

  /* useEffect which updates the title and editing state when the node is changed */
  useEffect(() => {
    setTitle(currentNode.title);
    setEditingTitle(false);
  }, [currentNode]);

  /* Node key handlers*/
  const nodeKeyHandlers = (e: KeyboardEvent) => {
    // [Lab]: Task 10
    // key handlers with no modifiers
    switch (e.key) {
      case "Enter":
        if (editingTitle == true) {
          e.preventDefault();
          setEditingTitle(false);
        }
        break;
      case "Escape":
        if (editingTitle == true) {
          e.preventDefault();
          setEditingTitle(false);
        }
        break;
    }

    // ctrl + shift key events
    if (e.shiftKey && e.ctrlKey) {
      switch (e.key) {
        case "R":
          e.preventDefault();
          setEditingTitle(true);
          break;
      }
    }
  };

  /* Trigger on node load or when editingTitle changes */
  useEffect(() => {
    // [Lab]: Task 10
    document.addEventListener("keydown", nodeKeyHandlers);
  }, [editingTitle]);

  const isFolder: boolean = currentNode.type === "folder";
  const isRoot: boolean = currentNode.nodeId === "root";
  return (
    <div className="nodeHeader">
      <div
        className="nodeHeader-title"
        onDoubleClick={() => setEditingTitle(true)}
        onContextMenu={handleTitleRightClick}
      >
        <EditableText
          text={title}
          editing={editingTitle}
          setEditing={setEditingTitle}
          onEdit={handleUpdateTitle}
        />
      </div>
      <div className="nodeHeader-buttonBar">
        {!isRoot && (
          <>
            <Button
              icon={<ri.RiDeleteBin6Line />}
              text="Delete"
              onClick={() => onDeleteButtonClick(currentNode)}
            />
            <Button
              icon={<ri.RiDragDropLine />}
              text="Move"
              onClick={() => onMoveButtonClick(currentNode)}
            />
            <Button
              icon={<ri.RiExternalLinkLine />}
              text="Start Link"
              onClick={onHandleStartLinkClick}
            />
            {isLinking && (
              <Button
                text="Complete Link"
                icon={<bi.BiLinkAlt />}
                onClick={onHandleCompleteLinkClick}
              />
            )}
            {isFolder && (
              <div className="select">
                <Select
                  bg="f1f1f1"
                  defaultValue={(currentNode as IFolderNode).viewType}
                  onChange={handleUpdateFolderView}
                  height={35}
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </Select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
