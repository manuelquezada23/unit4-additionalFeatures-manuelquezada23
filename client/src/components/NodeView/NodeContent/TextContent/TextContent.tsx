import React, { useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { FrontendAnchorGateway } from "../../../../anchors";
import Highlight from "@tiptap/extension-highlight";
import {
  currentNodeState,
  refreshAnchorState,
  refreshLinkListState,
  refreshState,
  selectedAnchorsState,
  selectedExtentState,
} from "../../../../global/Atoms";
import { FrontendLinkGateway } from "../../../../links";
import {
  Extent,
  IServiceResponse,
  failureServiceResponse,
  successfulServiceResponse,
} from "../../../../types";
import "./TextContent.scss";
import { TextMenu } from "./TextMenu";
import { Link } from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

/** The content of an text node, including all its anchors */
export const TextContent = () => {
  const currentNode = useRecoilValue(currentNodeState);
  const refresh = useRecoilValue(refreshState);
  const anchorRefresh = useRecoilValue(refreshAnchorState);
  const linkMenuRefresh = useRecoilValue(refreshLinkListState);
  const setSelectedExtent = useSetRecoilState(selectedExtentState);
  const selectedAnchors = useRecoilValue(selectedAnchorsState);

  // [Lab]: Add all of the functionality for a rich text editor!
  // (This file is where the majority of your work on text editing will be done)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: false,
        linkOnPaste: false,
      }),
      Highlight,
    ],
    content: currentNode.content,
  });

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

  // set the anchors when they are updated
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(editor.getHTML());
      addAnchorMarks();
    }
  }, [currentNode, selectedAnchors, refresh]);

  // when anchors or links are deleted via the NodeLinkMenu, we must make sure to update the content
  useEffect(() => {
    if (editor) {
      const content = currentNode.content;
      editor.commands.setContent(content);
    }
  }, [anchorRefresh, linkMenuRefresh]);

  if (!editor) {
    return <div>{currentNode.content}</div>;
  }

  return (
    <div className="textContent-div">
      <TextMenu editor={editor} />
      <div className="editorContent-div">
        <EditorContent editor={editor} onPointerUp={onPointerUp} />
      </div>
    </div>
  );
};
