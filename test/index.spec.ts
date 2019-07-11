import Crawler from '../src'

describe('Crawler', () => {
  it('new', async () => {
    const crawler = new Crawler({
      pageEvaluate: () => {
        console.log(location.href)
      }
    })

    expect(crawler).toBeInstanceOf(Crawler)
  })
})

describe('launch and close', () => {
  it('launch and close', async () => {
    const crawler = new Crawler({
      pageEvaluate: () => {
        console.log(location.href)
      }
    })
    await crawler.launch()
    expect(crawler.browser).toBeDefined()
    await crawler.close()
  })
})

describe('queue', () => {
  it('queue url', () => {
    const crawler = new Crawler({
      pageEvaluate: () => {
        console.log(location.href)
      }
    })
    crawler.queue('https://baidu.com')
    expect(crawler.urls.length).toBe(1)
    expect(crawler.urls[0]).toBe('https://baidu.com')
  })

  it('queue invalid url', () => {
    const crawler = new Crawler({
      pageEvaluate: () => {
        console.log(location.href)
      }
    })
    crawler.queue('baidu.com')
    expect(crawler.urls.length).toBe(0)
  })
})
