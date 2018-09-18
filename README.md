# local-range

```js
const localRange = require('./local-range');

localRange
  .toSubsetRanges({
    // a folder to parse (i.e. ~/project/locale)
    folder: '',
    // with languages (folders) to include (default: all)
    include: [],
    // or languages (folders) to exclude / ignore (default: none)
    exclude: [],
    // how text / sentences should be retrieved
    // (by default the message field of the lang object)
    getText: info => info.message
  })
  .then(console.log)
  .catch(console.error);
```