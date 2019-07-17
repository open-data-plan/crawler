# crawler

> Web crawler based on [`Puppeteer`](https://github.com/GoogleChrome/puppeteer)

## Install

```bash
npm install @opd/crawler
```

## Use

```js
import Crawler from '@opd/crawler'

const crawler = new Crawler(options)
```

## API

### `new Crawler(options)`

create crawler instance

`options`: crawler instance config

- `parallel`: maximum number of crawlers, default is `5`
- `pageEvaluate`: evaluate function on current page, see [`Puppeteer`](https://pptr.dev/#?product=Puppeteer&version=v1.18.1&show=api-pageevaluatepagefunction-args), **cannot support extra args now**

### `crawler.launch([options])`

launch browser use [`puppeteer.launch`](https://pptr.dev/#?product=Puppeteer&version=v1.18.1&show=api-puppeteerlaunchoptions)

### `crawler.queue(urls)`

add urls to crawler queue

> Note: check url **strictly**, means url must start with `https?`

### `crawler.start([urls]): CrawledPage`

start crawl page, if `urls` is presented, will call `crawler.queue` firstly.

```js
const result = await crawler.start()
console.log(result)

// {
//   [pageId]: {
//     url, // page url
//     result // crawled result
//   }
// }
```

> Note: if you call `start` before `launch`, `browser` will also be launched, but with no extra launch options
