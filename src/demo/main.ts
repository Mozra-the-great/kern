import { mount } from 'svelte';
import '../lib/themes/index.css';
import './demo.css';
import App from './App.svelte';

mount(App, { target: document.getElementById('app')! });
