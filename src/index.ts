import puppeteer, {
  LaunchOptions,
  Browser,
  Page,
  EvaluateFunc,
} from 'puppeteer'

export type NextFunc = (result: PageResult, page: Page) => void

export interface CrawlerOptions {
  parallel?: number
  pageEvaluate?: EvaluateFunc<any>
  next?: NextFunc
  [x: string]: any
}

export interface PageResult {
  url: string
  result: any
}

// eslint-disable-next-line
const noop = () => {}

export default class Crawler {
  private crawledUrlSet: Set<string> = new Set()
  private parallel = 5
  private pageEvaluate: EvaluateFunc<any>
  private next: NextFunc
  private pages: PageResult[] = []
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

  private crawlPage = async (url: string): Promise<void> => {
    /* istanbul ignore if */
    if (!this.browser) {
      throw new TypeError('You should launch browser firstly')
    }
    try {
      const page = await this.browser.newPage()
      this.crawledUrlSet.add(url)
      await page.goto(url)
      const result = await page.evaluate(this.pageEvaluate)
      this.pages.push({
        url,
        result,
      })

      const currentIndex = this.pendingQueue.findIndex(
        (queuedUrl) => url === queuedUrl
      )
      // remove it from pending queue
      this.pendingQueue.splice(currentIndex, 1)
      /* istanbul ignore else */
      if (typeof this.next === 'function') {
        this.next(result as PageResult, page)
      }
      const tasks = [page.close()]
      if (this.urls.length) {
        this.urls
          .splice(0, this.parallel - this.pendingQueue.length)
          .filter(Boolean)
          .forEach((url) => {
            tasks.push(this.crawlPage(url))
          })
      }
      await Promise.all(tasks)
    } catch (error) {}
  }

  /**
   * launch puppeteer
   * @param options LaunchOptions puppeteer launch options
   */
  public launch = async (options?: LaunchOptions): Promise<Browser> => {
    this.browser = await puppeteer.launch({
      headless: 'new',
      ...options,
    })
    return this.browser
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
      const invalidUrls = urls.filter((url) => !this.checkUrl(url))
      if (invalidUrls.length) {
        console.log('follow url(s) will be ignored:\n')
        console.log(invalidUrls.join('\n'))
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
  public start = async (urls?: string[] | string): Promise<PageResult[]> => {
    if (!this.browser) {
      await this.launch()
    }
    if (urls) {
      this.queue(urls)
    }
    this.pendingQueue = this.urls.splice(0, this.parallel).filter(Boolean)
    await Promise.all(this.pendingQueue.map(this.crawlPage))
    return this.pages
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
