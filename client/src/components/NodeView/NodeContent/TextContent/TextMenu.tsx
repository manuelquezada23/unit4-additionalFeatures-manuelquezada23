import { Editor } from "@tiptap/react";
import "./TextMenu.scss";
import {
  Extent,
  INodeProperty,
  failureServiceResponse,
  makeINodeProperty,
  successfulServiceResponse,
} from "~/types";
import { FrontendNodeGateway } from "~/nodes";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  currentNodeState,
  alertOpenState,
  alertTitleState,
  alertMessageState,
  refreshState,
} from "~/global/Atoms";
import { FrontendAnchorGateway } from "~/anchors";
import { FrontendLinkGateway } from "~/links";

interface IEditorProps {
  editor: Editor | null;
}

export const TextMenu = (props: IEditorProps) => {
  const currentNode = useRecoilValue(currentNodeState);
  const setAlertIsOpen = useSetRecoilState(alertOpenState);
  const setAlertTitle = useSetRecoilState(alertTitleState);
  const setAlertMessage = useSetRecoilState(alertMessageState);
  const [refresh, setRefresh] = useRecoilState(refreshState);

  const { editor } = props;
  if (!editor) {
    return null;
  }

  // helper function to delete anchors
  const deleteAnchors = async () => {
    if (!editor) {
      return;
    }

    // get anchors by the current node id
    const anchorResponse = await FrontendAnchorGateway.getAnchorsByNodeId(
      currentNode.nodeId
    );

    if (!anchorResponse || !anchorResponse.success) {
      return failureServiceResponse("failed to get anchors");
    }
    if (!anchorResponse.payload) {
      return successfulServiceResponse("no anchors to add");
    }

    // anchors in database
    const databaseAnchors = anchorResponse.payload;
    // list to keep track of editor anchor IDs
    const editorAnchorIDs: string[] = [];
    // list to keep track of anchor IDs we want to delete
    const anchorIDsToDelete: string[] = [];

    // populate editorAnchorIDs
    editor.state.doc.descendants((node) => {
      const linkMarks = node.marks.filter((mark) => mark.type.name === "link");

      linkMarks.forEach(async (linkMark) => {
        const anchorId = linkMark.attrs.target;
        editorAnchorIDs.push(anchorId);
      });
    });

    // populate anchorIDsToDelete. if the anchor is in the database but not in the editor, we want to delete them
    databaseAnchors.forEach((databaseAnchor) => {
      if (!editorAnchorIDs.includes(databaseAnchor.anchorId)) {
        anchorIDsToDelete.push(databaseAnchor.anchorId);
      }
    });

    await FrontendAnchorGateway.deleteAnchors(anchorIDsToDelete);

    // delete oprhan anchors
    const getAnchorsResponse = await FrontendAnchorGateway.getAnchors(
      databaseAnchors.map((anchor) => anchor.anchorId)
    );
    if (!getAnchorsResponse || !getAnchorsResponse.success) {
      return failureServiceResponse("failed to get anchors");
    }
    if (!getAnchorsResponse.payload) {
      return successfulServiceResponse("no anchors to add");
    }
    // get the updated new anchors
    const newAnchors = getAnchorsResponse.payload;

    // get links with the new updated anchors
    const getLinksByAnchorIdsResponse =
      await FrontendLinkGateway.getLinksByAnchorIds(
        getAnchorsResponse.payload.map((anchor) => anchor.anchorId)
      );

    if (!getLinksByAnchorIdsResponse || !getLinksByAnchorIdsResponse.success) {
      return failureServiceResponse("failed to get links by anchor ids");
    }
    if (!getLinksByAnchorIdsResponse.payload) {
      return successfulServiceResponse(
        "no links to get from anchor ids provided"
      );
    }

    // delete orphan anchors by creating lists to keep track of which ones we want to delete
    const anchorIDToDelete: string[] = [];
    const linkIDsToDelete: string[] = [];
    const links = getLinksByAnchorIdsResponse.payload;
    links.forEach((link) => {
      newAnchors.forEach((anchor) => {
        if (anchor.anchorId === link.anchor1Id) {
          if (
            !newAnchors
              .map((anchor) => anchor.anchorId)
              .includes(link.anchor2Id)
          ) {
            anchorIDToDelete.push(anchor.anchorId);
            linkIDsToDelete.push(link.linkId);
          }
        } else if (anchor.anchorId === link.anchor2Id) {
          if (
            !newAnchors
              .map((anchor) => anchor.anchorId)
              .includes(link.anchor1Id)
          ) {
            anchorIDToDelete.push(anchor.anchorId);
            linkIDsToDelete.push(link.linkId);
          }
        }
      });
    });

    // delete orphan anchors and its links
    await FrontendLinkGateway.deleteLinks(linkIDsToDelete);
    await FrontendAnchorGateway.deleteAnchors(anchorIDToDelete);

    editor.commands.selectAll();
    editor.commands.unsetLink();

    // update content of current node
    let content = currentNode.content;
    if (editor) {
      content = editor.getHTML();
    }

    // update node property with new content
    const nodeProperty: INodeProperty = makeINodeProperty("content", content);
    const nodeUpdateResp = await FrontendNodeGateway.updateNode(
      currentNode.nodeId,
      [nodeProperty]
    );
    if (!nodeUpdateResp.success) {
      setAlertIsOpen(true);
      setAlertTitle("Node content update failed");
      setAlertMessage(nodeUpdateResp.message);
      return;
    }
  };

  // helper function to modify anchors when user changes anchors
  const modifyAnchors = async () => {
    if (!editor) {
      return;
    }

    // get the anchors from the backend by node id
    const anchorResponse = await FrontendAnchorGateway.getAnchorsByNodeId(
      currentNode.nodeId
    );

    if (!anchorResponse || !anchorResponse.success) {
      return failureServiceResponse("failed to get anchors");
    }
    if (!anchorResponse.payload) {
      return successfulServiceResponse("no anchors to add");
    }

    const anchors = anchorResponse.payload;

    editor.state.doc.descendants((node, pos) => {
      const linkMarks = node.marks.filter((mark) => mark.type.name === "link");
      linkMarks.forEach(async (linkMark) => {
        const anchorId = linkMark.attrs.target;
        if (linkMark.attrs.target.startsWith("anchor")) {
          const correspondingAnchor = anchors.find(
            (anchor) => anchor.anchorId === anchorId
          );

          // find the correspondingAnchor from the database and update the position and its text
          if (correspondingAnchor) {
            const from = pos - 1;
            const to = pos + node.nodeSize - 1;
            const updatedExtent: Extent = {
              type: "text",
              startCharacter: from,
              endCharacter: to,
              text: node.text!,
            };
            const anchorResponse = await FrontendAnchorGateway.updateExtent(
              anchorId,
              updatedExtent
            );
            if (!anchorResponse || !anchorResponse.success) {
              return failureServiceResponse("failed to update anchor extent");
            }
            if (!anchorResponse.payload) {
              return successfulServiceResponse("no extents to update");
            }
          }
        }
      });
    });
  };

  // function that gets called when the save button is pressed
  const handleSaveOnClick = async () => {
    if (!editor) {
      return;
    }

    // Access the formatted content
    const content = editor.getHTML();

    // save to database
    const nodeProperty: INodeProperty = makeINodeProperty("content", content);
    const updateNodeResp = await FrontendNodeGateway.updateNode(
      currentNode.nodeId,
      [nodeProperty]
    );

    // show alert if there is an error and return
    if (!updateNodeResp.success) {
      setAlertIsOpen(true);
      setAlertTitle("Error updating node");
      setAlertMessage(updateNodeResp.message);
      return;
    } else {
      // else reset buttons so that none of them are active
      editor.commands.setContent(content);
    }

    // modify anchors if needed
    await modifyAnchors();
    await deleteAnchors();

    setRefresh(!refresh);
    editor.commands.blur();
  };

  // [Lab]: Add a menu of buttons for your text editor here
  return (
    <div id="textMenu">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={
          "textEditorButton" +
          (editor.isActive("bold") ? " activeTextEditorButton" : "")
        }
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={
          "textEditorButton" +
          (editor.isActive("italic") ? " activeTextEditorButton" : "")
        }
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        disabled={!editor.can().chain().focus().toggleHighlight().run()}
        className={
          "textEditorButton" +
          (editor.isActive("highlight") ? " activeTextEditorButton" : "")
        }
      >
        Highlight
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        className={
          "textEditorButton" +
          (editor.isActive("bulletList") ? " activeTextEditorButton" : "")
        }
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={
          "textEditorButton" +
          (editor.isActive("strike") ? " activeTextEditorButton" : "")
        }
      >
        Strike
      </button>
      <button
        id="saveButton"
        className="textEditorButton"
        onClick={handleSaveOnClick}
      >
        Save
      </button>
    </div>
  );
};
