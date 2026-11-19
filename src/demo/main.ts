import { mount } from 'svelte';
import '../lib/themes/index.css';
import './demo.css';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app is missing in index.html');
mount(App, { target });
