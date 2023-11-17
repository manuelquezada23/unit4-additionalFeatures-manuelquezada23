import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { INode } from "../../../types";
import "./SearchResultsModal.scss";
import { Select } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import { searchResultsState, searchQueryState } from "../../../global/Atoms";
import { GridView } from "~/components/NodeView/NodeContent/FolderContent/GridView";
import { Button } from "~/components/Button";

export interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for visualizing a node's graph.
 */
export const SearchResultsModal = (props: SearchResultsModalProps) => {
  const { isOpen, onClose } = props;
  const searchResults = useRecoilValue(searchResultsState);
  const searchQuery = useRecoilValue(searchQueryState);
  const [filterValue, setFilterValue] = useState("none");
  const [sortValue, setSortValue] = useState("relevancy");

  const [searchResultsList, setSearchResultsList] = useState(searchResults);

  // Close the modal
  const handleClose = () => {
    setFilterValue("none");
    setSortValue("relevancy");
    onClose();
  };

  useEffect(() => {
    setSearchResultsList(searchResults);
  }, [isOpen]);

  // helper function to filter array
  const filter = () => {
    let searchResultsCopy = [...searchResults];
    // filter by text
    if (filterValue === "text") {
      searchResultsCopy = searchResultsCopy.filter(
        (obj) => obj.type === "text"
      );
    }
    // filter by image
    else if (filterValue === "image") {
      searchResultsCopy = searchResultsCopy.filter(
        (obj) => obj.type === "image"
      );
    }
    // filter by folder
    else if (filterValue === "folder") {
      searchResultsCopy = searchResultsCopy.filter(
        (obj) => obj.type === "folder"
      );
    }

    return searchResultsCopy;
  };

  // helper function to sort array
  const sort = (filteredResults: INode[]) => {
    let filteredResultsCopy = [...filteredResults];
    if (sortValue === "dateCreated") {
      filteredResultsCopy = filteredResultsCopy.sort(
        (a, b) =>
          new Date(b.dateCreated!).valueOf() -
          new Date(a.dateCreated!).valueOf()
      );
    }
    return filteredResultsCopy;
  };

  const handleApply = () => {
    const filteredResults = filter();
    const sortedResults = sort(filteredResults);
    setSearchResultsList(sortedResults);
  };

  const handleReset = () => {
    setFilterValue("none");
    setSortValue("relevancy");
    setSearchResultsList(searchResults);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <div className="modal-font">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Search Results for {searchQuery}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div className="searchResultsModal">
              <div className="searchResultsModal-header">
                <div className="searchResultsModal-header-filter">
                  <div className="searchResultsModal-header-filter-text">
                    Filter by:
                  </div>
                  <Select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="text">Node Type: Text</option>
                    <option value="image">Node Type: Image</option>
                    <option value="folder">Node Type: Folder</option>
                  </Select>
                </div>
                <div className="searchResultsModal-header-filter-right">
                  <div className="searchResultsModal-header-filter-text">
                    Sort by:
                  </div>
                  <Select
                    value={sortValue}
                    onChange={(e) => setSortValue(e.target.value)}
                  >
                    <option value="relevancy">Relevancy</option>
                    <option value="dateCreated">Date Created</option>
                  </Select>
                </div>
                <div className="searchResultsModal-header-filter-button">
                  <div className="searchResultsModal-header-filter-text"></div>
                  <Button
                    text="Apply"
                    onClick={handleApply}
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
                <div className="searchResultsModal-header-filter-button-reset">
                  <div className="searchResultsModal-header-filter-text"></div>
                  <Button
                    text="Reset"
                    onClick={handleReset}
                    style={{ width: "100%", height: "40px" }}
                  />
                </div>
              </div>
              {searchResultsList.length === 0 && (
                <div className="no-results">No results found.</div>
              )}
              {searchResultsList.length > 0 && (
                <GridView childNodes={searchResultsList} />
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </div>
    </Modal>
  );
};
