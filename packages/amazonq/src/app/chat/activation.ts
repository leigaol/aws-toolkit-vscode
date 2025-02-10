/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'
import { ExtensionContext, window } from 'vscode'
import { telemetry } from 'aws-core-vscode/telemetry'
import { AuthUtil, CodeWhispererSettings, listFilesWithGitignore } from 'aws-core-vscode/codewhisperer'
import { Commands, placeholder, funcUtil, sleep } from 'aws-core-vscode/shared'
import * as amazonq from 'aws-core-vscode/amazonq'
import { scanChatAppInit } from '../amazonqScan'
import { init as inlineChatInit } from '../../inlineChat/app'

export async function activate(context: ExtensionContext) {
    const appInitContext = amazonq.DefaultAmazonQAppInitContext.instance

    registerApps(appInitContext, context)

    const provider = new amazonq.AmazonQChatViewProvider(
        context,
        appInitContext.getWebViewToAppsMessagePublishers(),
        appInitContext.getAppsToWebViewMessageListener(),
        appInitContext.onDidChangeAmazonQVisibility
    )

    await amazonq.TryChatCodeLensProvider.register(appInitContext.onDidChangeAmazonQVisibility.event)

    const setupLsp = funcUtil.debounce(async () => {
        void amazonq.LspController.instance.trySetupLsp(context, {
            startUrl: AuthUtil.instance.startUrl,
            maxIndexSize: CodeWhispererSettings.instance.getMaxIndexSize(),
            isVectorIndexEnabled: CodeWhispererSettings.instance.isLocalIndexEnabled(),
        })
    }, 5000)

    context.subscriptions.push(
        window.registerWebviewViewProvider(amazonq.AmazonQChatViewProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true,
            },
        }),
        amazonq.focusAmazonQChatWalkthrough.register(),
        amazonq.walkthroughInlineSuggestionsExample.register(),
        amazonq.walkthroughSecurityScanExample.register(),
        amazonq.openAmazonQWalkthrough.register(),
        amazonq.listCodeWhispererCommandsWalkthrough.register(),
        amazonq.focusAmazonQPanel.register(),
        amazonq.focusAmazonQPanelKeybinding.register(),
        amazonq.tryChatCodeLensCommand.register(),
        vscode.workspace.onDidChangeConfiguration(async (configurationChangeEvent) => {
            if (configurationChangeEvent.affectsConfiguration('amazonQ.workspaceIndex')) {
                if (CodeWhispererSettings.instance.isLocalIndexEnabled()) {
                    void setupLsp()
                }
            }
        })
    )

    Commands.register('aws.amazonq.learnMore', () => {
        void vscode.env.openExternal(vscode.Uri.parse(amazonq.amazonQHelpUrl))
    })

    void setupLsp()
    void setupAuthNotification()
    await initFiles()

    sleep(15000).then(void provider.refresh())
}

async function initFiles() {
    const workspaceFolders = vscode.workspace.workspaceFolders || []
    const folderCmd = {
        command: 'folder',
        children: [
            {
                groupName: 'Folders',
                commands: [
                    {
                        command: 'src',
                        description: './src/',
                    },
                ],
                icon: 'folder',
            },
        ],
        description: 'All files within a specific folder',
    }
    const filesCmd = {
        command: 'file',
        children: [
            {
                groupName: 'Files',
                commands: [
                    {
                        command: 'src',
                        description: './src/',
                    },
                ],
                icon: 'file',
            },
        ],
        description: 'File',
    }
    for (const folder of workspaceFolders) {
        const fileFolders = await listFilesWithGitignore(folder.uri.fsPath)
        for (const f of fileFolders) {
            if (f.isFolder) {
                folderCmd.children[0].commands.push({
                    command: f.filename,
                    description: f.filepath,
                })
            } else {
                filesCmd.children[0].commands.push({
                    command: f.filename,
                    description: f.filepath,
                })
            }
        }
    }
    amazonq.workspaceCommand.commands.push(filesCmd)
    amazonq.workspaceCommand.commands.push(folderCmd)
}

function registerApps(appInitContext: amazonq.AmazonQAppInitContext, context: ExtensionContext) {
    amazonq.cwChatAppInit(appInitContext)
    amazonq.featureDevChatAppInit(appInitContext)
    amazonq.gumbyChatAppInit(appInitContext)
    amazonq.testChatAppInit(appInitContext)
    scanChatAppInit(appInitContext)
    amazonq.docChatAppInit(appInitContext)
    inlineChatInit(context)
}

/**
 * Display a notification to user for Log In.
 *
 * Authentication Notification is displayed when:
 * - User is not authenticated
 * - Once every session
 *
 */
async function setupAuthNotification() {
    let notificationDisplayed = false // Auth Notification should be displayed only once.
    await tryShowNotification()

    async function tryShowNotification() {
        // Do not show the notification if the IDE starts and user is already authenticated.
        if (AuthUtil.instance.isConnected()) {
            notificationDisplayed = true
        }

        if (notificationDisplayed) {
            return
        }

        const source = 'authNotification'
        const buttonAction = 'Sign In'
        notificationDisplayed = true

        telemetry.toolkit_showNotification.emit({
            component: 'editor',
            id: source,
            reason: 'notLoggedIn',
            result: 'Succeeded',
        })
        const selection = await vscode.window.showWarningMessage('Start using Amazon Q', buttonAction)

        if (selection === buttonAction) {
            void amazonq.focusAmazonQPanel.execute(placeholder, source)
        }
    }
}
