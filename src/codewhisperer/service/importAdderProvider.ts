/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { Recommendation } from '../client/codewhisperer'

/**
 * ImportProvider
 */
export class ImportAdderProvider implements vscode.CodeLensProvider {
    public codeLenses: vscode.CodeLens[] = []

    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>()
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event
    private readonly supportedLanguages: string[] = ['java', 'javascript', 'jsx', 'python']

    constructor() {}

    static #instance: ImportAdderProvider

    public static get instance() {
        return (this.#instance ??= new this())
    }

    private async insertImportStatement(
        editor: vscode.TextEditor,
        importStatement: string,
        firstLineOfRecommendation: number
    ) {
        let line = ImportAdderProvider.findLineOfLastImportStatement(editor, firstLineOfRecommendation)
        if (line === -1) {
            line = ImportAdderProvider.findLineOfFirstCode(editor, firstLineOfRecommendation)
        }
        await editor.edit(
            builder => {
                builder.insert(new vscode.Position(line, 0), importStatement + '\n')
            },
            { undoStopAfter: true, undoStopBefore: true }
        )
    }
    public static findLineOfFirstCode(editor: vscode.TextEditor, firstLineOfRecommendation: number): number {
        const lang = editor.document.languageId
        for (let i = 0; i < firstLineOfRecommendation; i++) {
            const text = editor.document.lineAt(i).text
            if (lang == 'python') {
                if (!text.match(/^\s*#/) && !text.match(/^\s*$/)) {
                    return i
                }
            } else if (lang == 'javascript' || lang == 'jsx') {
                if (!text.match(/^\s*\/\//) && !text.match(/=\s*use\s*strict/) && !text.match(/^\s*$/)) {
                    return i
                }
            } else if (lang == 'java') {
                if (!text.match(/^\s*\/\//) && !text.match(/^\s*package\s+\S+/) && !text.match(/^\s*$/)) {
                    return i
                }
            }
        }
        return 0
    }

    public static findLineOfLastImportStatement(editor: vscode.TextEditor, firstLineOfRecommendation: number): number {
        const lang = editor.document.languageId
        for (let i = firstLineOfRecommendation; i >= 0; i--) {
            const text = editor.document.lineAt(i).text
            if (lang == 'python') {
                if (text.match(/^\s*import\s+\S+/) || text.match(/^\s*from\s+\S+/)) {
                    return i + 1
                }
            } else if (lang == 'javascript' || lang == 'jsx') {
                if (text.match(/^\s*import\s+\S+/) || text.match(/=\s*require\s*\(\s*\S+\s*\)\s*;/)) {
                    return i + 1
                }
            } else if (lang == 'java') {
                if (text.match(/^\s*import\s+\S+\s*;/)) {
                    return i + 1
                }
            }
        }
        return -1
    }

    public async onAcceptRecommendation(
        editor: vscode.TextEditor,
        r: Recommendation,
        firstLineOfRecommendation: number
    ) {
        this.clear()
        if (!this.supportedLanguages.includes(editor.document.languageId)) {
            return
        }
        const text = editor.document.getText()
        if ('imports' in r) {
            r.imports?.forEach(async i => {
                const stmt = i.importStatement
                if (stmt && !text.includes(stmt)) {
                    await this.insertImportStatement(editor, stmt, firstLineOfRecommendation)
                }
            })
        } else {
            const i = 'import pandas as pd'
            if (i && !text.includes(i)) {
                await this.insertImportStatement(editor, i, firstLineOfRecommendation)
            }
        }
    }

    public onShowRecommendation(document: vscode.TextDocument, line: number, r: Recommendation) {
        if (!this.supportedLanguages.includes(document.languageId)) {
            return
        }
        this.codeLenses = []
        // show it under the inline toolbar if current line is not the last line
        line = document.lineCount > line + 1 ? line + 1 : line
        if ('imports' in r) {
            r.imports?.forEach(i => {
                const codeLens = new vscode.CodeLens(new vscode.Range(line, 0, line, 1))
                codeLens.command = {
                    title: `Also add ${i.importStatement}`,
                    tooltip: 'Import statement',
                    command: '',
                }
                this.codeLenses.push(codeLens)
            })
        } else {
            if (Math.random() > 0.00005) {
                const codeLens = new vscode.CodeLens(new vscode.Range(line, 0, line, 1))
                codeLens.command = {
                    title: `Also add \'import pandas as pd\'`,
                    tooltip: 'Import statement',
                    command: '',
                }
                this.codeLenses.push(codeLens)
            }
        }
        this._onDidChangeCodeLenses.fire()
    }

    public clear() {
        this.codeLenses = []
        this._onDidChangeCodeLenses.fire()
    }

    public provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        return this.codeLenses
    }
}
