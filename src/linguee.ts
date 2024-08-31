import { JSDOM } from 'jsdom'
import * as vscode from 'vscode'

export function exactToDec(trs: ExactTranslation[], selectionRange: vscode.Range): vscode.DecorationOptions {
  const message = new vscode.MarkdownString(trs.map((tr) => `[${tr.text}](${tr.url})`).join(', '))
  message.supportHtml = true
  return {
    hoverMessage: message,
    range: selectionRange,
  }
}

export function inexactToDec(trs: InexactTranslation[], selectionRange: vscode.Range): vscode.DecorationOptions {
  const message = new vscode.MarkdownString(trs.map((tr) => `[${tr.member.text}](${tr.member.url}) — ${tr.trs.map((tr) => `[${tr.text}](${tr.url})`).join(', ')}`).join('\n\n'), true)
  message.supportHtml = true
  return {
    hoverMessage: message,
    range: selectionRange,
  }
}

export function url(search: string) {
  return `https://www.linguee.com/english-chinese/search?source=auto&query=${search}` as const
}

type ExactTranslation = {
  text: string
  url: string
}

export function parseExact(html: string): ExactTranslation[] | null {
  const dom = new JSDOM(html).window.document.body
  const exact = dom.querySelector('.exact')
  if (!exact) return null
  return Array.from(exact.querySelectorAll('[id^=dictEntry]')).map((el) => {
    return {
      text: el.textContent ?? '',
      url: 'https://www.linguee.com' + el.getAttribute('href')!,
    }
  })
}

type InexactTranslation = {
  member: ExactTranslation
  trs: ExactTranslation[]
}

export function parseInexact(html: string): InexactTranslation[] | null {
  const dom = new JSDOM(html).window.document.body
  const lines = Array.from(dom.querySelectorAll('[class="inexact"] > .lemma.singleline'))
  if (!lines) return null
  const trs: InexactTranslation[] = lines.map((line) => {
    const dictLink = line.querySelector('.dictLink')
    const dictEntries = Array.from(line.querySelectorAll('[id^=dictEntry]'))
    return {
      member: {
        text: dictLink?.textContent ?? '',
        url: 'https://www.linguee.com' + dictLink?.getAttribute('href')!,
      },
      trs: dictEntries.map(
        (entry) =>
          ({
            text: entry.textContent ?? '',
            url: 'https://www.linguee.com' + entry.getAttribute('href')!,
          } satisfies ExactTranslation)
      ),
    }
  })
  return trs
}
