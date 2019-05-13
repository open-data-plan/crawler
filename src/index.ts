import puppeteer, { LaunchOptions, Browser, Page, EvaluateFn } from 'puppeteer'

export type NextFunc = () => string[]

export interface CrawlerOptions {
  parallel?: number
  pageEvaluate: EvaluateFn
  next: NextFunc
  [x: string]: any
}

export default class Crawler {
  private queue: string[] = []
  private parallel: number = 5
  private browser?: Browser
  private pageEvaluate: EvaluateFn
  private next: NextFunc

  constructor(options: CrawlerOptions) {
    const { parallel = 5, pageEvaluate, next } = options
    this.queue = []
    this.parallel = parallel
    this.pageEvaluate = pageEvaluate
    this.next = next
  }

  public launch = async (options: LaunchOptions): Promise<Browser> => {
    try {
      this.browser = await puppeteer.launch(options)
      return this.browser
    } catch (error) {
      throw error
    }
  }

  public crawl = async (url: string): Promise<any> => {
    if (!this.browser) return
    try {
      const page: Page = await this.browser.newPage()
      await page.goto(url)
      const res = await page.evaluate(this.pageEvaluate)
      return res
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
