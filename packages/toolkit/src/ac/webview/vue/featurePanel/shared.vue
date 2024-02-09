<script lang="ts">
import { FeatureStatus } from '../authForms/shared.vue'
import CodeWhispererContent, { CodeWhispererContentState } from './codeWhispererContent.vue'
import { DefinedComponent } from '../../../../webviews/types'
import { ServiceItemId } from '../types'

/** Maps a service item id to its respective component */
const serviceItemsContent: Readonly<Record<ServiceItemId, DefinedComponent>> = {
    codewhisperer: CodeWhispererContent,
}

/**
 * Maps a service item id to the content window state.
 *
 * This knows about the overall connection status for
 * the current service.
 */
export const serviceItemsAuthStatus: Readonly<Record<ServiceItemId, FeatureStatus>> = {
    codewhisperer: new CodeWhispererContentState(),
} as const

export default serviceItemsContent
</script>
