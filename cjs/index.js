/*! (c) 2018 Andrea Giammarchi - ISC */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);

module.exports = {
  toSubsetRanges(options = {
    // a folder to parse
    folder: '',
    // with languages to include (default: all)
    include: [],
    // or languages to exclude / ignore (default: none)
    exclude: [],
    // how text / sentences should be retrieved
    // (by default the message field of the lang object)
    getText: info => info.message
  }) {
    return new Promise((res, rej) => {
      const all = new Set();
      readdir(options.folder)
        .then(langs => {
          const ops = [];
          if (options.ignore)
            options.exclude = options.ignore;
          if (options.exclude)
            langs = langs.filter(lang => !options.exclude.includes(lang));
          if (options.exclude)
            langs = langs.filter(lang => options.exclude.includes(lang));
          for (const lang of langs)
            ops.push(
              readdir(path.join(options.folder, lang))
                .then(jsons => {
                  for (const json of jsons.filter(json => /[^./]\.json$/.test(json)))
                    parseLanguage(
                      require(path.join(options.folder, lang, json)),
                      all,
                      options.getText || (info => info.message)
                    );
                })
                .catch(rej)
            );
          return Promise.all(ops)
                        .then(() => res(this.toUnicodeRanges(all)));
        })
        .catch(rej);
    });
  },

  toUnicodeRanges(chars) {
    return toRanges(
      typeof chars === 'string' ?
        toUnicode(chars) :
        (Array.isArray(chars) ?
          [...new Set(chars)] :
          [...chars]
        ).map(toCodePoint)
    )
    .map(range => `U+${range.map(asHex).join('-')}`)
    .join(',');
  }
};

function asHex(str) {
  return str.toString(16).toUpperCase().padStart(4, '0');
}

function parseLanguage(lang, all, getText) {
  for (const key of Object.keys(lang))
    for (const chr of [...getText(lang[key])])
      if (chr)
        all.add(chr);
}

function toCodePoint(str) {
  const {length} = str;
  let c = 0;
  let p = 0;
  let i = 0;
  while (i < length) {
    c = str.charCodeAt(i++);
    if (0 < p)
      return 0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00);
    else if (0xD7FF < c && c < 0xDC00)
      p = c;
    else
      return c;
  }
}

function toRanges(points) {
  const all = points.sort((a, b) => a - b);
  const length = all.length;
  const ranges = [];
  let i = 0;
  while (i < length) {
    const now = all[i++];
    let prev = now;
    while (i < length && all[i] === prev + 1)
      prev = all[i++];
    if (prev === now)
      ranges.push([now]);
    else
      ranges.push([now, prev]);
  }
  return ranges;
}

function toUnicode(str) {
  return [...new Set([...str])].map(toCodePoint);
}
