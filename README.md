# sync-s3 📝

This is a miniature CLI for syncing a folder with S3. This could probably be expanded into a proper CLI/Bash script eventually. This was created as a client request but may be useful to some.

## To start

```sh
npm start
```

Or, to force an update of a folder:

```sh
npm run force-sync
```

If you want some verbose debug logging:

```sh
npm start -- --debug
npm run force-sync -- --debug
```

## What does it do?

You set up your AWS Credentials and an S3 bucket in a `.env` file. Next, you run `npm start` and pick a directory to sync. The tool will check that directory for a few things:

1. If an `.s3backup` file exists, check the timestamp inside. The timestamp represents the last sync date.
2. Check the entire directory tree for valid files.
3. Check each file to see if it has been create since the last backup timestamp, if there is one.
4. If it has, add it to the stack for syncing.
5. Sync all the required files and upload to the S3 bucket at a _relative filepath_ (i.e, If you synced the `test` directory, the files would upload to `test/**` inside the bucket.)

### Cool Tip

This is super un-intuitive but if you enter the directory that you wish to sync in your Terminal and then run the script directly using Node, i.e, `node ../../sync-s3`, it will check the current directory to see if a `.s3backup` file exists. If it does, it auto picks that directory as the one to sync.

## To-dos / Improvements

- Allow for the syncing to happen based on **last modified** instead of birthtime.
- Improve file selection process.
- Change to a bash/bin script to allow it to be installed globally and used inside of any folder.
- Update to an Electron application/service.
- Allow files to be ignored.
- Allow extensions to be ignored.
- Create a more intuitive user experience.
