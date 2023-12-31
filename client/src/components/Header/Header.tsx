import React from "react";
import { Button } from "../Button";
import * as ri from "react-icons/ri";
import * as ai from "react-icons/ai";

import { NodeIdsToNodesMap } from "../../types";
import Link from "next/link";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  isLinkingState,
  startAnchorState,
  selectedExtentState,
} from "../../global/Atoms";
import "./Header.scss";
import { SearchBar } from "../SearchBar";

interface IHeaderProps {
  nodeIdsToNodesMap: NodeIdsToNodesMap;
  onCreateNodeButtonClick: () => void;
  onHomeClick: () => void;
  handleSearchButtonClick: () => void;
}

export const Header = (props: IHeaderProps) => {
  const {
    onCreateNodeButtonClick,
    onHomeClick,
    nodeIdsToNodesMap,
    handleSearchButtonClick,
  } = props;
  const customButtonStyle = { height: 30, marginLeft: 10, width: 30 };
  const [isLinking, setIsLinking] = useRecoilState(isLinkingState);
  const [startAnchor, setStartAnchor] = useRecoilState(startAnchorState);
  const setSelectedExtent = useSetRecoilState(selectedExtentState);

  const handleCancelLink = () => {
    setStartAnchor(null);
    setSelectedExtent(null);
    setIsLinking(false);
  };

  return (
    <div className={isLinking ? "header-linking" : "header"}>
      <div className="left-bar">
        <Link href={"/"}>
          <div className="name" onClick={onHomeClick}>
            My<b>Hypermedia</b>
          </div>
        </Link>
        <Link href={"/"}>
          <Button
            isWhite={isLinking}
            style={customButtonStyle}
            icon={<ri.RiHome2Line />}
            onClick={onHomeClick}
          />
        </Link>
        <Button
          isWhite={isLinking}
          style={customButtonStyle}
          icon={<ai.AiOutlinePlus />}
          onClick={onCreateNodeButtonClick}
        />
        <SearchBar handleSearchButtonClick={handleSearchButtonClick} />
      </div>
      {isLinking && startAnchor && (
        <div className="right-bar">
          <div>
            Linking from <b>{nodeIdsToNodesMap[startAnchor.nodeId].title}</b>
          </div>
          <Button
            onClick={handleCancelLink}
            isWhite
            text="Cancel"
            style={{ fontWeight: 600, height: 30, marginLeft: 20 }}
            icon={<ri.RiCloseLine />}
          />
        </div>
      )}
    </div>
  );
};
