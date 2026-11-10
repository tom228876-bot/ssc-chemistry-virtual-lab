import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const app = $('app');
app.innerHTML = `
<header class="topbar"><div class="brand"><span class="brand-mark">⚗</span><span>SSC Chemistry Lab<small>Interactive 3D Virtual Laboratory · Bangladesh</small></span></div><div class="top-actions"><span class="status-pill">LIVE SIMULATION</span><button class="btn" id="help">কীভাবে ব্যবহার করব?</button></div></header>
<div class="layout"><aside class="panel left"><div class="eyebrow">Practical library</div><h2>পরীক্ষা নির্বাচন</h2><div id="experiments"><button class="experiment active"><span class="exp-icon">⚗️</span><span><span class="exp-name">অ্যাসিড-ক্ষার টাইট্রেশন</span><span class="exp-meta">প্র্যাকটিক্যাল ০১ · চালু</span></span></button><button class="experiment" disabled><span class="exp-icon">🧪</span><span><span class="exp-name">অন্য SSC প্র্যাকটিক্যাল</span><span class="exp-meta">পরবর্তী সংস্করণে</span></span></button></div><div class="guide-box warning">⚠ নিরাপত্তা: এটি শিক্ষামূলক সিমুলেশন। বাস্তব রাসায়নিক নিয়ে কাজ করার সমරǱ˞