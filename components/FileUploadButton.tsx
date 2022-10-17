import { Button } from "@nextui-org/react";
import { useRef, useState } from "react";
import { GameObject } from "../lib/game/Resolvers";

const FileUploadButton: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [_, setUploadedFile] = useState<File>()
  const [uploadedGameSettings, setUploadedGameSettings] = useState<GameObject>()
  return (
    <label>
      <input type="file" multiple style={{ display: "none" }} ref={inputRef} accept=".json" onChange={(e) => {
        let jsonData: GameObject
        let files = Array.from(e.target.files ?? [])

        if (files.length > 0) {
          let file = files[0]
          setUploadedFile(file);
          onUpload(file)
          let reader = new FileReader();
          reader.readAsText(file, "UTF-8");
          reader.onload = (evt) => {
            try {
              if (evt.target) {
                jsonData = JSON.parse(evt.target.result as string)
                setUploadedGameSettings(jsonData)
                //Store the settings in local
                localStorage.setItem("gameSettings", JSON.stringify(jsonData))

                console.log(jsonData)
              }
            }
            catch (e) {
              console.error(e)
            }

          }
          reader.onerror = (evt) => {
            console.log(evt)
          }
        }
      }} />

      <i className="fa fa-cloud-upload">
        <Button
          shadow
          css={{ flex: 1 }}
          bordered
          color="gradient"
          onClick={() => {
            inputRef.current?.click()
          }
            // createLobby(
            //   lobby_name.value,
            //   lobby_password.value,
            //   nickname.value
            // )
          }
        >
          {uploadedGameSettings ? 'game "' + uploadedGameSettings.name + '" selected' : "Upload Game rules"}
        </Button>
      </i>
    </label>
  )


}