/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExtensionContext } from 'vscode'
import { awsToolkitActivate, awsToolkitDeactivate, Auth } from 'aws-core-vscode'
import { Connection } from '../../core/dist/src/auth/connection'

export async function activate(context: ExtensionContext) {
    await awsToolkitActivate(context)
    return {
        async listConnections(): Promise<Connection[]> {
            return Auth.instance.listConnections()
        },
    }
}

export async function deactivate() {
    await awsToolkitDeactivate()
}
