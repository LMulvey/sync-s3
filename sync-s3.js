const path = require("path");
const inquirer = require("inquirer");
const { syncFiles, getFilesToSync, writeUpdate, isCurrDirS3Backup } = require("./lib/fileHelpers");

inquirer.registerPrompt("directory", require("inquirer-directory"));

function parseArgs() {
  const [, , ...args] = process.argv;
  const settings = { forceMode: false };

  if (args.includes("-f") || args.includes("--force")) {
    settings.forceMode = true;
    console.log(`FORCE FLAG DETECTED. Forcing a sync regardless of last update.`)
  }

  if (args.includes("-d") || args.includes("--debug")) {
    settings.debugMode = true;
    console.log(`!! DEBUG MODE !!`)
  }

  return settings;
}

async function main() {
  const settings = parseArgs();
  // assume we want to use the current directory;
  const isS3Dir = await isCurrDirS3Backup();
  if (isS3Dir) {
    const directory = path.resolve();
    console.log(`Using previously synced directory, ${directory}!`);
    await performSync(directory, settings);
    console.log("Sync complete!");
  } else {
    inquirer
      .prompt([
        {
          type: "directory",
          name: "directory",
          message: "Where you like to put this component?",
          basePath: path.resolve()
        }
      ])
      .then(async ({ directory }) => {
        const dirPath = path.resolve(directory);
        await performSync(dirPath, settings);
      });
  }
}

async function performSync(dir, { forceMode, debugMode }) {
  const filesToSync = await getFilesToSync(dir, forceMode);
  const filesWritten = await syncFiles(dir, filesToSync);
  // Only write update on successful S3 upload
  if (filesWritten) {
    const updateWritten = await writeUpdate(dir);
    const filePathsToSync = filesToSync.map(({ filePath }) => filePath);
    if (debugMode) console.log('DEBUG MODE: Sync Summary:', { filePathsToSync, filesWritten, updateWritten, forceMode });
    console.log("Sync complete!");
  } else {
    console.log("Sync failed!");
  }
}

main();
