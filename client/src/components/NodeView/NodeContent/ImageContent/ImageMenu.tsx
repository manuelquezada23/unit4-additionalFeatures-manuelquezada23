import "./ImageMenu.scss";
import { Button } from "~/components/Button";
import { RxReset } from "react-icons/rx";
import { useEffect, useState } from "react";

import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import {
  currentNodeState,
  currentNodeWidthState,
  currentNodeHeightState,
  refreshState,
  alertOpenState,
  alertTitleState,
  alertMessageState,
} from "~/global/Atoms";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { FrontendNodeGateway } from "~/nodes";
import { INodeProperty, makeINodeProperty } from "~/types";

/** Similar to TextMenu, ImageMenu allows the user to change the width and height of an image using input boxes */
export const ImageMenu = () => {
  const [maxWidth, setMaxWidth] = useState(0);
  const [maxHeight, setMaxHeight] = useState(0);
  const currentNode = useRecoilValue(currentNodeState);
  const [currentHeight, setCurrentHeight] = useRecoilState(
    currentNodeHeightState
  );
  const [currentWidth, setCurrentWidth] = useRecoilState(currentNodeWidthState);
  const [refresh, setRefresh] = useRecoilState(refreshState);

  // alerts
  const setAlertIsOpen = useSetRecoilState(alertOpenState);
  const setAlertTitle = useSetRecoilState(alertTitleState);
  const setAlertMessage = useSetRecoilState(alertMessageState);

  useEffect(() => {
    // if there is no modifiedHeight and modifiedWidth
    if (
      currentNode.modifiedHeight === undefined &&
      currentNode.modifiedWidth === undefined
    ) {
      // set it to its initial height and width
      setCurrentHeight(currentNode.initialHeight! | 0); // turn into integer
      setCurrentWidth(currentNode.initialWidth! | 0); // turn into integer
    } else {
      setCurrentHeight(currentNode.modifiedHeight! | 0); // turn into integer
      setCurrentWidth(currentNode.modifiedWidth! | 0); // turn into integer
    }

    setMaxWidth(currentNode.initialWidth! | 0);
    setMaxHeight(currentNode.initialHeight! | 0);
  }, [currentNode]);

  const handleWidthChange = (_: string, newWidth: number) => {
    setCurrentWidth(newWidth);
  };

  const handleHeightChange = (_: string, newHeight: number) => {
    setCurrentHeight(newHeight);
  };

  const handleResetCrop = async () => {
    const nodePropertyWidth: INodeProperty = makeINodeProperty(
      "modifiedWidth",
      maxWidth
    );
    const nodePropertyHeight: INodeProperty = makeINodeProperty(
      "modifiedHeight",
      maxHeight
    );
    const updateResp = await FrontendNodeGateway.updateNode(
      currentNode.nodeId,
      [nodePropertyWidth, nodePropertyHeight]
    );
    if (!updateResp.success) {
      setAlertTitle("Error updating node");
      setAlertMessage(updateResp.message);
      setAlertIsOpen(true);
      return;
    }
    setCurrentHeight(maxHeight);
    setCurrentWidth(maxWidth);
    setRefresh(!refresh);
  };

  const format = (val: number) => val + `px`;

  return (
    <div id="imageMenu">
      <Button
        text="Reset Crop"
        icon={<RxReset />}
        style={{ height: "2.5rem" }}
        onClick={handleResetCrop}
      />
      {currentWidth && (
        <NumberInput
          step={5}
          value={format(currentWidth)}
          onChange={handleWidthChange}
          min={10}
          max={maxWidth}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      )}
      {currentHeight && (
        <NumberInput
          step={5}
          value={format(currentHeight)}
          onChange={handleHeightChange}
          min={10}
          max={maxHeight}
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      )}
    </div>
  );
};
