import '@mozra-the-great/kern/themes.css';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app is missing');
mount(App, { target });
