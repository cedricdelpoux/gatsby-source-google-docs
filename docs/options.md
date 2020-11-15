# Options

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-google-docs",
            options: {
                //---
                // All the following options are OPTIONAL
                //---
                //
                // To fetch only documents to specific folders
                // folders Ids can be found in Google Drive URLs
                // https://drive.google.com/drive/folders/FOLDER_ID
                folders: ["FOLDER_ID_1", "FOLDER_ID_2"],
                //
                // h1 -> h2, h2 -> h3, ...
                demoteHeadings: true,
                //
                // You could need to fetch additional documents fields to your nodes
                // All available options: https://developers.google.com/drive/api/v3/reference/files#resource
                fields: ["ownedByMe", "shared"],
                //
                // To rename fields
                // Be careful, some documentation instructions could be different
                fieldsMapper: {createdTime: "date", name: "title"},
                //
                // To add default fields values
                fieldsDefault: {draft: false},
                //
                // To ignore some folder in the tree
                // It can be folder names or IDs
                ignoredFolders: ["my-custom-drafts-folder"],
                //
                // Compute extra data for each document
                updateMetadata: (metadata) => {
                  const isPost = metadata.breadcrumb && metadata.breadcrumb[1] === "posts"
                  const category = isPost ? metadata.breadcrumb[2] : null
                  const path = metadata.path.replace(`/${category}`, "")
                  return {...metadata, path, category}
                },
                //
                // For a better stack trace and more information
                // Usefull when you open a issue to report a bug
                debug: true,
            }
        }
    ]
}
```
