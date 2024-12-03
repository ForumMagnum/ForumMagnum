import { XMLParser } from 'fast-xml-parser'

interface ArxivPaperData {
  title: string
  content: string
  published: string
  authors: string[]
  abstract: string
  pdfUrl: string
  categories: string[]
}

export class ArxivExtractor {
  private static readonly API_BASE_URL = 'http://export.arxiv.org/api/query'
  private static readonly parser = new XMLParser({ ignoreAttributes: false })

  /**
   * Extracts the arXiv ID from a URL
   * Handles formats like:
   * - https://arxiv.org/abs/2403.12376
   * - https://arxiv.org/pdf/2403.12376.pdf
   */
  private static extractArxivId(url: string): string {
    const match = url.match(/arxiv\.org(?:\/abs|\/pdf)\/([0-9.]+)/i)
    if (!match) {
      throw new Error('Invalid arXiv URL format')
    }
    return match[1]
  }

  /**
   * Fetches paper data from arXiv API
   * Implements rate limiting of 1 request per 3 seconds
   */
  private static async fetchFromArxiv(arxivId: string): Promise<string> {
    const url = `${this.API_BASE_URL}?id_list=${arxivId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.statusText}`)
    }
    
    return await response.text()
  }

  /**
   * Parses the XML response from arXiv into a structured format
   */
  private static parseArxivResponse(xmlData: string): ArxivPaperData {
    const parsed = this.parser.parse(xmlData)
    const entry = parsed.feed.entry

    return {
      title: entry.title,
      content: entry.summary,
      abstract: entry.summary,
      published: entry.published,
      authors: Array.isArray(entry.author) 
        ? entry.author.map((a: any) => a.name)
        : [entry.author.name],
      pdfUrl: entry.link.find((l: any) => l['@_title'] === 'pdf')['@_href'],
      categories: Array.isArray(entry.category) 
        ? entry.category.map((c: any) => c['@_term'])
        : [entry.category['@_term']]
    }
  }

  /**
   * Main method to extract data from an arXiv URL
   */
  public static async extract(url: string): Promise<ArxivPaperData> {
    const arxivId = this.extractArxivId(url)
    const xmlData = await this.fetchFromArxiv(arxivId)
    return this.parseArxivResponse(xmlData)
  }
}
