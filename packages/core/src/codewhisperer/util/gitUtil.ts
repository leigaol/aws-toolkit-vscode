/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { fs, getLogger, removeAnsi } from '../../shared'
import { ChildProcess, ChildProcessOptions } from '../../shared/utilities/processUtils'
import { Uri } from 'vscode'
import fg from 'fast-glob'
import ignore from 'ignore'

import * as path from 'path'

export async function isGitRepo(folder: Uri): Promise<boolean> {
    const childProcess = new ChildProcess('git', ['rev-parse', '--is-inside-work-tree'])

    let output = ''
    const runOptions: ChildProcessOptions = {
        rejectOnError: true,
        rejectOnErrorCode: true,
        onStdout: (text) => {
            output += text
            getLogger().verbose(removeAnsi(text))
        },
        onStderr: (text) => {
            getLogger().error(removeAnsi(text))
        },
        spawnOptions: {
            cwd: folder.fsPath,
        },
    }

    try {
        await childProcess.run(runOptions)
        return output.trim() === 'true'
    } catch (err) {
        getLogger().warn(`Failed to run command \`${childProcess.toString()}\`: ${err}`)
        return false
    }
}

const defaultIgnores = [
    '.aws-sam',
    '.git',
    '.svn',
    '.hg',
    '.rvm',
    '.gem',
    '.project',
    '.venv',
    '.idea',
    '.vscode',
    '.vs',
    '.DS_Store',
    'node_modules',
    '.eggs',
    'sdist',
    'go.work',
    'bower_components',
    '.cache',
    '.sass-cache',
    '.pytest_cache',
    '__pycache__',
    '.ipynb_checkpoints',
    'env',
]

/**
  Lists files and folders in a directory while respecting .gitignore.
  @param dir The root directory.
  @returns A promise that resolves to an array of filtered paths.
 */
export async function listFilesWithGitignore(
    dir: string
): Promise<{ isFolder: boolean; filepath: string; filename: string }[]> {
    let ig = ignore()
    for (const ignoreDir of defaultIgnores) {
        ig = ig.add(ignoreDir)
    }
    // Use fast-glob to get all files and directories
    const allFiles = await fg(['**'], {
        cwd: dir, // Set the working directory
        dot: true, // Include dotfiles
        onlyFiles: false, // Include both files and directories
        followSymbolicLinks: false,
        stats: true,
    })
    for (const file of allFiles) {
        if (file.name === '.gitignore') {
            const gitignoreContent = await fs.readFileText(path.join(dir, file.path))
            ig = ig.add(gitignoreContent)
        }
    }
    // Filter out ignored files
    const filteredEntries = allFiles.filter((file) => !ig.ignores(file.path))
    return filteredEntries.map((it) => ({
        isFolder: it.stats?.isDirectory() || false,
        filepath: it.path,
        filename: path.basename(it.path),
    }))
}
