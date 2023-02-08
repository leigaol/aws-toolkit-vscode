/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { Recommendation } from '../client/codewhisperer'

/**
 * ImportProvider
 */
export class ImportProvider implements vscode.CodeLensProvider {
    public codeLenses: vscode.CodeLens[] = []

    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>()
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event

    constructor() {}

    static #instance: ImportProvider

    public static get instance() {
        return (this.#instance ??= new this())
    }

    private async insertImportStatement(editor: vscode.TextEditor, i: string) {
        await editor.edit(
            builder => {
                builder.insert(new vscode.Position(0, 0), i)
            },
            { undoStopAfter: true, undoStopBefore: true }
        )
    }

    public async onAcceptRecommendation(editor: vscode.TextEditor, r: Recommendation) {
        this.clear()
        const text = editor.document.getText()
        if ('imports' in r) {
            r.imports?.forEach(async i => {
                const s = i.importStatement
                if (s && !text.includes(s)) {
                    await this.insertImportStatement(editor, s)
                }
            })
        } else {
            const i = 'import pandas as pd'
            if (i && !text.includes(i)) {
                await this.insertImportStatement(editor, i)
            }
        }
    }

    public onShowRecommendation(line: number, r: Recommendation) {
        this.codeLenses = []
        if ('imports' in r) {
            r.imports?.forEach(i => {
                const codeLens = new vscode.CodeLens(new vscode.Range(line, 0, line, 1))
                codeLens.command = {
                    title: `Also add ${i.importStatement}`,
                    tooltip: 'Reference code',
                    command: 'aws.codeWhisperer.openReferencePanel',
                }
                this.codeLenses.push(codeLens)
            })
        } else {
            if (Math.random() > 0.5) {
                const codeLens = new vscode.CodeLens(new vscode.Range(line, 0, line, 1))
                codeLens.command = {
                    title: `Also add \'import pandas as pd\'`,
                    tooltip: 'Reference code',
                    command: 'aws.codeWhisperer.openReferencePanel',
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
