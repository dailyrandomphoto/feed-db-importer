#!/usr/bin/env node

'use strict';

const {resolve, extname} = require('path');
const fs = require('fs-extra');
const readYamlFile = require('node-read-yaml');
const {readOpmlFile} = require('./read-opml.js');
const TEMP_PATH = resolve(process.cwd(), './dist/feed-db.json');
const DEST_PATH = resolve(process.cwd(), './feed-db.json');
const urlAlias = url => {
  const regex = /https?:\/\/|www\.|\?.+|#.+|index\.html|\/$/g;
  url = url.replace(regex, '');
  // Replace one more time
  url = url.replace(regex, '');
  return url;
};

function main(filepath) {
  if (!filepath) {
    return Promise.reject(new TypeError('filepath is Required.'));
  }

  return Promise.all([readFeedDB(), readFile(filepath)])
    .then(results => {
      return results[0].concat(results[1]);
    })
    .then(feeds => feeds.filter(feed => feed && typeof feed.url === 'string' && typeof feed.feedUrl === 'string'))
    .then(feeds => feeds.map(feed => {
      if (!feed.alias) {
        return {alias: urlAlias(feed.url), ...feed};
      }

      return feed;
    }))
    // Make unique, merge feeds.
    .then(feeds => {
      return Object.values(feeds.reduce((map, feed) => {
        const key = feed.alias;
        const feed2 = map[key];
        if (feed2) {
          if (feed2.url !== feed.url) {
            if (isHttps(feed2.url) && !isHttps(feed.url)) {
              // do nothing
            } else {
              feed2.url = feed.url;
            }
          }

          if (feed2.feedUrl !== feed.feedUrl) {
            if (isHttps(feed2.feedUrl) && !isHttps(feed.feedUrl)) {
              // do nothing
            } else {
              feed2.feedUrl = feed.feedUrl;
            }
          }

          if (feed.title) {
            feed2.title = feed.title;
          }
        } else {
          map[key] = feed;
        }

        return map;
      }, {}));
    })
    .then(feeds => feeds.sort(compareFeed))
    .then(feeds => fs.outputJson(TEMP_PATH, feeds, {spaces: 2}))
    .then(() => fs.move(TEMP_PATH, DEST_PATH, {overwrite: true}))
    .then(() => fs.remove(TEMP_PATH))
    .then(() => console.log(`Save DB to '${DEST_PATH}'.`));
}

function readFeedDB() {
  if (fs.existsSync(DEST_PATH)) {
    return fs.readJson(DEST_PATH);
  }

  return Promise.resolve([]);
}

function readFile(filepath) {
  const ext = extname(filepath);
  if (ext === '.yml' || ext === '.yaml') {
    return readYamlFile(filepath);
  }

  if (ext === '.opml') {
    return readOpmlFile(filepath);
  }

  return fs.readJson(filepath);
}

function isHttps(url) {
  return url.indexOf('https://') === 0;
}

function compareFeed(a, b) {
  a = a.alias;
  b = b.alias;

  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  // Names must be equal
  return 0;
}

function exit(err) {
  if (err) {
    console.error('\n' + err);

    process.exit(1);
  }

  process.exit();
}

if (require.main === module) { // Called directly
  const filename = process.argv.slice(2, 3)[0];
  if (!filename) {
    exit('Usage: feed-db-importer FILENAME');
  }

  const filepath = resolve(process.cwd(), filename);

  console.log('file name: ' + filename);
  console.log('full path: ' + filepath);

  main(filepath)
    .catch(exit);
} else { // Required as a module
  module.exports = main;
}
