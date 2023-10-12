import { useRouter } from "next/router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as ri from "react-icons/ri";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { fetchAnchors, fetchLinks } from "..";
import { FrontendAnchorGateway } from "../../../../anchors";
import {
  currentNodeState,
  refreshState,
  selectedAnchorsState,
  selectedExtentState,
  startAnchorState,
} from "../../../../global/Atoms";
import { IAnchor, IImageExtent } from "../../../../types";
import "./ImageContent.scss";

/** The content of an image node, including any anchors */
export const ImageContent = () => {
  const currentNode = useRecoilValue(currentNodeState);
  const refresh = useRecoilValue(refreshState);
  const startAnchor = useRecoilValue(startAnchorState);
  const [selectedAnchors, setSelectedAnchors] =
    useRecoilState(selectedAnchorsState);
  const setSelectedExtent = useSetRecoilState(selectedExtentState);
  let dragging = false; // Indicated whether we are currently dragging the image
  let currentTop: number; // To store the top of the currently selected region for onMove
  let currentLeft: number; // To store the left of the currently selected region for onMove
  let xSelectionLast: number; // To store the last x for resizing the selection
  let ySelectionLast: number; // To store the last y for resizing the selection

  /**
   * useRef EXAMPLE: Here is an example of use ref to store a mutable html object
   * The selection ref is how we can access the selection that we render
   *
   * // TODO [Editable]: This is the component that we would want to resize
   */
  const imageContainer = useRef<HTMLHeadingElement>(null);
  const selection = useRef<HTMLHeadingElement>(null);

  /* State variable to keep track of anchors rendered on image */
  const [imageAnchors, setImageAnchors] = useState<JSX.Element[]>([]);

  /**
   * State variable to keep track of the currently selected anchor IDs.
   * Compare with selectedAnchors to update previous state
   */
  const [selectedAnchorIds, setSelectedAnchorIds] = useState<string[]>([]);

  const router = useRouter();

  /**
   * Handle click on anchor that is displayed on image
   * Single click: Select the anchor
   * Double click: Navigate to the opposite node
   */
  const handleAnchorSelect = async (e: React.MouseEvent, anchor: IAnchor) => {
    e.stopPropagation();
    e.preventDefault();
    const links = await fetchLinks(anchor.anchorId);
    const anchors = await fetchAnchors(links);
    if (links.length > 0) {
      if (links[0].anchor1Id !== anchor.anchorId) {
        router.push(`/${links[0].anchor1NodeId}/`);
      } else if (links[0].anchor2Id !== anchor.anchorId) {
        router.push(`/${links[0].anchor2NodeId}/`);
      }
      setSelectedExtent(anchor.extent);
      setSelectedAnchors(anchors);
    }
  };

  /**
   * This method displays the existing anchors. We are fetching them from
   * the data with a call to FrontendAnchorGateway.getAnchorsByNodeId
   * which returns a list of IAnchors that are on currentNode
   */
  const displayImageAnchors = useCallback(async () => {
    let imageAnchors: IAnchor[];
    const anchorsFromNode = await FrontendAnchorGateway.getAnchorsByNodeId(
      currentNode.nodeId
    );
    if (anchorsFromNode.success) {
      const anchorElementList: JSX.Element[] = [];
      // List of anchor elements to return
      imageAnchors = anchorsFromNode.payload;
      // IAnchor array from FrontendAnchorGateway call
      imageAnchors.forEach((anchor) => {
        // Checking that the extent is of type image to access IImageExtent
        if (anchor.extent?.type == "image") {
          if (
            !(
              startAnchor &&
              startAnchor.extent?.type == "image" &&
              startAnchor == anchor &&
              startAnchor.nodeId == currentNode.nodeId
            )
          ) {
            anchorElementList.push(
              <div
                id={anchor.anchorId}
                key={"image." + anchor.anchorId}
                className="image-anchor"
                onClick={(e) => {
                  handleAnchorSelect(e, anchor);
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  height: anchor.extent.height,
                  left: anchor.extent.left,
                  top: anchor.extent.top,
                  width: anchor.extent.width,
                }}
              />
            );
          }
        }
      });
      if (
        startAnchor &&
        startAnchor.extent?.type == "image" &&
        startAnchor.nodeId == currentNode.nodeId
      ) {
        anchorElementList.push(
          <div
            id={startAnchor.anchorId}
            key={"image.startAnchor" + startAnchor.anchorId}
            className="image-startAnchor"
            style={{
              height: startAnchor.extent.height,
              left: startAnchor.extent.left,
              top: startAnchor.extent.top,
              width: startAnchor.extent.width,
            }}
          />
        );
      }
      setImageAnchors(anchorElementList);
    }

    // display the selected anchors
    selectedAnchorIds.forEach((anchorId) => {
      const prevSelectedAnchor = document.getElementById(anchorId);
      if (prevSelectedAnchor) {
        prevSelectedAnchor.className = "image-anchor";
      }
    });
    if (imageContainer.current) {
      imageContainer.current.style.outline = "";
    }
    const newSelectedAnchorIds: string[] = [];
    selectedAnchors &&
      selectedAnchors.forEach((anchor) => {
        if (anchor) {
          if (anchor.extent === null && imageContainer.current) {
            imageContainer.current.style.outline = "solid 3px blue";
          }
          const anchorElement = document.getElementById(anchor.anchorId);
          if (anchorElement) {
            anchorElement.className = "image-anchor selected";
            newSelectedAnchorIds.push(anchorElement.id);
          }
        }
      });
    setSelectedAnchorIds(newSelectedAnchorIds);
  }, [currentNode, startAnchor, selectedAnchorIds, selectedAnchors]);

  /**
   * To trigger on load and when we setSelectedExtent
   */
  useEffect(() => {
    setSelectedExtent && setSelectedExtent(null);
    if (selection.current) {
      selection.current.style.left = "-50px";
      selection.current.style.top = "-50px";
      selection.current.style.width = "0px";
      selection.current.style.height = "0px";
    }
  }, [setSelectedExtent, refresh]);

  useEffect(() => {
    displayImageAnchors();
  }, [selectedAnchors, currentNode, refresh, startAnchor]);

  /* onSelectionPointerDown initializes the selection */
  const onSelectionPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    // The y location of the image top in the browser
    const imageTop = imageContainer.current?.getBoundingClientRect().top;
    // The x location of the image left in the browser
    const imageLeft = imageContainer.current?.getBoundingClientRect().left;

    const x = e.clientX; // The x location of the pointer in the browser
    const y = e.clientY; // The y location of the pointer in the browser
    xSelectionLast = e.clientX;
    ySelectionLast = e.clientY;
    if (selection.current && imageLeft && imageTop) {
      selection.current.style.left = String(x - imageLeft) + "px";
      selection.current.style.top = String(y - imageTop) + "px";
      currentLeft = x - imageLeft;
      currentTop = y - imageTop;
      selection.current.style.width = "0px";
      selection.current.style.height = "0px";
    }
    document.removeEventListener("pointermove", onSelectionPointerMove);
    document.addEventListener("pointermove", onSelectionPointerMove);
    document.removeEventListener("pointerup", onSelectionPointerUp);
    document.addEventListener("pointerup", onSelectionPointerUp);
  };

  /* onMove resizes the selection */
  const onSelectionPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragging) {
      const x = e.clientX; // The x location of the pointer in the browser
      const y = e.clientY; // The y location of the pointer in the browser
      const deltaX = x - xSelectionLast; // The change in the x location
      const deltaY = y - ySelectionLast; // The change in the y location
      xSelectionLast = e.clientX;
      ySelectionLast = e.clientY;

      if (selection.current) {
        const imageTop = imageContainer.current?.getBoundingClientRect().top;
        const imageLeft = imageContainer.current?.getBoundingClientRect().left;
        let left = parseFloat(selection.current.style.left);
        let top = parseFloat(selection.current.style.top);
        let width = parseFloat(selection.current.style.width);
        let height = parseFloat(selection.current.style.height);

        // Horizontal dragging
        // Case A: Dragging above start point
        if (imageLeft && x - imageLeft < currentLeft) {
          width -= deltaX;
          left += deltaX;
          selection.current.style.left = String(left) + "px";
          // Case B: Dragging below start point
        } else {
          width += deltaX;
        }

        // Vertical dragging
        // Case A: Dragging to the left of start point
        if (imageTop && y - imageTop < currentTop) {
          height -= deltaY;
          top += deltaY;
          selection.current.style.top = String(top) + "px";
          // Case B: Dragging to the right of start point
        } else {
          height += deltaY;
        }

        // Update height and width
        selection.current.style.width = String(width) + "px";
        selection.current.style.height = String(height) + "px";
      }
    }
  };

  /**
   * onSelectionPointerUp so we have completed making our selection,
   * therefore we should create a new IImageExtent and
   * update the currently selected extent
   * @param e
   */
  const onSelectionPointerUp = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging = false;
    if (selection.current) {
      currentTop = 0;
      currentLeft = 0;
      const extent: IImageExtent = {
        type: "image",
        height: parseFloat(selection.current.style.height),
        left: parseFloat(selection.current.style.left),
        top: parseFloat(selection.current.style.top),
        width: parseFloat(selection.current.style.width),
      };
      // Check if setSelectedExtent exists, if it does then update it
      if (setSelectedExtent) {
        setSelectedExtent(extent);
      }
    }
    // Remove pointer event listeners
    document.removeEventListener("pointermove", onSelectionPointerMove);
    document.removeEventListener("pointerup", onSelectionPointerUp);
  };

  const onHandleClearSelectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (setSelectedExtent) {
      setSelectedExtent(null);
      if (selection.current) {
        // Note: This is a rather hacky solution to hide the selected region
        selection.current.style.left = "-50px";
        selection.current.style.top = "-50px";
        selection.current.style.width = "0px";
        selection.current.style.height = "0px";
      }
    }
  };

  return (
    <div className="imageWrapper">
      <div
        ref={imageContainer}
        onPointerDown={onSelectionPointerDown}
        className="imageContainer"
      >
        <div className="image">
          {
            <div className="selection" ref={selection}>
              <div
                onClick={onHandleClearSelectionClick}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="selection-close"
              >
                <ri.RiCloseFill />
              </div>
            </div>
          }
          {imageAnchors}
          <img src={currentNode.content} alt={currentNode.title} />
        </div>
      </div>
    </div>
  );
};
