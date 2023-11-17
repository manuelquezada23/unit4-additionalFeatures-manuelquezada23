import React, { useState } from "react";
import * as bi from "react-icons/bi";
import "./SearchBar.scss";
import { FrontendNodeGateway } from "~/nodes";
import { useSetRecoilState } from "recoil";
import { searchQueryState, searchResultsState } from "../../global/Atoms";

interface SearchBarProps {
  handleSearchButtonClick: () => void;
}

export const SearchBar = (props: SearchBarProps) => {
  const { handleSearchButtonClick } = props;
  const [searchText, setSearchText] = useState<string>("");
  const setSearchResultsState = useSetRecoilState(searchResultsState);
  const setSearchQueryState = useSetRecoilState(searchQueryState);

  const openSearchModal = async () => {
    const searchResp = await FrontendNodeGateway.search(searchText);
    if (searchResp.success) {
      setSearchResultsState(searchResp.payload);
      setSearchQueryState(searchText);
      handleSearchButtonClick();
      setSearchText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      openSearchModal();
    }
  };

  return (
    <div className="searchBar">
      <input
        className="searchBar-input"
        placeholder="Search..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={(e) => handleKeyPress(e)}
      ></input>
      <bi.BiSearch
        className="searchBar-icon"
        onClick={() => {
          openSearchModal();
        }}
      />
    </div>
  );
};
