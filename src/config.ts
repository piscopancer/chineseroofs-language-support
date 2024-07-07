import * as vscode from 'vscode'

type Config = {
  autoShowTranslations: boolean
  autoShowTranslationsDelay: number
}

export const config = {
  get: <K extends keyof Config>(key: K): Config[K] => {
    return vscode.workspace.getConfiguration('chineseRoofsLanguageSupport').get(key)!
  },
}
