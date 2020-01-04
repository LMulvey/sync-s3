const path = require("path");
const fs = require("fs-extra");
const AWS = require("aws-sdk");
require("dotenv").config();

const LAST_UPDATE_FILE_NAME = ".s3backup";
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

module.exports.isCurrDirS3Backup = async () => {
  try {
    const filePath = path.resolve(LAST_UPDATE_FILE_NAME);
    const fileExists = await fs.exists(filePath);
    return fileExists;
  } catch (e) {
    console.log(`Err: ${e.message}`);
    return null;
  }
};

module.exports.getLastUpdateDate = async dir => {
  try {
    const filePath = path.resolve(dir, LAST_UPDATE_FILE_NAME);
    const lastUpdateBuffer = await fs.readFile(filePath);
    const lastUpdateDate = new Date(lastUpdateBuffer.toString());
    return lastUpdateDate;
  } catch (e) {
    return null;
  }
};

module.exports.getFilesToSync = async (dir, forceMode = false) => {
  try {
    const lastUpdateFilePath = path.resolve(dir, LAST_UPDATE_FILE_NAME);
    const lastUpdate = await this.getLastUpdateDate(dir);
    const files = walkSync(dir);
    const filesToSync = files.filter(({ filePath: file }) => {
      const fileUpdated = this.getFileCreatedDate(file);
      const isNotUpdateFile = file !== lastUpdateFilePath;
      const isNotExe = !file.endsWith(".exe");
      const shouldUpdate = forceMode || new Date(fileUpdated) > lastUpdate;
      return isNotUpdateFile && isNotExe && shouldUpdate;
    });
    return filesToSync;
  } catch (e) {
    console.log(`Err: ${e.message}. Stack: ${e.stack}`);
    return null;
  }
};

function walkSync(directory, currFiles = []) {
    const files = fs.readdirSync(directory);
    files.forEach((file) => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      if(stat.isFile()) {
        const fileContents = fs.readFileSync(filePath);
        currFiles.push({ filePath, fileContents });
      }

      if (stat.isDirectory()) {
        walkSync(filePath, currFiles);
      }
    })
    
    return currFiles;
 }

module.exports.syncFiles = async (dir, files) => {
  try {
    const filePromises = files.map(async ({filePath: file, fileContents}) => {
      const relativeFilePath = file.split(dir).pop();
      const rawDirName = dir.split(path.sep).pop()
      const s3FilePath = `${rawDirName}${relativeFilePath}`
      console.log(`Syncing file at ${s3FilePath}`);
      const base64data = new Buffer(fileContents, "binary");
      return s3
        .putObject({
          Bucket: process.env.BUCKET_NAME,
          Key: s3FilePath,
          Body: base64data
        })
        .promise();
    });

    await Promise.all(filePromises);

    console.log("Files synced to S3!");
    return true;
  } catch (e) {
    console.log(`Err: ${e.message}. Stack: ${e.stack}`);
    return false;
  }
};

module.exports.writeUpdate = async dir => {
  try {
    const filePath = path.resolve(dir, LAST_UPDATE_FILE_NAME);
    await fs.outputFile(filePath, new Date().toISOString());
    return true;
  } catch (e) {
    console.log(`Err: ${e.message}`);
    return false;
  }
};

module.exports.getFileCreatedDate = file => {
  const { birthtime } = fs.statSync(file);
  return birthtime;
};
