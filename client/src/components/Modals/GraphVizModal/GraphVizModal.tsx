import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { FrontendNodeGateway } from "../../../nodes";
import { INode } from "../../../types";
import "./GraphVizModal.scss";
import ReactFlow, { Edge, Node } from "react-flow-renderer";
import { FrontendAnchorGateway } from "~/anchors";
import { FrontendLinkGateway } from "~/links";

export interface GraphVizModalProps {
  isOpen: boolean;
  node: INode;
  onClose: () => void;
}

/**
 * Modal for visualizing a node's graph.
 */
export const GraphVizModal = (props: GraphVizModalProps) => {
  const { isOpen, onClose, node } = props;
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Close the modal
  const handleClose = () => {
    onClose();
  };

  // helper method to set coordinates of nodes
  function calculateInitialPositions(i: number) {
    const isEven = i % 2 == 0;
    const initialX = 175;
    const initialY = 80;

    if (i === 0) {
      return {
        x: initialX,
        y: initialY * i + 20,
      };
    }

    return {
      x: initialX + (isEven ? 100 : -100),
      y: initialY * i + 20,
    };
  }

  const loadAnchorsAndLinksFromNodeId = useCallback(async () => {
    const anchorsFromNode = await FrontendAnchorGateway.getAnchorsByNodeId(
      node.nodeId
    );
    if (anchorsFromNode.success) {
      // get all the links from the backend
      const getLinksByAnchorIdsResponse =
        await FrontendLinkGateway.getLinksByAnchorIds(
          anchorsFromNode.payload.map((anchor) => anchor.anchorId)
        );

      // get all the edges formatted for ReactFlow
      const links = getLinksByAnchorIdsResponse.payload;
      let mappedEdges = [];
      mappedEdges = links!.map((edge) => ({
        id: edge.linkId,
        source: node.nodeId,
        target:
          edge.anchor1NodeId === node.nodeId
            ? edge.anchor2NodeId
            : edge.anchor1NodeId,
        animated: false,
      }));

      // check if there are multiple links to the same target
      const filteredEdges = [];
      const existingTargets: string[] = [];
      for (let i = 0; i < mappedEdges.length; i++) {
        const currentTarget = mappedEdges[i].target;
        // if the target already exists (there are multiple links)
        if (existingTargets.includes(currentTarget)) {
          // get all items in the list where target is equal to the currentTarget
          const duplicateEdges = mappedEdges.filter(
            (edge) => edge.target === currentTarget
          );

          // create a new object with the "label" field
          const newEdge = {
            id: mappedEdges[i].id,
            source: node.nodeId,
            target: currentTarget,
            animated: false,
            label: `${duplicateEdges.length} links`,
          };

          // Add the new object to the filteredEdges array
          filteredEdges.push(newEdge);
        } else {
          // else just push it
          filteredEdges.push(mappedEdges[i]);
        }
        existingTargets.push(currentTarget);
      }

      // now, create the nodes list for ReactFlow
      const mappedNodes = [];
      const mappedNodesIDs: string[] = [];

      // first, add the current node to the beginning of the list
      const currentNode = {
        id: node.nodeId,
        type: "input",
        data: { label: node.title },
        position: {},
        style: { background: "lightgrey" },
      };
      mappedNodes.push(currentNode);
      mappedNodesIDs.push(currentNode.id);

      // go through links and add the nodes remaining
      for (let i = 0; i < links!.length; i++) {
        const link = links![i];
        const linkToCheck =
          link.anchor1NodeId === node.nodeId
            ? link.anchor2NodeId
            : link.anchor1NodeId;
        if (!mappedNodesIDs.includes(linkToCheck)) {
          const nodeResp = await FrontendNodeGateway.getNode(linkToCheck);
          mappedNodes.push({
            id: linkToCheck,
            data: { label: nodeResp.payload?.title },
            type: "output",
            position: {},
          });
        }
        mappedNodesIDs.push(linkToCheck);
      }

      // now, set positions for all the nodes
      const mappedNodesWithPositions = mappedNodes.map((node, i) => ({
        ...node,
        position: calculateInitialPositions(i),
      }));

      setNodes(mappedNodesWithPositions);
      setEdges(filteredEdges);
    }
  }, [node, isOpen]);

  useEffect(() => {
    loadAnchorsAndLinksFromNodeId();
  }, [loadAnchorsAndLinksFromNodeId]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="modal-font">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Visualizing Node Collection for {node.title}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div className="reactFlow-div">
              <ReactFlow nodes={nodes} edges={edges} fitView />
            </div>
          </ModalBody>
        </ModalContent>
      </div>
    </Modal>
  );
};
