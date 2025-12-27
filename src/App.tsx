import "./App.css";
import { EditorProvider } from "@react-email-builder/react";
import { NavBar } from "./NavBar";
import Render from "./render";

function App() {
  return (
    <EditorProvider>
      <div className="flex flex-col h-screen">
        <NavBar />
        <div className="flex-1 overflow-auto bg-gray-100 p-5">
          <Render />
        </div>
      </div>
    </EditorProvider>
  );
}

export default App;
