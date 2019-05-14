import puppeteer, { LaunchOptions, Browser, Page, EvaluateFn } from 'puppeteer'
import EventEmitter from 'events'

export type NextFunc = () => string[]

export interface CrawlerOptions {
  parallel?: number
  pageEvaluate: EvaluateFn
  next: NextFunc
  [x: string]: any
}

interface PageInfo {
  url: string
  result: any
}
interface CrawlPage {
  [id: number]: PageInfo
}

const noop = () => {}

export default class Crawler extends EventEmitter {
  private urls: string[] = []
  private crawledUrlSet: Set<string> = new Set()
  private parallel: number = 5
  private browser?: Browser
  private pageEvaluate: EvaluateFn
  private next: NextFunc
  private pageId: number = 0
  private pages: CrawlPage = {}

  constructor(options: CrawlerOptions) {
    super()
    const { parallel = 5, pageEvaluate = noop, next } = options
    this.parallel = parallel
    this.pageEvaluate = pageEvaluate
    this.next = next
    new Proxy(this.pages, {
      set: (target: CrawlPage, name: number, value: PageInfo) => {
        target[name] = value
        if (this.urls.length) {
          const url = this.urls.shift() as string
          this.crawlPage(url)
        } else {
          const ids = Object.keys(this.pages).map(id => +id)
          const result = ids.map((pageId: number) => {
            return this.pages[pageId]
          })
          this.emit('end', result)
        }
        return true
      }
    })
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
    const pageId = this.pageId++
    const page: Page = await this.browser.newPage()
    this.crawledUrlSet.add(url)
    await page.goto(url)
    const res = await page.evaluate(this.pageEvaluate)
    await page.close()
    this.pages[pageId] = {
      url,
      result: res
    }
  }

  public launch = async (options: LaunchOptions): Promise<Browser> => {
    try {
      this.browser = await puppeteer.launch(options)
      return this.browser
    } catch (error) {
      throw error
    }
  }

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

  public crawl = async (): Promise<any> => {
    try {
      const urls = this.urls.splice(0, this.parallel)
      urls.map(this.crawlPage)
    } catch (error) {
      throw error
    }
  }

  public close = async () => {
    if (this.browser) {
      this.browser.close()
    }
  }
}
