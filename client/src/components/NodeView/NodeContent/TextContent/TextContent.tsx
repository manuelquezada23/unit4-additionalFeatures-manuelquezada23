import React, { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { FrontendAnchorGateway } from "../../../../anchors";
import {
  currentNodeState,
  refreshAnchorState,
  refreshLinkListState,
  refreshState,
  selectedExtentState,
} from "../../../../global/Atoms";
import { FrontendLinkGateway } from "../../../../links";
import { FrontendNodeGateway } from "../../../../nodes";
import {
  Extent,
  IAnchor,
  ILink,
  INodeProperty,
  IServiceResponse,
  failureServiceResponse,
  makeINodeProperty,
  successfulServiceResponse,
} from "../../../../types";
import "./TextContent.scss";
import { TextMenu } from "./TextMenu";

/** The content of an text node, including all its anchors */
export const TextContent = () => {
  const currentNode = useRecoilValue(currentNodeState);
  const [refresh, setRefresh] = useRecoilState(refreshState);
  const [anchorRefresh, setAnchorRefresh] = useRecoilState(refreshAnchorState);
  const [linkMenuRefresh, setLinkMenuRefresh] =
    useRecoilState(refreshLinkListState);
  const setSelectedExtent = useSetRecoilState(selectedExtentState);
  const [onSave, setOnSave] = useState(false);

  // TODO: Add all of the functionality for a rich text editor!
  // (This file is where the majority of your work on text editing will be done)
  const editor = null;

  /** This function adds anchor marks for anchors in the database to the text editor */
  const addAnchorMarks = async (): Promise<IServiceResponse<any>> => {
    if (!editor) {
      return failureServiceResponse("no editor");
    }
    const anchorResponse = await FrontendAnchorGateway.getAnchorsByNodeId(
      currentNode.nodeId
    );
    if (!anchorResponse || !anchorResponse.success) {
      return failureServiceResponse("failed to get anchors");
    }
    if (!anchorResponse.payload) {
      return successfulServiceResponse("no anchors to add");
    }
    for (let i = 0; i < anchorResponse.payload?.length; i++) {
      const anchor = anchorResponse.payload[i];
      const linkResponse = await FrontendLinkGateway.getLinksByAnchorId(
        anchor.anchorId
      );
      if (!linkResponse.success) {
        return failureServiceResponse("failed to get link");
      }
      const link = linkResponse.payload[0];
      let node = link.anchor1NodeId;
      if (node == currentNode.nodeId) {
        node = link.anchor2NodeId;
      }
      if (anchor.extent && anchor.extent.type == "text") {
        editor.commands.setTextSelection({
          from: anchor.extent.startCharacter + 1,
          to: anchor.extent.endCharacter + 1,
        });
        editor.commands.setLink({
          href: "/" + node + "/",
          target: anchor.anchorId,
        });
      }
    }
    return successfulServiceResponse("added anchors");
  };

  // Set the content and add anchor marks when this component loads
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(currentNode.content);
      addAnchorMarks();
    }
  }, [currentNode, editor]);

  // Set the selected extent to null when this component loads
  useEffect(() => {
    setSelectedExtent(null);
  }, [currentNode]);

  const onPointerUp = () => {
    if (!editor) {
      return;
    }
    const from = editor.state.selection.from;
    const to = editor.state.selection.to;
    const text = editor.state.doc.textBetween(from, to);
    if (from !== to) {
      const selectedExtent: Extent = {
        type: "text",
        startCharacter: from - 1,
        endCharacter: to - 1,
        text: text,
      };
      setSelectedExtent(selectedExtent);
    } else {
      setSelectedExtent(null);
    }
  };

  if (!editor) {
    return <div>{currentNode.content}</div>;
  }

  return <div>Editor will go here!</div>;
};
