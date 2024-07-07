import * as vscode from 'vscode'
import * as bkrs from './bkrs'
import { config } from './config'

let abortController: AbortController | null = null

let decorationTimer: null | NodeJS.Timeout = null

export function activate(context: vscode.ExtensionContext) {
  const decorationType = vscode.window.createTextEditorDecorationType({ textDecoration: 'underline' })

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
        const bkrsHtml = await fetch(bkrs.buildUrl(selectedText), { signal: abortController.signal }).then((res) => res.text())
        const decorations = createDecorations(bkrsHtml, selectionRange)
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

function createDecorations(bkrsHtml: string, selectionRange: vscode.Range): vscode.DecorationOptions[] {
  const decorations: vscode.DecorationOptions[] = []

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

  // const reversoDom = parse(reversoHtml)
  // const reversoRes = reverso.parseReverso(reversoDom)
  // switch (reversoRes.type) {
  //   case 'one': {
  //     decorations.push({
  //       hoverMessage: `${reversoRes.translations.join(', ')}`,
  //       range: selectionRange,
  //     })
  //     break
  //   }
  //   case 'many':
  //     let message = ''
  //     for (const group of reversoRes.groups) {
  //       message += `${group.original} <em>${group.translations.join(', ')}</em>\n\n`
  //     }
  //     decorations.push({
  //       hoverMessage: message,
  //       range: selectionRange,
  //     })
  //     break
  // }

  return decorations
}
