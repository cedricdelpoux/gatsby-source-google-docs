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
                folders: ["FOLDER_ID_1", "FOLDER_ID_2"]
                // You could need to fetch additional documents fields to your nodes
                // All available options: https://developers.google.com/drive/api/v3/reference/files#resource
                fields: ["ownedByMe", "shared"],
                // To rename fields
                // Be carrefull, some documentation instructions could be different
                fieldsMapper: {createdTime: "date", name: "title"},
                // To add default fields values
                fieldsDefault: {draft: false},
                // For a better stack trace and more information
                // Usefull when you open a issue to report a bug
                debug: true,
            }
        }
    ]
}
```
