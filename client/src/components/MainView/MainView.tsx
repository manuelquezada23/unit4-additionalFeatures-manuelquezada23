import { ChakraProvider } from "@chakra-ui/react";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  refreshState,
  selectedNodeState,
  selectedAnchorsState,
  selectedExtentState,
  alertOpenState,
  alertTitleState,
  alertMessageState,
  isAppLoadedState,
  rootNodesState,
  searchResultsModalState,
} from "../../global/Atoms";
import { useRouter } from "next/router";
import { FrontendNodeGateway } from "../../nodes";
import { INode, NodeIdsToNodesMap, RecursiveNodeTree } from "../../types";
import { Alert } from "../Alert";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import { Header } from "../Header";
import { LoadingScreen } from "../LoadingScreen";
import { CompleteLinkModal, CreateNodeModal, MoveNodeModal } from "../Modals";
import { NodeView } from "../NodeView";
import { TreeView } from "../TreeView";
import "./MainView.scss";
import { createNodeIdsToNodesMap, makeRootWrapper } from "./mainViewUtils";
import { GraphVizModal } from "../Modals/GraphVizModal";
import { SearchResultsModal } from "../Modals/SearchResultsModal";

export const MainView = React.memo(function MainView() {
  // app states
  const [isAppLoaded, setIsAppLoaded] = useRecoilState(isAppLoadedState);
  // modal states
  const [createNodeModalOpen, setCreateNodeModalOpen] = useState(false);
  const [completeLinkModalOpen, setCompleteLinkModalOpen] = useState(false);
  const [moveNodeModalOpen, setMoveNodeModalOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [searchResultsModalOpen, setSearchResultsModalOpen] = useRecoilState(
    searchResultsModalState
  );

  // node states
  const [selectedNode, setSelectedNode] = useRecoilState(selectedNodeState);
  const [rootNodes, setRootNodes] = useRecoilState(rootNodesState);
  const refresh = useRecoilValue(refreshState);
  // anchor states
  const setSelectedAnchors = useSetRecoilState(selectedAnchorsState);
  const setSelectedExtent = useSetRecoilState(selectedExtentState);
  // alerts
  const setAlertIsOpen = useSetRecoilState(alertOpenState);
  const setAlertTitle = useSetRecoilState(alertTitleState);
  const setAlertMessage = useSetRecoilState(alertMessageState);

  /** update our frontend root nodes from the database */
  const loadRootsFromDB = useCallback(async () => {
    const rootsFromDB = await FrontendNodeGateway.getRoots();
    if (rootsFromDB.success) {
      rootsFromDB.payload && setRootNodes(rootsFromDB.payload);
      setIsAppLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadRootsFromDB();
  }, [loadRootsFromDB, refresh]);

  const rootRecursiveNodeTree: RecursiveNodeTree = useMemo(
    () => makeRootWrapper(rootNodes),
    [rootNodes]
  );

  // map each nodeId to its full node object for easy access
  const nodeIdsToNodesMap: NodeIdsToNodesMap = useMemo(
    () => createNodeIdsToNodesMap(rootNodes),
    [rootNodes]
  );

  // node routing	logic
  const router = useRouter();
  const url = router.asPath;
  const lastUrlParam = url.substring(url.lastIndexOf("/") + 1);

  useEffect(() => {
    const currentNodeId = lastUrlParam;
    async function fetchNodeFromUrl() {
      const fetchResp = await FrontendNodeGateway.getNode(currentNodeId);
      if (fetchResp.success) {
        setSelectedNode(fetchResp.payload);
      }
    }
    fetchNodeFromUrl();
  }, [lastUrlParam]);

  const globalKeyHandlers = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        setSelectedAnchors([]);
        setSelectedExtent(null);
    }
  };

  // Trigger on app load
  useEffect(() => {
    document.addEventListener("keydown", globalKeyHandlers);
  }, []);

  // button handlers
  const handleCreateNodeButtonClick = useCallback(() => {
    setCreateNodeModalOpen(true);
  }, [setCreateNodeModalOpen]);

  const handleDeleteNodeButtonClick = useCallback(
    async (node: INode) => {
      if (node) {
        const deleteResp = await FrontendNodeGateway.deleteNode(node.nodeId);
        if (!deleteResp.success) {
          setAlertIsOpen(true);
          setAlertTitle("Delete node failed");
          setAlertMessage("Delete node failed in MainView.tsx:97");
          return;
        }
        const path: string[] = node.filePath.path;
        if (path.length > 1) {
          const parentId: string = path[path.length - 2];
          const parentResp = await FrontendNodeGateway.getNode(parentId);
          if (parentResp.success) {
            setSelectedNode(parentResp.payload);
            return;
          }
        }
        setSelectedNode(null);
        loadRootsFromDB();
      }
    },
    [loadRootsFromDB]
  );

  const handleGraphButtonClick = useCallback(() => {
    setGraphModalOpen(true);
  }, []);

  const handleSearchButtonClick = useCallback(() => {
    setSearchResultsModalOpen(true);
  }, []);

  const handleMoveNodeButtonClick = useCallback(() => {
    setMoveNodeModalOpen(true);
  }, []);

  const handleCompleteLinkClick = useCallback(() => {
    setCompleteLinkModalOpen(true);
  }, []);

  const handleHomeClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const getSelectedNodeChildren = useCallback(() => {
    if (!selectedNode) return undefined;
    return selectedNode.filePath.children.map(
      (childNodeId) => nodeIdsToNodesMap[childNodeId]
    );
  }, [nodeIdsToNodesMap, selectedNode]);

  let xLast: number;
  let dragging = false;

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    xLast = e.screenX;
    document.removeEventListener("pointermove", onPointerMove);
    document.addEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerup", onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (treeView.current && dragging) {
      const treeViewElement = treeView.current;
      let width = parseFloat(treeViewElement.style.width);
      const deltaX = e.screenX - xLast; // The change in the x location
      const newWidth = (width += deltaX);
      if (!(newWidth < 100 || newWidth > 480)) {
        treeViewElement.style.width = String(width) + "px";
        xLast = e.screenX;
      }
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = false;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  const treeView = useRef<HTMLHeadingElement>(null);

  return (
    <ChakraProvider>
      {!isAppLoaded ? (
        <LoadingScreen hasTimeout={true} />
      ) : (
        <div className="main-container">
          <Alert></Alert>
          <Header
            onHomeClick={handleHomeClick}
            onCreateNodeButtonClick={handleCreateNodeButtonClick}
            nodeIdsToNodesMap={nodeIdsToNodesMap}
            handleSearchButtonClick={handleSearchButtonClick}
          />
          <CreateNodeModal
            isOpen={createNodeModalOpen}
            onClose={() => setCreateNodeModalOpen(false)}
            roots={rootNodes}
            nodeIdsToNodesMap={nodeIdsToNodesMap}
            onSubmit={loadRootsFromDB}
          />
          <CompleteLinkModal
            isOpen={completeLinkModalOpen}
            onClose={() => setCompleteLinkModalOpen(false)}
            nodeIdsToNodes={nodeIdsToNodesMap}
          />
          <SearchResultsModal
            isOpen={searchResultsModalOpen}
            onClose={() => setSearchResultsModalOpen(false)}
          />
          {selectedNode && (
            <GraphVizModal
              isOpen={graphModalOpen}
              onClose={() => setGraphModalOpen(false)}
              node={selectedNode}
            />
          )}
          {selectedNode && (
            <MoveNodeModal
              isOpen={moveNodeModalOpen}
              onClose={() => setMoveNodeModalOpen(false)}
              onSubmit={loadRootsFromDB}
              node={selectedNode}
              roots={rootNodes}
            />
          )}
          <div className="content">
            <div
              className="treeView-container"
              ref={treeView}
              style={{ width: 350 }}
            >
              <TreeView
                roots={rootNodes}
                parentNode={selectedNode}
                setParentNode={setSelectedNode}
              />
            </div>
            <div className="divider" onPointerDown={onPointerDown} />
            <div className="node-wrapper">
              <NodeView
                childNodes={
                  selectedNode
                    ? getSelectedNodeChildren()
                    : rootNodes.map((root) => root.node)
                }
                currentNode={selectedNode ?? rootRecursiveNodeTree.node}
                onDeleteButtonClick={handleDeleteNodeButtonClick}
                onMoveButtonClick={handleMoveNodeButtonClick}
                onCompleteLinkClick={handleCompleteLinkClick}
                onCreateNodeButtonClick={handleCreateNodeButtonClick}
                nodeIdsToNodesMap={nodeIdsToNodesMap}
                onGraphButtonClick={handleGraphButtonClick}
              />
            </div>
          </div>
        </div>
      )}
      <ContextMenu />
    </ChakraProvider>
  );
});
