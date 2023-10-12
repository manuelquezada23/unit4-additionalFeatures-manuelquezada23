import { Editor } from "@tiptap/react";
import "./TextMenu.scss";

interface IEditorProps {
  editor: Editor | null;
}

export const TextMenu = (props: IEditorProps) => {
  const { editor } = props;
  if (!editor) {
    return null;
  }

  // TODO: Add a menu of buttons for your text editor here
  return <div id="textMenu"></div>;
};
