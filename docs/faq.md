# FAQ

## How can I get a breadcrumb?

Organize your documents in Google Drive with folders:

```
/
  ↳ Category 1
    ↳ Drafts
        ↳ Draft Post 1
    ↳ Post 1
  ↳ Category 2
    ↳ Post 2
```

Then you can query the breadcrumb:

```
{
  allGoogleDocs {
    nodes {
      document {
        breadcrumb
      }
    }
  }
}

```

> `breadcrumb` field wield be deleted if you don't have subtrees

## How can I manage drafts?

Put your drafts documents into a `Drafts` folder and update the query before create your pages:

```
{
    allGoogleDocs(filter: {document: {breadcrumb: {nin: "Drafts"}}}) {
    nodes {
      document {
        path
      }
    }
  }
}
```

> You will not be able to query `breadcrumb` if all your documents are in the same folder

## How can I add extra data to my documents?

Fill the description field of your document in Google Drive with a JSON object:

```json
{
    "author": "Yourself",
    "category": "yourCageory",
    "tags": ["tag1", "tag2"],
    "draft": true
}
```

## How can I set a custom path for one of my document?

Fill the description field of your document in Google Drive with a JSON object containing a `path` key:

```json
{
    "path": "custom-path",
    "createdTime": "2019-01-01"
}
```

## How can I set a fixed date for one of my document?

Fill the description field of your document in Google Drive with a JSON object containing files

```json
{
    "path": "custom-path",
    "createdTime": "2019-01-01"
}
```

## How to use `gatsby-source-google-docs` without `remark` ecosystem?

Update your config to prevent the plugin to replace the google images urls:

```js
module.exports = {
    plugins: [
        {
            resolve: "gatsby-source-google-docs",
            options: {
                replaceGoogleImages: false,
            },
        },
    ],
}
```

You can query the JSON and Markdown used to generate the html and do your custom processing:

```graphql
query {
    allGoogleDocs {
        nodes {
            document {
                name
                markdown
                content {
                    p
                    ul
                    img {
                        source
                        title
                        description
                    }
                }
            }
        }
    }
}
```
