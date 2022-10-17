import React from "react";
import styles from "../styles/FilePreview.module.scss";

const FilePreview: React.FC<{ fileList: File[] }> = ({ fileList }) => {
  return (
    <div className={styles.fileList}>
      <div className={styles.fileContainer}>
        {/* loop over the fileData */}
        {fileList.map((f) => {
          return (
            <>
              <ol>
                <li key={f.lastModified} className={styles.fileList}>
                  {/* display the filename and type */}
                  <div key={f.name} className={styles.fileName}>
                    {f.name}
                  </div>
                </li>
              </ol>
            </>
          );
        })}
      </div>
    </div>
  );
};

export default FilePreview;