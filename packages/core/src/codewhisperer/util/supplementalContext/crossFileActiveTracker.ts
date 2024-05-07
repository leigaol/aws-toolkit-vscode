/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'

export class CrossFileActiveTracker {
    static #instance: CrossFileActiveTracker

    private documentVisitTime: Map<string, number>

    private readonly maxDocuments = 500

    constructor() {
        this.documentVisitTime = new Map<string, number>()
    }

    public static get instance() {
        return (this.#instance ??= new CrossFileActiveTracker())
    }

    /** Keeps track of when the document is last visited
     * In the rare event when user somehow opened over 500 files
     * in one IDE session, clear the tracking
     *
     */
    public onDucmentChange(editor: vscode.TextEditor | undefined) {
        if (this.documentVisitTime.size >= this.maxDocuments) {
            this.documentVisitTime.clear()
        }
        if (editor) {
            this.documentVisitTime.set(editor.document.fileName, performance.now())
        }
    }
    /** Track the open time of first document when opening a new project
     *
     */
    public onActivationFinish() {
        const filename = vscode.window.activeTextEditor?.document.fileName
        if (filename) {
            this.documentVisitTime.set(filename, performance.now())
        }
    }

    /** Returns the sort key of a file in cross file context
     *  Most recent visited file has highest priority
     */
    public getCrossFileSortKey(filename: string): number {
        const key = this.documentVisitTime.get(filename)
        return key === undefined ? 0 : key
    }
}
