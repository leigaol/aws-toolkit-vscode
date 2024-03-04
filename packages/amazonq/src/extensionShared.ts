/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { Connection } from 'aws-core-vscode'
import { AuthUtil } from 'aws-core-vscode'

export async function activateShared() {
    void vscode.window
        .showInformationMessage(
            'Amazon Q + CodeWhisperer: This extension is under development and offers no features at this time.',
            'Continue'
        )
        .then(async () => {
            const mathExt = vscode.extensions.getExtension('amazonwebservices.aws-toolkit-vscode')
            const importedApi = mathExt?.exports
            const co: Connection[] = await importedApi.listConnections()
            await AuthUtil.instance.secondaryAuth.useNewConnection(co[0])
            console.log(await AuthUtil.instance.getBearerToken())
        })
}
