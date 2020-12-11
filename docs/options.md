# Options

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-google-docs",
            options: {
                // https://drive.google.com/drive/folders/FOLDER_ID
                folder: "FOLDER_ID",
                //---
                // All the following options are OPTIONAL
                //---
                //
                // To fetch only documents to specific folders
                // folders Ids can be found in Google Drive URLs
                //
                // h1 -> h2, h2 -> h3, ...
                demoteHeadings: true,
                //
                // To add default metadata
                defaults: {template: "page"},
                //
                // You could need to fetch additional documents fields to your nodes
                //
                // Max nested folder depth
                depth: undefined, // ex: 3
                //
                // All available options: https://developers.google.com/drive/api/v3/reference/files#resource
                fields: ["ownedByMe", "shared"],
                //
                // To ignore some folder in the tree
                // It can be folder names or IDs
                ignoredFolders: ["my-custom-drafts-folder"],
                //
                // To skip types
                skipCodes: false,
                skipFootnotes: false,
                skipHeadings: false,
                skipImages: false,
                skipLists: false,
                skipQuotes: false,
                skipTables: false,
                //
                // To reduce images size
                imagesMaxWidth: 512,
                imagesMaxHeight: 512,
                imagesCrop: false,
                //
                // For a better stack trace and more information
                // Usefull when you open a issue to report a bug
                debug: true,
            },
        },
    ],
}
```
