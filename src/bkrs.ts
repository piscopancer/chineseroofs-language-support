import { load as parse } from 'cheerio'
import * as vscode from 'vscode'

type Translation = {
  ch: string
  py: string
  ru: string
}

export function url(ch: string) {
  return `https://bkrs.info/slovo.php?ch=${ch}`
}

export function mkrsUrl(ch: string) {
  return `https://mkrs-beta.vercel.app/search/${ch}`
}

export function translationToDecoration(tr: Translation, selectionRange: vscode.Range): vscode.DecorationOptions {
  const message = new vscode.MarkdownString(`[${tr.ch}](${mkrsUrl(tr.ch)}) ${tr.py}\n\n<em>${tr.ru}</em>`)
  message.supportHtml = true
  return {
    hoverMessage: message,
    range: selectionRange,
  }
}

export function parseTranslation(html: string): Translation | undefined {
  const dom = parse(html)
  if (!dom('#ch').length) return
  return {
    ch: dom('#ch').text().trim() || '-',
    py: dom('.py').text().trim() || '-',
    ru: dom('.ru').html()?.trim() || '-',
  }
}

export function parseTranslations(html: string): Translation[] | undefined {
  const dom = parse(html)
  if (!dom('.tbl_bywords').length) return

  return dom('.tbl_bywords')
    .map((i, table) => {
      const words: Translation[] = []
      for (let i = 0; i < 4; i++) {
        const pyElement = parse(table)(`tr:nth-child(2) td:nth-child(${i + 1}) > :nth-child(1)`)
        const py = pyElement.text().trim()
        pyElement.remove()
        words.push({
          ch: parse(table)(`tr:nth-child(1) td:nth-child(${i + 1})`)
            .text()
            .trim(),
          py,
          ru:
            parse(table)(`tr:nth-child(2) td:nth-child(${i + 1})`)
              .html()
              ?.trim() ?? '',
        })
      }
      return words.filter((w) => w.ch && w.py).flat(1)
    })
    .toArray()
}
