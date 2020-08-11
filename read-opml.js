'use strict';

const fs = require('fs-extra');
const OpmlParser = require('opmlparser');

function getFeedList(xml) {
  return new Promise(((resolve, reject) => {
    const opmlparser = new OpmlParser();
    const list = [];
    opmlparser.on('error', reject);
    opmlparser.once('readable', function () {
      console.log('This OPML is entitled: "%s"', this.meta.title);
    });
    opmlparser.on('readable', function () {
      let outline;

      while ((outline = this.read())) {
        let url = outline.htmlurl;
        if (url) {
          try {
            url = new URL(url).href;
          } catch (_) {
            // Skip if it's a invalid url
            continue;
          }

          list.push({
            url,
            feedUrl: outline.xmlurl,
            title: outline.title || outline.text,
            type: outline.type
          });
        }
      }
    });
    opmlparser.on('end', () => {
      console.log('Read OPML done.');
      resolve(list);
    });

    opmlparser.end(xml);
  }));
}

function readOpmlFile(opmlfile) {
  return fs.readFile(opmlfile)
    .then(getFeedList);
}

module.exports = {getFeedList, readOpmlFile};
