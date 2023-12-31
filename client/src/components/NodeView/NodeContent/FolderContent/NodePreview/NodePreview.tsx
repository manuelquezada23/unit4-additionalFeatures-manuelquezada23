import React from "react";
import Link from "next/link";
import { nodeTypeIcon, pathToString } from "../../../../../global";
import { INode } from "../../../../../types";
import "./NodePreview.scss";
import { NodePreviewContent } from "./NodePreviewContent";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  selectedNodeState,
  searchResultsModalState,
} from "../../../../../global/Atoms";

export interface INodePreviewProps {
  node: INode;
}

/** Full page view focused on a node's content, with annotations and links */
export const NodePreview = (props: INodePreviewProps) => {
  const { node } = props;
  const { type, title, content } = node;
  const setSelectedNode = useSetRecoilState(selectedNodeState);
  const [searchResultsModalOpen, setSearchResultsModalOpen] = useRecoilState(
    searchResultsModalState
  );
  return (
    <Link href={`/${pathToString(node.filePath)}`}>
      <div
        className={"grid-nodePreview"}
        onClick={() => {
          setSelectedNode(node);
          if (searchResultsModalOpen === true) {
            setSearchResultsModalOpen(false);
          }
        }}
      >
        <div className="content-preview">
          <NodePreviewContent type={type} content={content} />
        </div>
        <div className="node-info">
          <div className="info-container">
            <div className="main-info">
              {nodeTypeIcon(node.type)}
              <div className="title">{title}</div>
            </div>
            <div className="sub-info">
              {node.dateCreated && (
                <div className="dateCreated">
                  {"Created on " +
                    new Date(node.dateCreated).toLocaleDateString("en-US")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
