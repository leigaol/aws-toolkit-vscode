/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'

export async function removeOverlappingRightContext(editor: vscode.TextEditor, suggestion: string) {
    const pos = editor.selection.active
    let rightContextRange: vscode.Range | undefined = undefined
    if (suggestion.split(/\r?\n/).length > 1) {
        rightContextRange = new vscode.Range(
            pos,
            editor.document.positionAt(editor.document.offsetAt(pos) + suggestion.length)
        )
    } else {
        rightContextRange = new vscode.Range(pos, editor.document.lineAt(pos).range.end)
    }
    const rightContextAfterInsertion = editor.document.getText(rightContextRange)
    const overlap = getPrefixSuffixOverlap(suggestion, rightContextAfterInsertion)
    await editor.edit(
        editBuilder => {
            const range = new vscode.Range(
                pos,
                editor.document.positionAt(editor.document.offsetAt(pos) + overlap.length)
            )
            editBuilder.delete(range)
        },
        { undoStopAfter: false, undoStopBefore: false }
    )
}

/**
 * Returns the longest overlap between the Suffix of firstString and Prefix of second string
 * getPrefixSuffixOverlap("adwg31", "31ggrs") = "31"
 */
export function getPrefixSuffixOverlap(firstString: string, secondString: string) {
    let i = 0
    let j = 0
    while (i < firstString.length && j < secondString.length) {
        if (firstString[i] !== secondString[j]) {
            j = 0
        } else {
            j++
        }
        i++
    }
    return secondString.substring(0, j)
}
