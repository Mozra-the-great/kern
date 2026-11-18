// kern custom elements. Load once: <script type="module" src="kern-elements.js">.
// Theme tokens still come from themes.css on the page; they reach into shadow roots.
import KButton from './KButton.svelte';
import KIconButton from './KIconButton.svelte';
import KLink from './KLink.svelte';
import KBadge from './KBadge.svelte';
import KTag from './KTag.svelte';
import KAvatar from './KAvatar.svelte';
import KSpinner from './KSpinner.svelte';
import KProgress from './KProgress.svelte';
import KDivider from './KDivider.svelte';
import KInput from './KInput.svelte';
import KTextarea from './KTextarea.svelte';
import KSelect from './KSelect.svelte';
import KCheckbox from './KCheckbox.svelte';
import KRadioGroup from './KRadioGroup.svelte';
import KSwitch from './KSwitch.svelte';
import KCard from './KCard.svelte';
import KAlert from './KAlert.svelte';
import KToaster from './KToaster.svelte';
import KModal from './KModal.svelte';
import KDrawer from './KDrawer.svelte';
import KTabs from './KTabs.svelte';
import KAccordion from './KAccordion.svelte';
import KAccordionItem from './KAccordionItem.svelte';
import KTooltip from './KTooltip.svelte';
import KDropdownMenu from './KDropdownMenu.svelte';
import KTable from './KTable.svelte';
import KSkeleton from './KSkeleton.svelte';
import KEmptyState from './KEmptyState.svelte';
import KBreadcrumb from './KBreadcrumb.svelte';
import KPagination from './KPagination.svelte';
import KNavbar from './KNavbar.svelte';
import KSlider from './KSlider.svelte';
import KFileDrop from './KFileDrop.svelte';
import KCarousel from './KCarousel.svelte';
import KPopover from './KPopover.svelte';
import KCombobox from './KCombobox.svelte';
import KContextMenu from './KContextMenu.svelte';
import KCommandPalette from './KCommandPalette.svelte';
import KTreeView from './KTreeView.svelte';
import KDatePicker from './KDatePicker.svelte';
import KTypewriter from './KTypewriter.svelte';
import KCaret from './KCaret.svelte';
import KScramble from './KScramble.svelte';
import KCountUp from './KCountUp.svelte';
import KOdometer from './KOdometer.svelte';
import KMarquee from './KMarquee.svelte';
import KReveal from './KReveal.svelte';
import KHighlight from './KHighlight.svelte';
import KGridBackground from './KGridBackground.svelte';
import KTerminal from './KTerminal.svelte';
import KLabel from './KLabel.svelte';
import KNumberInput from './KNumberInput.svelte';
import KPinInput from './KPinInput.svelte';
import KRating from './KRating.svelte';
import KSegmentedControl from './KSegmentedControl.svelte';
import KStepper from './KStepper.svelte';
import KTagInput from './KTagInput.svelte';
import KColorPicker from './KColorPicker.svelte';
import KDataTable from './KDataTable.svelte';
import KStat from './KStat.svelte';
import KSparkline from './KSparkline.svelte';
import KHeatmap from './KHeatmap.svelte';
import KHistoryBar from './KHistoryBar.svelte';
import KTimeline from './KTimeline.svelte';
import { toast, dismissToast } from '../lib/components/toast.svelte.js';

export const elements = {
	KButton, KIconButton, KLink, KBadge, KTag, KAvatar, KSpinner, KProgress, KDivider,
	KInput, KTextarea, KSelect, KCheckbox, KRadioGroup, KSwitch, KCard, KAlert, KToaster,
	KModal, KDrawer, KTabs, KAccordion, KAccordionItem, KTooltip, KDropdownMenu, KTable,
	KSkeleton, KEmptyState, KBreadcrumb, KPagination, KNavbar, KSlider, KFileDrop, KCarousel,
	KPopover, KCombobox, KContextMenu, KCommandPalette, KTreeView, KDatePicker,
	KTypewriter, KCaret, KScramble, KCountUp, KOdometer, KMarquee, KReveal, KHighlight, KGridBackground, KTerminal,
	KLabel, KNumberInput, KPinInput, KRating, KSegmentedControl, KStepper, KTagInput, KColorPicker,
	KDataTable, KStat, KSparkline, KHeatmap, KHistoryBar, KTimeline
};
export { toast, dismissToast };

declare global {
	interface Window { kern?: { toast: typeof toast; dismissToast: typeof dismissToast } }
}
if (typeof window !== 'undefined') window.kern = { toast, dismissToast };
