import puppeteer, { LaunchOptions, Browser, EvaluateFn } from 'puppeteer'

export type NextFunc = () => string[]

export interface CrawlerOptions {
  parallel?: number
  pageEvaluate: EvaluateFn
  next?: NextFunc
  [x: string]: any
}

export interface PageInfo {
  url: string
  result: any
}
export interface CrawledPage {
  [id: number]: PageInfo
}

const noop = () => {}

export default class Crawler {
  private crawledUrlSet: Set<string> = new Set()
  private parallel: number = 5
  private pageEvaluate: EvaluateFn
  private next: NextFunc
  private pageId: number = 0
  private pages: CrawledPage = {}
  private pendingQueue: string[] = []
  public urls: string[] = []
  public browser?: Browser

  constructor(options: CrawlerOptions) {
    const { parallel = 5, pageEvaluate = noop, next = () => [] } = options
    this.parallel = parallel
    this.pageEvaluate = pageEvaluate
    this.next = next
  }

  private checkUrl = (url: string) => {
    if (
      typeof url !== 'string' ||
      !/^https?:\/\//.test(url) ||
      this.crawledUrlSet.has(url)
    ) {
      return false
    }
    return true
  }

  private crawlPage = async (url: string) => {
    if (!this.browser) {
      throw new TypeError('You should launch browser firstly')
    }
    try {
      const pageId = this.pageId++
      const page = await this.browser.newPage()
      this.crawledUrlSet.add(url)
      await page.goto(url)
      const result = await page.evaluate(this.pageEvaluate)
      await page.close()
      this.pages[pageId] = {
        url,
        result
      }
      // TODO: add next func support
      // find current url in pending queue
      const currentIndex = this.pendingQueue.findIndex(
        queuedUrl => url === queuedUrl
      )
      // remove it from pending queue
      this.pendingQueue.splice(currentIndex, 1)
      if (this.urls.length) {
        await this.urls
          .splice(0, this.parallel - this.pendingQueue.length)
          .filter(Boolean)
          .map(this.crawlPage)
      }
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * launch puppeteer
   * @param options LaunchOptions puppeteer launch options
   */
  public launch = async (options?: LaunchOptions): Promise<Browser> => {
    try {
      this.browser = await puppeteer.launch(options)
      return this.browser
    } catch (error) {
      throw error
    }
  }

  /**
   * push url(s) into crawl pool
   * @param urls string | string[]
   */
  public queue = (urls: string | string[]) => {
    if (typeof urls === 'string') {
      urls = [urls]
    }
    if (Array.isArray(urls)) {
      this.urls = this.urls.concat(urls.filter(this.checkUrl))
      const invalidUrls = urls.filter(url => !this.checkUrl(url))
      if (invalidUrls.length) {
        console.log('follow url(s) will be ignored:\n')
        invalidUrls.map(url => {
          console.log(url)
        })
      }
    } else {
      throw new TypeError(
        'Invalid url(s) present, only support string or string[]'
      )
    }
  }

  /**
   * crawl queued urls
   */
  public start = async (urls?: string[] | string): Promise<any> => {
    try {
      if (!this.browser) {
        await this.launch()
      }
      if (urls) {
        this.queue(urls)
      }
      this.pendingQueue = this.urls.splice(0, this.parallel).filter(Boolean)
      await Promise.all(this.pendingQueue.map(this.crawlPage))
      return this.pages
    } catch (error) {
      throw error
    }
  }

  /**
   * close crawler browser
   */
  public close = async () => {
    if (this.browser) {
      await this.browser.close()
    }
  }
}
