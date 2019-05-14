/// <reference types="node" />
import puppeteer, { EvaluateFn } from 'puppeteer'
import EventEmitter from 'events'
export declare type NextFunc = () => string[]
export interface CrawlerOptions {
  parallel?: number
  pageEvaluate: EvaluateFn
  next: NextFunc
  [x: string]: any
}
export default class Crawler extends EventEmitter {
  private urls
  private crawledUrlSet
  private parallel
  private browser?
  private pageEvaluate
  private next
  private pageId
  private pages
  constructor(options: CrawlerOptions)
  private checkUrl
  private crawlPage
  launch: (options: puppeteer.LaunchOptions) => Promise<puppeteer.Browser>
  queue: (urls: string | string[]) => void
  crawl: () => Promise<any>
  close: () => Promise<void>
}
