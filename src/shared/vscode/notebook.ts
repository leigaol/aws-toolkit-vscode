/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode'

declare module 'vscode' {
    export namespace window {
        /**
         * The currently visible {@link NotebookEditor notebook editors} or an empty array.
         */
        export const visibleNotebookEditors: readonly NotebookEditor[]

        /**
         * An {@link Event} which fires when the {@link window.visibleNotebookEditors visible notebook editors}
         * has changed.
         */
        export const onDidChangeVisibleNotebookEditors: Event<readonly NotebookEditor[]>

        /**
         * The currently active {@link NotebookEditor notebook editor} or `undefined`. The active editor is the one
         * that currently has focus or, when none has focus, the one that has changed
         * input most recently.
         */
        export const activeNotebookEditor: NotebookEditor | undefined
    }

    /**
     * Represents a notebook editor that is attached to a {@link NotebookDocument notebook}.
     */
    export enum NotebookEditorRevealType {
        /**
         * The range will be revealed with as little scrolling as possible.
         */
        Default = 0,

        /**
         * The range will always be revealed in the center of the viewport.
         */
        InCenter = 1,

        /**
         * If the range is outside the viewport, it will be revealed in the center of the viewport.
         * Otherwise, it will be revealed with as little scrolling as possible.
         */
        InCenterIfOutsideViewport = 2,

        /**
         * The range will always be revealed at the top of the viewport.
         */
        AtTop = 3,
    }

    /**
     * Represents a notebook editor that is attached to a {@link NotebookDocument notebook}.
     * Additional properties of the NotebookEditor are available in the proposed
     * API, which will be finalized later.
     */
    export interface NotebookEditor {
        /**
         * The {@link NotebookDocument notebook document} associated with this notebook editor.
         */
        readonly notebook: NotebookDocument

        /**
         * The primary selection in this notebook editor.
         */
        selection: NotebookRange

        /**
         * All selections in this notebook editor.
         *
         * The primary selection (or focused range) is `selections[0]`. When the document has no cells, the primary selection is empty `{ start: 0, end: 0 }`;
         */
        selections: readonly NotebookRange[]

        /**
         * The current visible ranges in the editor (vertically).
         */
        readonly visibleRanges: readonly NotebookRange[]

        /**
         * The column in which this editor shows.
         */
        readonly viewColumn?: ViewColumn

        /**
         * Scroll as indicated by `revealType` in order to reveal the given range.
         *
         * @param range A range.
         * @param revealType The scrolling strategy for revealing `range`.
         */
        revealRange(range: NotebookRange, revealType?: NotebookEditorRevealType): void
    }

    /**
     * Renderer messaging is used to communicate with a single renderer. It's returned from {@link notebooks.createRendererMessaging}.
     */
    export interface NotebookRendererMessaging {
        /**
         * An event that fires when a message is received from a renderer.
         */
        readonly onDidReceiveMessage: Event<{
            readonly editor: NotebookEditor
            readonly message: any
        }>

        /**
         * Send a message to one or all renderer.
         *
         * @param message Message to send
         * @param editor Editor to target with the message. If not provided, the
         * message is sent to all renderers.
         * @returns a boolean indicating whether the message was successfully
         * delivered to any renderer.
         */
        postMessage(message: any, editor?: NotebookEditor): Thenable<boolean>
    }

    /**
     * A notebook cell kind.
     */
    export enum NotebookCellKind {
        /**
         * A markup-cell is formatted source that is used for display.
         */
        Markup = 1,

        /**
         * A code-cell is source that can be {@link NotebookController executed} and that
         * produces {@link NotebookCellOutput output}.
         */
        Code = 2,
    }

    /**
     * One representation of a {@link NotebookCellOutput notebook output}, defined by MIME type and data.
     */
    export class NotebookCellOutputItem {
        /**
         * Factory function to create a `NotebookCellOutputItem` from a string.
         *
         * *Note* that an UTF-8 encoder is used to create bytes for the string.
         *
         * @param value A string.
         * @param mime Optional MIME type, defaults to `text/plain`.
         * @returns A new output item object.
         */
        static text(value: string, mime?: string): NotebookCellOutputItem

        /**
         * Factory function to create a `NotebookCellOutputItem` from
         * a JSON object.
         *
         * *Note* that this function is not expecting "stringified JSON" but
         * an object that can be stringified. This function will throw an error
         * when the passed value cannot be JSON-stringified.
         *
         * @param value A JSON-stringifyable value.
         * @param mime Optional MIME type, defaults to `application/json`
         * @returns A new output item object.
         */
        static json(value: any, mime?: string): NotebookCellOutputItem

        /**
         * Factory function to create a `NotebookCellOutputItem` that uses
         * uses the `application/vnd.code.notebook.stdout` mime type.
         *
         * @param value A string.
         * @returns A new output item object.
         */
        static stdout(value: string): NotebookCellOutputItem

        /**
         * Factory function to create a `NotebookCellOutputItem` that uses
         * uses the `application/vnd.code.notebook.stderr` mime type.
         *
         * @param value A string.
         * @returns A new output item object.
         */
        static stderr(value: string): NotebookCellOutputItem

        /**
         * Factory function to create a `NotebookCellOutputItem` that uses
         * uses the `application/vnd.code.notebook.error` mime type.
         *
         * @param value An error object.
         * @returns A new output item object.
         */
        static error(value: Error): NotebookCellOutputItem

        /**
         * The mime type which determines how the {@linkcode NotebookCellOutputItem.data data}-property
         * is interpreted.
         *
         * Notebooks have built-in support for certain mime-types, extensions can add support for new
         * types and override existing types.
         */
        mime: string

        /**
         * The data of this output item. Must always be an array of unsigned 8-bit integers.
         */
        data: Uint8Array

        /**
         * Create a new notebook cell output item.
         *
         * @param data The value of the output item.
         * @param mime The mime type of the output item.
         */
        constructor(data: Uint8Array, mime: string)
    }

    /**
     * Notebook cell output represents a result of executing a cell. It is a container type for multiple
     * {@link NotebookCellOutputItem output items} where contained items represent the same result but
     * use different MIME types.
     */
    export class NotebookCellOutput {
        /**
         * The output items of this output. Each item must represent the same result. _Note_ that repeated
         * MIME types per output is invalid and that the editor will just pick one of them.
         *
         * ```ts
         * new vscode.NotebookCellOutput([
         * 	vscode.NotebookCellOutputItem.text('Hello', 'text/plain'),
         * 	vscode.NotebookCellOutputItem.text('<i>Hello</i>', 'text/html'),
         * 	vscode.NotebookCellOutputItem.text('_Hello_', 'text/markdown'),
         * 	vscode.NotebookCellOutputItem.text('Hey', 'text/plain'), // INVALID: repeated type, editor will pick just one
         * ])
         * ```
         */
        items: NotebookCellOutputItem[]

        /**
         * Arbitrary metadata for this cell output. Can be anything but must be JSON-stringifyable.
         */
        metadata?: { [key: string]: any }

        /**
         * Create new notebook output.
         *
         * @param items Notebook output items.
         * @param metadata Optional metadata.
         */
        constructor(items: NotebookCellOutputItem[], metadata?: { [key: string]: any })
    }

    /**
     * Represents a cell of a {@link NotebookDocument notebook}, either a {@link NotebookCellKind.Code code}-cell
     * or {@link NotebookCellKind.Markup markup}-cell.
     *
     * NotebookCell instances are immutable and are kept in sync for as long as they are part of their notebook.
     */
    export interface NotebookCell {
        /**
         * The index of this cell in its {@link NotebookDocument.cellAt containing notebook}. The
         * index is updated when a cell is moved within its notebook. The index is `-1`
         * when the cell has been removed from its notebook.
         */
        readonly index: number

        /**
         * The {@link NotebookDocument notebook} that contains this cell.
         */
        readonly notebook: NotebookDocument

        /**
         * The kind of this cell.
         */
        readonly kind: NotebookCellKind

        /**
         * The {@link TextDocument text} of this cell, represented as text document.
         */
        readonly document: TextDocument

        /**
         * The metadata of this cell. Can be anything but must be JSON-stringifyable.
         */
        readonly metadata: { [key: string]: any }

        /**
         * The outputs of this cell.
         */
        readonly outputs: readonly NotebookCellOutput[]

        /**
         * The most recent {@link NotebookCellExecutionSummary execution summary} for this cell.
         */
        readonly executionSummary: NotebookCellExecutionSummary | undefined
    }

    /**
     * Represents a notebook which itself is a sequence of {@link NotebookCell code or markup cells}. Notebook documents are
     * created from {@link NotebookData notebook data}.
     */
    export interface NotebookDocument {
        /**
         * The associated uri for this notebook.
         *
         * *Note* that most notebooks use the `file`-scheme, which means they are files on disk. However, **not** all notebooks are
         * saved on disk and therefore the `scheme` must be checked before trying to access the underlying file or siblings on disk.
         *
         * @see {@link FileSystemProvider}
         */
        readonly uri: Uri

        /**
         * The type of notebook.
         */
        readonly notebookType: string

        /**
         * The version number of this notebook (it will strictly increase after each
         * change, including undo/redo).
         */
        readonly version: number

        /**
         * `true` if there are unpersisted changes.
         */
        readonly isDirty: boolean

        /**
         * Is this notebook representing an untitled file which has not been saved yet.
         */
        readonly isUntitled: boolean

        /**
         * `true` if the notebook has been closed. A closed notebook isn't synchronized anymore
         * and won't be re-used when the same resource is opened again.
         */
        readonly isClosed: boolean

        /**
         * Arbitrary metadata for this notebook. Can be anything but must be JSON-stringifyable.
         */
        readonly metadata: { [key: string]: any }

        /**
         * The number of cells in the notebook.
         */
        readonly cellCount: number

        /**
         * Return the cell at the specified index. The index will be adjusted to the notebook.
         *
         * @param index - The index of the cell to retrieve.
         * @return A {@link NotebookCell cell}.
         */
        cellAt(index: number): NotebookCell

        /**
         * Get the cells of this notebook. A subset can be retrieved by providing
         * a range. The range will be adjusted to the notebook.
         *
         * @param range A notebook range.
         * @returns The cells contained by the range or all cells.
         */
        getCells(range?: NotebookRange): NotebookCell[]

        /**
         * Save the document. The saving will be handled by the corresponding {@link NotebookSerializer serializer}.
         *
         * @return A promise that will resolve to true when the document
         * has been saved. Will return false if the file was not dirty or when save failed.
         */
        save(): Thenable<boolean>
    }

    /**
     * The summary of a notebook cell execution.
     */
    export interface NotebookCellExecutionSummary {
        /**
         * The order in which the execution happened.
         */
        readonly executionOrder?: number

        /**
         * If the execution finished successfully.
         */
        readonly success?: boolean

        /**
         * The times at which execution started and ended, as unix timestamps
         */
        readonly timing?: { readonly startTime: number; readonly endTime: number }
    }
    /**
     * A notebook range represents an ordered pair of two cell indices.
     * It is guaranteed that start is less than or equal to end.
     */
    export class NotebookRange {
        /**
         * The zero-based start index of this range.
         */
        readonly start: number

        /**
         * The exclusive end index of this range (zero-based).
         */
        readonly end: number

        /**
         * `true` if `start` and `end` are equal.
         */
        readonly isEmpty: boolean

        /**
         * Create a new notebook range. If `start` is not
         * before or equal to `end`, the values will be swapped.
         *
         * @param start start index
         * @param end end index.
         */
        constructor(start: number, end: number)

        /**
         * Derive a new range for this range.
         *
         * @param change An object that describes a change to this range.
         * @return A range that reflects the given change. Will return `this` range if the change
         * is not changing anything.
         */
        with(change: { start?: number; end?: number }): NotebookRange
    }
}
