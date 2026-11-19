import { useState } from 'react';
import { handled, track, useCommits } from '../harness';

/**
 * Tabs with React-rendered panels, the same tab state driving three more kern elements (the shape of the
 * `state_unsafe_mutation` crash of #29), a bar without panels and router-style links.
 */
export function Nav() {
	const [tab, setTab] = useState('a');
	const [badge, setBadge] = useState(2);
	const [route, setRoute] = useState('/polishes');
	const [extra, setExtra] = useState(false);
	useCommits('nav');

	const onTab = (e: CustomEvent<string>): void => {
		handled('tabs', e.type, e.detail);
		setTab(e.detail);
	};

	return (
		<div>
			<k-tabs
				id="tabs"
				ref={track('tabs')}
				label="Collection"
				tabs={[
					{ id: 'a', label: 'Polishes' },
					{ id: 'b', label: 'Brands', badge, badgeLabel: `${badge} new` },
					{ id: 'c', label: 'Archive', disabled: true }
				]}
				value={tab}
				onchange={onTab}
			>
				<div id="panel-a" data-tab="a">
					Panel A{' '}
					<button id="panel-a-button" type="button" onClick={() => setBadge((n) => n + 1)}>
						More
					</button>
				</div>
				<div id="panel-b" data-tab="b">
					Panel B with {badge} new
				</div>
				{extra && (
					<div id="panel-x" data-tab="x">
						Panel X
					</div>
				)}
			</k-tabs>

			{/* The state of the tabs feeds a second tab bar, a segmented control and a radio group: handlers write into other kern elements. */}
			<k-tabs
				id="appnav"
				label="App"
				look="pill"
				tabs={[
					{ id: 'a', label: 'Home' },
					{ id: 'b', label: 'More', dot: true, badgeLabel: 'Sync error', badgeTone: 'danger' }
				]}
				value={tab}
				onchange={onTab}
			/>
			<k-segmented-control
				id="mirror"
				label="Mirror"
				options={[
					{ value: 'a', label: 'A' },
					{ value: 'b', label: 'B' }
				]}
				value={tab}
				onchange={(e) => {
					handled('mirror', e.type, e.detail);
					setTab(e.detail);
				}}
			/>
			<k-radio-group
				id="radios"
				label="Radios"
				options={[
					{ value: 'a', label: 'Radio A' },
					{ value: 'b', label: 'Radio B' }
				]}
				value={tab}
				onchange={(e) => {
					handled('radios', e.type, e.detail);
					setTab(e.detail);
				}}
			/>

			<k-tab-links
				id="links"
				label="Sections"
				links={[
					{ href: '/polishes', label: 'Polishes', current: route === '/polishes' },
					{ href: '/brands', label: 'Brands', current: route === '/brands' }
				]}
				onnavigate={(e) => {
					e.preventDefault();
					handled('links', e.type, e.detail.href);
					setRoute(e.detail.href);
				}}
			/>

			<button id="tab-b-from-react" type="button" onClick={() => setTab('b')}>
				Tab B from React
			</button>
			<button id="route-from-react" type="button" onClick={() => setRoute('/brands')}>
				Route from React
			</button>
			<button id="add-panel" type="button" onClick={() => setExtra(true)}>
				Add panel
			</button>
			<output id="nav-state">{JSON.stringify({ tab, route, badge })}</output>
		</div>
	);
}
