import * as vscode from 'vscode'
import * as bkrs from './bkrs'
import { config } from './config'
import * as linguee from './linguee'

let abortController: AbortController | null = null

let decorationTimer: null | NodeJS.Timeout = null

export function activate(context: vscode.ExtensionContext) {
  const decorationType = vscode.window.createTextEditorDecorationType({
    color: 'white',
  })

  vscode.window.onDidChangeTextEditorSelection(async (e) => {
    e.textEditor.setDecorations(decorationType, [])
    const selectionRange = new vscode.Range(e.selections[0].start, e.selections[0].end)
    const selectedText = e.textEditor.document.getText(selectionRange)
    if (selectedText) {
      if (/^\P{Script=Han}/u.test(selectedText)) {
        return
      }
      if (abortController) {
        abortController.abort('fetch aborted')
      }
      abortController = new AbortController()
      if (decorationTimer) {
        clearTimeout(decorationTimer)
      }
      try {
        const [bkrsHtml, lingueeHtml] = await Promise.all([
          //
          fetch(bkrs.url(selectedText), { signal: abortController.signal }).then((res) => res.text()),
          fetch(linguee.url(selectedText), { signal: abortController.signal }).then((res) => res.text()),
        ])
        const decorations = createDecorations(selectedText, bkrsHtml, lingueeHtml, selectionRange)
        e.textEditor.setDecorations(decorationType, decorations)
        if (config.get('autoShowTranslations')) {
          decorationTimer = setTimeout(() => {
            vscode.commands.executeCommand('editor.action.showDefinitionPreviewHover')
          }, config.get('autoShowTranslationsDelay'))
        }
      } catch (error) {
        if ((error as Error).name === 'FetchError') {
          vscode.window.showErrorMessage((error as Error).message)
        }
      }
    }
  })
}

export function deactivate() {}

function createDecorations(selectedText: string, bkrsHtml: string, lingueeHtml: string, selectionRange: vscode.Range): vscode.DecorationOptions[] {
  const decorations: vscode.DecorationOptions[] = []

  decorations.push({ hoverMessage: new vscode.MarkdownString(`[$(globe) ${selectedText}](${bkrs.mkrsUrl(selectedText)})`, true), range: selectionRange } satisfies vscode.DecorationOptions)

  const bkrsTranslation = bkrs.parseTranslation(bkrsHtml)
  if (bkrsTranslation) {
    decorations.push(bkrs.translationToDecoration(bkrsTranslation, selectionRange))
  }
  const bkrsTranslations = bkrs.parseTranslations(bkrsHtml)
  if (bkrsTranslations) {
    for (const tr of bkrsTranslations) {
      decorations.push(bkrs.translationToDecoration(tr, selectionRange))
    }
  }

  decorations.push({ hoverMessage: new vscode.MarkdownString(`[$(globe) ${selectedText}](${linguee.url(selectedText)})`, true), range: selectionRange } satisfies vscode.DecorationOptions)

  const lingueeExact = linguee.parseExact(lingueeHtml)
  if (lingueeExact) {
    decorations.push(linguee.exactToDec(lingueeExact, selectionRange))
  }

  const lingueeInexact = linguee.parseInexact(lingueeHtml)
  if (lingueeInexact) {
    decorations.push(linguee.inexactToDec(lingueeInexact, selectionRange))
  }

  return decorations
}
