/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { TriggerPayload } from '../../../controllers/chat/model'
import * as fs from 'fs-extra'
import * as vscode from 'vscode'
import * as path from 'path'
let fileIndex: Record<string, vscode.Uri> = {}

export async function setProjectIndex() {
    fileIndex = {}
    const folders = vscode.workspace.workspaceFolders
    if (folders) {
        folders.forEach(async folder => {
            await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*')).then(files => {
                files.forEach(file => {
                    fileIndex[path.basename(file.path)] = file
                })
            })
        })
    }
}

export function realFileContext(triggerPayload: TriggerPayload) {
    const query = triggerPayload.message
    if (query) {
        const b = query.split(/\s+/)
        for (const c of b) {
            if (c in fileIndex) {
                try {
                    return fs.readFileSync(fileIndex[c].path).toString().substring(0, 10240)
                } catch (err) {}
            }
        }
    }
    return triggerPayload.fileText
}
