import puppeteer, { EvaluateFn } from 'puppeteer'
export declare type NextFunc = () => string[]
export interface CrawlerOptions {
  parallel?: number
  pageEvaluate: EvaluateFn
  next: NextFunc
  [x: string]: any
}
export default class Crawler {
  private queue
  private parallel
  private browser?
  private pageEvaluate
  private next
  constructor(options: CrawlerOptions)
  launch: (options: puppeteer.LaunchOptions) => Promise<puppeteer.Browser>
  crawl: (url: string) => Promise<any>
  close: () => Promise<void>
}
