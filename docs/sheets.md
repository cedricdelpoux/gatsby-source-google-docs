# Use Google Sheets as part of the client interface

If you are not familiar with [Google Sheets](https://support.google.com/docs/topic/9054603?hl=en&ref_topic=1382883) use their support documentation to learn more.

A number of **Sheets** can be easily used by a client in order to populate the data for a **Gatsby** site using `gatsby-source-google-docs`. Generated **Google Docs** can hold any of the content and *metadata* for the site's generated pages. 
## Getting Started
In a **Google Sheet** data can be organized by key column headings, and rows. The data can be used for each page, and along with any `allGoogleDocs` queries.

|  | A | B | C | D | E |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 1 | **first** | **last** | **user** | **likes** | **active** |
| 2 | John | Doe | jdoe | 23 | true |
| 3 | Mary | Lee | marryL | 48 | true |
| 4 |  Steve | McQueen | sMcQ | 496 | false |
| 5 |  Joan | Fysh | fishj | 2 | true |

If needed, image id's from the URL can also be added here in order to query the blob needed to append images into a Google Doc. In order to have access to a Drive image it needs to be accessible on the web with a *public* setting to the files or folders.

*example:*
```https://drive.google.com/open?id=2heYYtRc45exampleH456i```

Otherwise the client can drop their images into the **header** for the `cover` image, or in the body of the generated **Docs**
## Build Docs
In order to build the **Docs** use the built in [Google Apps Scripts](https://developers.google.com/apps-script) editor found in the menu under ***Tools/<> script editor***.  JavaScript coding can access the data row or contiguous rows and automate the process. Menu items and/or buttons can easily be added to the **Sheets** that will trigger the scripts. **Apps Scripts** has autocompletion to easily access Google's *classes* and *methods* as needed.

The documentation has many examples of code that will show you how to automate everything to access and manipulate the Sheet data, Drive locations, Google Images, and other Sheets, in order to build the **Docs** with needed **images**, body content, and the *description* field's `YAML` **metadata**.  
### Tips
- `template` **Docs** should be used to format your created **Google Docs**. 

- For convenience backup copies can be saved to **Drafts** folders on Google Drive. 

- Body content can be added using the **Scripts** though it's much easier for the client to add this to the generated **Doc**.
