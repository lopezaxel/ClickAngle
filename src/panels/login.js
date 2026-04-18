import { signIn } from '../lib/auth.js';
import { icon } from '../icons.js';

export function renderLogin(container) {
  let loading = false;
  let errorMsg = '';

  function render() {
    container.innerHTML = `
    <div class="login-wrapper">

      <div class="login-bg" aria-hidden="true" style="display:none">
        <svg class="circuit-svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="cf-sm" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="cf-md" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="14" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="cf-lg" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="40" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="cf-xlg" x="-400%" y="-400%" width="900%" height="900%">
              <feGaussianBlur stdDeviation="90" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="cf-ambient" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#dc2626" stop-opacity="0.55"/>
              <stop offset="18%"  stop-color="#dc2626" stop-opacity="0.28"/>
              <stop offset="42%"  stop-color="#dc2626" stop-opacity="0.09"/>
              <stop offset="100%" stop-color="#000"    stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="cf-chip-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stop-color="#ff7777" stop-opacity="1"/>
              <stop offset="40%"  stop-color="#dc2626" stop-opacity="0.8"/>
              <stop offset="100%" stop-color="#7f1d1d" stop-opacity="0"/>
            </radialGradient>
            <pattern id="cf-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0L0 0L0 48" fill="none" stroke="rgba(220,38,38,0.1)" stroke-width="0.5"/>
            </pattern>
          </defs>

          <!-- BACKGROUND -->
          <rect width="1920" height="1080" fill="#050505"/>
          <rect width="1920" height="1080" fill="url(#cf-grid)"/>
          <ellipse cx="960" cy="540" rx="980" ry="980" fill="url(#cf-ambient)" class="cg-breathe"/>

          <!-- ════ BASE TRACES (dim, always visible) ════ -->
          <g fill="none" stroke="#dc2626" stroke-width="1.2" stroke-linecap="square" stroke-linejoin="miter" opacity="0.28">
            <!-- TOP: 11 traces to y=0 -->
            <path d="M 880 460 V 358 H 622 V 218 H 382 V 78 H 182 V 0"/>
            <path d="M 900 460 V 338 H 1108 V 188 H 1348 V 48 H 1568 V 0"/>
            <path d="M 918 460 V 298 H 748 V 168 H 508 V 0"/>
            <path d="M 936 460 V 258 H 1128 V 128 H 1378 V 0"/>
            <path d="M 950 460 V 228 H 790 V 108 H 568 V 0"/>
            <path d="M 960 460 V 0"/>
            <path d="M 970 460 V 228 H 1148 V 108 H 1390 V 0"/>
            <path d="M 984 460 V 258 H 832 V 128 H 582 V 0"/>
            <path d="M 1002 460 V 298 H 1192 V 168 H 1452 V 0"/>
            <path d="M 1020 460 V 338 H 852 V 188 H 612 V 48 H 412 V 0"/>
            <path d="M 1040 460 V 358 H 1338 V 218 H 1578 V 78 H 1768 V 0"/>
            <!-- Top crossbars -->
            <path d="M 748 298 H 918"/>
            <path d="M 1002 298 H 1192"/>
            <path d="M 790 228 H 950"/>
            <path d="M 970 228 H 1148"/>
            <path d="M 622 358 H 880"/>
            <path d="M 1040 358 H 1338"/>

            <!-- BOTTOM: 11 traces to y=1080 -->
            <path d="M 880 620 V 722 H 622 V 862 H 382 V 1002 H 182 V 1080"/>
            <path d="M 900 620 V 742 H 1108 V 892 H 1348 V 1080"/>
            <path d="M 918 620 V 782 H 748 V 912 H 508 V 1080"/>
            <path d="M 936 620 V 822 H 1128 V 952 H 1378 V 1080"/>
            <path d="M 950 620 V 852 H 790 V 972 H 568 V 1080"/>
            <path d="M 960 620 V 1080"/>
            <path d="M 970 620 V 852 H 1148 V 972 H 1390 V 1080"/>
            <path d="M 984 620 V 822 H 832 V 952 H 582 V 1080"/>
            <path d="M 1002 620 V 782 H 1192 V 912 H 1452 V 1080"/>
            <path d="M 1020 620 V 742 H 852 V 892 H 612 V 1080"/>
            <path d="M 1040 620 V 722 H 1338 V 862 H 1578 V 1002 H 1768 V 1080"/>
            <!-- Bottom crossbars -->
            <path d="M 748 782 H 918"/>
            <path d="M 1002 782 H 1192"/>
            <path d="M 790 852 H 950"/>
            <path d="M 970 852 H 1148"/>

            <!-- LEFT: 7 traces to x=0 -->
            <path d="M 880 470 H 760 V 330 H 540 V 170 H 0"/>
            <path d="M 880 490 H 700 V 620 H 480 V 800 H 0"/>
            <path d="M 880 512 H 600 V 400 H 0"/>
            <path d="M 880 540 H 0"/>
            <path d="M 880 568 H 600 V 680 H 0"/>
            <path d="M 880 590 H 700 V 460 H 480 V 280 H 0"/>
            <path d="M 880 610 H 760 V 750 H 540 V 910 H 0"/>
            <!-- Left vertical connectors -->
            <path d="M 760 470 V 610"/>
            <path d="M 600 400 V 680"/>

            <!-- RIGHT: 7 traces to x=1920 -->
            <path d="M 1040 470 H 1160 V 330 H 1380 V 170 H 1920"/>
            <path d="M 1040 490 H 1220 V 620 H 1440 V 800 H 1920"/>
            <path d="M 1040 512 H 1320 V 400 H 1920"/>
            <path d="M 1040 540 H 1920"/>
            <path d="M 1040 568 H 1320 V 680 H 1920"/>
            <path d="M 1040 590 H 1220 V 460 H 1440 V 280 H 1920"/>
            <path d="M 1040 610 H 1160 V 750 H 1380 V 910 H 1920"/>
            <!-- Right vertical connectors -->
            <path d="M 1160 470 V 610"/>
            <path d="M 1320 400 V 680"/>
          </g>

          <!-- ════ GLOW GROUP A — main spines (slow pulse) ════ -->
          <g class="cg-grp-a" fill="none" stroke-linecap="square" filter="url(#cf-sm)">
            <path d="M 960 460 V 0"                                         stroke="#ff5555" stroke-width="2.5"/>
            <path d="M 960 620 V 1080"                                      stroke="#ff5555" stroke-width="2.5"/>
            <path d="M 880 540 H 0"                                         stroke="#ff5555" stroke-width="2.5"/>
            <path d="M 1040 540 H 1920"                                     stroke="#ff5555" stroke-width="2.5"/>
            <path d="M 880 460 V 358 H 622 V 218 H 382 V 78 H 182 V 0"     stroke="#ef4444" stroke-width="2"/>
            <path d="M 1040 460 V 358 H 1338 V 218 H 1578 V 78 H 1768 V 0" stroke="#ef4444" stroke-width="2"/>
            <path d="M 880 620 V 722 H 622 V 862 H 382 V 1002 H 182 V 1080" stroke="#ef4444" stroke-width="2"/>
            <path d="M 1040 620 V 722 H 1338 V 862 H 1578 V 1002 H 1768 V 1080" stroke="#ef4444" stroke-width="2"/>
          </g>

          <!-- ════ GLOW GROUP B ════ -->
          <g class="cg-grp-b" fill="none" stroke-linecap="square" filter="url(#cf-sm)">
            <path d="M 918 460 V 298 H 748 V 168 H 508 V 0"                stroke="#dc2626" stroke-width="1.8"/>
            <path d="M 1002 460 V 298 H 1192 V 168 H 1452 V 0"             stroke="#dc2626" stroke-width="1.8"/>
            <path d="M 936 460 V 258 H 1128 V 128 H 1378 V 0"              stroke="#ef4444" stroke-width="1.8"/>
            <path d="M 984 460 V 258 H 832 V 128 H 582 V 0"                stroke="#ef4444" stroke-width="1.8"/>
            <path d="M 918 620 V 782 H 748 V 912 H 508 V 1080"             stroke="#dc2626" stroke-width="1.8"/>
            <path d="M 1002 620 V 782 H 1192 V 912 H 1452 V 1080"          stroke="#dc2626" stroke-width="1.8"/>
            <path d="M 880 470 H 760 V 330 H 540 V 170 H 0"                stroke="#ef4444" stroke-width="1.8"/>
            <path d="M 1040 470 H 1160 V 330 H 1380 V 170 H 1920"          stroke="#ef4444" stroke-width="1.8"/>
            <path d="M 880 610 H 760 V 750 H 540 V 910 H 0"                stroke="#dc2626" stroke-width="1.8"/>
            <path d="M 1040 610 H 1160 V 750 H 1380 V 910 H 1920"          stroke="#dc2626" stroke-width="1.8"/>
          </g>

          <!-- ════ GLOW GROUP C ════ -->
          <g class="cg-grp-c" fill="none" stroke-linecap="square" filter="url(#cf-sm)">
            <path d="M 950 460 V 228 H 790 V 108 H 568 V 0"                stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 970 460 V 228 H 1148 V 108 H 1390 V 0"              stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 1020 460 V 338 H 852 V 188 H 612 V 48 H 412 V 0"   stroke="#dc2626" stroke-width="1.5"/>
            <path d="M 900 460 V 338 H 1108 V 188 H 1348 V 48 H 1568 V 0"  stroke="#dc2626" stroke-width="1.5"/>
            <path d="M 950 620 V 852 H 790 V 972 H 568 V 1080"             stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 970 620 V 852 H 1148 V 972 H 1390 V 1080"           stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 880 490 H 700 V 620 H 480 V 800 H 0"                stroke="#dc2626" stroke-width="1.5"/>
            <path d="M 1040 490 H 1220 V 620 H 1440 V 800 H 1920"          stroke="#dc2626" stroke-width="1.5"/>
            <path d="M 880 512 H 600 V 400 H 0"                            stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 1040 512 H 1320 V 400 H 1920"                       stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 880 568 H 600 V 680 H 0"                            stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 1040 568 H 1320 V 680 H 1920"                       stroke="#b91c1c" stroke-width="1.5"/>
            <path d="M 880 590 H 700 V 460 H 480 V 280 H 0"                stroke="#dc2626" stroke-width="1.5"/>
            <path d="M 1040 590 H 1220 V 460 H 1440 V 280 H 1920"          stroke="#dc2626" stroke-width="1.5"/>
            <!-- crossbars glow -->
            <path d="M 748 298 H 918"   stroke="#ef4444" stroke-width="1.5"/>
            <path d="M 1002 298 H 1192" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M 790 228 H 950"   stroke="#dc2626" stroke-width="1.5"/>
            <path d="M 970 228 H 1148"  stroke="#dc2626" stroke-width="1.5"/>
            <path d="M 748 782 H 918"   stroke="#ef4444" stroke-width="1.5"/>
            <path d="M 1002 782 H 1192" stroke="#ef4444" stroke-width="1.5"/>
            <path d="M 760 470 V 610"   stroke="#ef4444" stroke-width="1.5"/>
            <path d="M 1160 470 V 610"  stroke="#ef4444" stroke-width="1.5"/>
          </g>

          <!-- ════ SIGNAL PULSES (traveling light = AI data flow) ════ -->
          <g fill="none" stroke-linecap="round" filter="url(#cf-sm)">
            <path class="cg-sig cg-sig-1" d="M 960 460 V 0"                                          stroke="#ff8888" stroke-width="4"/>
            <path class="cg-sig cg-sig-2" d="M 960 620 V 1080"                                       stroke="#ff8888" stroke-width="4"/>
            <path class="cg-sig cg-sig-3" d="M 880 540 H 0"                                          stroke="#ff8888" stroke-width="4"/>
            <path class="cg-sig cg-sig-4" d="M 1040 540 H 1920"                                      stroke="#ff8888" stroke-width="4"/>
            <path class="cg-sig cg-sig-5" d="M 880 460 V 358 H 622 V 218 H 382 V 78 H 182 V 0"      stroke="#ff6666" stroke-width="3"/>
            <path class="cg-sig cg-sig-6" d="M 1040 620 V 722 H 1338 V 862 H 1578 V 1002 H 1768 V 1080" stroke="#ff6666" stroke-width="3"/>
            <path class="cg-sig cg-sig-7" d="M 1040 460 V 358 H 1338 V 218 H 1578 V 78 H 1768 V 0"  stroke="#ff6666" stroke-width="3"/>
            <path class="cg-sig cg-sig-8" d="M 880 620 V 722 H 622 V 862 H 382 V 1002 H 182 V 1080" stroke="#ff6666" stroke-width="3"/>
          </g>

          <!-- ════ JUNCTION DOTS ════ -->
          <g fill="#ef4444" class="cg-dots">
            <!-- top bends -->
            <circle cx="880" cy="358" r="4"/><circle cx="622" cy="358" r="4"/><circle cx="622" cy="218" r="4"/><circle cx="382" cy="218" r="4"/><circle cx="382" cy="78" r="4"/><circle cx="182" cy="78" r="4"/>
            <circle cx="900" cy="338" r="4"/><circle cx="1108" cy="338" r="4"/><circle cx="1108" cy="188" r="4"/><circle cx="1348" cy="188" r="4"/><circle cx="1348" cy="48" r="4"/>
            <circle cx="918" cy="298" r="4"/><circle cx="748" cy="298" r="4"/><circle cx="748" cy="168" r="4"/><circle cx="508" cy="168" r="4"/>
            <circle cx="936" cy="258" r="4"/><circle cx="1128" cy="258" r="4"/><circle cx="1128" cy="128" r="4"/><circle cx="1378" cy="128" r="4"/>
            <circle cx="950" cy="228" r="4"/><circle cx="790" cy="228" r="4"/><circle cx="790" cy="108" r="4"/><circle cx="568" cy="108" r="4"/>
            <circle cx="970" cy="228" r="4"/><circle cx="1148" cy="228" r="4"/><circle cx="1148" cy="108" r="4"/><circle cx="1390" cy="108" r="4"/>
            <circle cx="984" cy="258" r="4"/><circle cx="832" cy="258" r="4"/><circle cx="832" cy="128" r="4"/><circle cx="582" cy="128" r="4"/>
            <circle cx="1002" cy="298" r="4"/><circle cx="1192" cy="298" r="4"/><circle cx="1192" cy="168" r="4"/><circle cx="1452" cy="168" r="4"/>
            <circle cx="1020" cy="338" r="4"/><circle cx="852" cy="338" r="4"/><circle cx="852" cy="188" r="4"/><circle cx="612" cy="188" r="4"/>
            <circle cx="1040" cy="358" r="4"/><circle cx="1338" cy="358" r="4"/><circle cx="1338" cy="218" r="4"/><circle cx="1578" cy="218" r="4"/>
            <!-- bottom bends -->
            <circle cx="880" cy="722" r="4"/><circle cx="622" cy="722" r="4"/><circle cx="622" cy="862" r="4"/><circle cx="382" cy="862" r="4"/><circle cx="382" cy="1002" r="4"/><circle cx="182" cy="1002" r="4"/>
            <circle cx="900" cy="742" r="4"/><circle cx="1108" cy="742" r="4"/><circle cx="1108" cy="892" r="4"/><circle cx="1348" cy="892" r="4"/>
            <circle cx="918" cy="782" r="4"/><circle cx="748" cy="782" r="4"/><circle cx="748" cy="912" r="4"/><circle cx="508" cy="912" r="4"/>
            <circle cx="936" cy="822" r="4"/><circle cx="1128" cy="822" r="4"/><circle cx="1128" cy="952" r="4"/><circle cx="1378" cy="952" r="4"/>
            <circle cx="950" cy="852" r="4"/><circle cx="790" cy="852" r="4"/><circle cx="790" cy="972" r="4"/><circle cx="568" cy="972" r="4"/>
            <circle cx="970" cy="852" r="4"/><circle cx="1148" cy="852" r="4"/><circle cx="1148" cy="972" r="4"/>
            <circle cx="1040" cy="722" r="4"/><circle cx="1338" cy="722" r="4"/><circle cx="1338" cy="862" r="4"/><circle cx="1578" cy="862" r="4"/>
            <!-- left bends -->
            <circle cx="760" cy="470" r="4"/><circle cx="760" cy="330" r="4"/><circle cx="540" cy="330" r="4"/><circle cx="540" cy="170" r="4"/>
            <circle cx="700" cy="490" r="4"/><circle cx="700" cy="620" r="4"/><circle cx="480" cy="620" r="4"/><circle cx="480" cy="800" r="4"/>
            <circle cx="600" cy="512" r="4"/><circle cx="600" cy="400" r="4"/>
            <circle cx="600" cy="568" r="4"/><circle cx="600" cy="680" r="4"/>
            <circle cx="700" cy="590" r="4"/><circle cx="700" cy="460" r="4"/><circle cx="480" cy="460" r="4"/><circle cx="480" cy="280" r="4"/>
            <circle cx="760" cy="610" r="4"/><circle cx="760" cy="750" r="4"/><circle cx="540" cy="750" r="4"/><circle cx="540" cy="910" r="4"/>
            <!-- right bends -->
            <circle cx="1160" cy="470" r="4"/><circle cx="1160" cy="330" r="4"/><circle cx="1380" cy="330" r="4"/><circle cx="1380" cy="170" r="4"/>
            <circle cx="1220" cy="490" r="4"/><circle cx="1220" cy="620" r="4"/><circle cx="1440" cy="620" r="4"/><circle cx="1440" cy="800" r="4"/>
            <circle cx="1320" cy="512" r="4"/><circle cx="1320" cy="400" r="4"/>
            <circle cx="1320" cy="568" r="4"/><circle cx="1320" cy="680" r="4"/>
            <circle cx="1220" cy="590" r="4"/><circle cx="1220" cy="460" r="4"/><circle cx="1440" cy="460" r="4"/><circle cx="1440" cy="280" r="4"/>
            <circle cx="1160" cy="610" r="4"/><circle cx="1160" cy="750" r="4"/><circle cx="1380" cy="750" r="4"/><circle cx="1380" cy="910" r="4"/>
          </g>

          <!-- ════ EDGE PADS ════ -->
          <g fill="#dc2626" opacity="0.6">
            <!-- top edge -->
            <rect x="174" y="0" width="16" height="7"/><rect x="374" y="0" width="16" height="7"/>
            <rect x="500" y="0" width="16" height="7"/><rect x="560" y="0" width="16" height="7"/>
            <rect x="574" y="0" width="16" height="7"/><rect x="604" y="0" width="16" height="7"/>
            <rect x="952" y="0" width="16" height="7"/>
            <rect x="1370" y="0" width="16" height="7"/><rect x="1382" y="0" width="16" height="7"/>
            <rect x="1444" y="0" width="16" height="7"/><rect x="1560" y="0" width="16" height="7"/>
            <rect x="1760" y="0" width="16" height="7"/>
            <!-- bottom edge -->
            <rect x="174" y="1073" width="16" height="7"/><rect x="374" y="1073" width="16" height="7"/>
            <rect x="500" y="1073" width="16" height="7"/><rect x="604" y="1073" width="16" height="7"/>
            <rect x="952" y="1073" width="16" height="7"/>
            <rect x="1382" y="1073" width="16" height="7"/><rect x="1560" y="1073" width="16" height="7"/>
            <rect x="1760" y="1073" width="16" height="7"/>
            <!-- left edge -->
            <rect x="0" y="162" width="7" height="16"/><rect x="0" y="272" width="7" height="16"/>
            <rect x="0" y="392" width="7" height="16"/><rect x="0" y="532" width="7" height="16"/>
            <rect x="0" y="548" width="7" height="16"/><rect x="0" y="672" width="7" height="16"/>
            <rect x="0" y="792" width="7" height="16"/><rect x="0" y="902" width="7" height="16"/>
            <!-- right edge -->
            <rect x="1913" y="162" width="7" height="16"/><rect x="1913" y="272" width="7" height="16"/>
            <rect x="1913" y="392" width="7" height="16"/><rect x="1913" y="532" width="7" height="16"/>
            <rect x="1913" y="548" width="7" height="16"/><rect x="1913" y="672" width="7" height="16"/>
            <rect x="1913" y="792" width="7" height="16"/><rect x="1913" y="902" width="7" height="16"/>
          </g>

          <!-- ════ CHIP ════ -->
          <!-- Massive outer halo -->
          <rect x="800" y="380" width="320" height="320" rx="8"
                fill="url(#cf-chip-core)" filter="url(#cf-xlg)"
                class="cg-chip-halo"/>

          <!-- Outer corner brackets (outside chip rect) -->
          <g stroke="#ff5555" stroke-width="3" fill="none" class="cg-chip-border">
            <path d="M 876 436 V 456 M 876 436 H 896"/>
            <path d="M 1044 436 V 456 M 1044 436 H 1024"/>
            <path d="M 876 624 V 604 M 876 624 H 896"/>
            <path d="M 1044 624 V 604 M 1044 624 H 1024"/>
          </g>

          <!-- Chip body -->
          <rect x="880" y="440" width="160" height="180" rx="3"
                fill="rgba(4,4,4,0.92)" stroke="#ef4444" stroke-width="2"
                filter="url(#cf-sm)" class="cg-chip-outer"/>

          <!-- Inner frame 1 -->
          <rect x="892" y="452" width="136" height="156" rx="2"
                fill="none" stroke="#dc2626" stroke-width="1.2" opacity="0.7"/>

          <!-- Inner frame 2 (tighter) -->
          <rect x="904" y="464" width="112" height="132" rx="1"
                fill="rgba(10,2,2,0.8)" stroke="#991b1b" stroke-width="0.8" opacity="0.5"/>

          <!-- Inner corner marks -->
          <g stroke="#ef4444" stroke-width="1.5" fill="none" opacity="0.8">
            <path d="M 892 452 H 906 M 892 452 V 466"/>
            <path d="M 1028 452 H 1014 M 1028 452 V 466"/>
            <path d="M 892 608 H 906 M 892 608 V 594"/>
            <path d="M 1028 608 H 1014 M 1028 608 V 594"/>
          </g>

          <!-- Pin stubs: top -->
          <g stroke="#ef4444" stroke-width="1.8" opacity="0.9">
            <line x1="900" y1="440" x2="900" y2="452"/>
            <line x1="918" y1="440" x2="918" y2="452"/>
            <line x1="936" y1="440" x2="936" y2="452"/>
            <line x1="954" y1="440" x2="954" y2="452"/>
            <line x1="972" y1="440" x2="972" y2="452"/>
            <line x1="990" y1="440" x2="990" y2="452"/>
            <line x1="1008" y1="440" x2="1008" y2="452"/>
            <line x1="1026" y1="440" x2="1026" y2="452"/>
            <!-- bottom -->
            <line x1="900" y1="608" x2="900" y2="620"/>
            <line x1="918" y1="608" x2="918" y2="620"/>
            <line x1="936" y1="608" x2="936" y2="620"/>
            <line x1="954" y1="608" x2="954" y2="620"/>
            <line x1="972" y1="608" x2="972" y2="620"/>
            <line x1="990" y1="608" x2="990" y2="620"/>
            <line x1="1008" y1="608" x2="1008" y2="620"/>
            <line x1="1026" y1="608" x2="1026" y2="620"/>
            <!-- left -->
            <line x1="880" y1="470" x2="892" y2="470"/>
            <line x1="880" y1="490" x2="892" y2="490"/>
            <line x1="880" y1="512" x2="892" y2="512"/>
            <line x1="880" y1="540" x2="892" y2="540"/>
            <line x1="880" y1="568" x2="892" y2="568"/>
            <line x1="880" y1="590" x2="892" y2="590"/>
            <line x1="880" y1="610" x2="892" y2="610"/>
            <!-- right -->
            <line x1="1028" y1="470" x2="1040" y2="470"/>
            <line x1="1028" y1="490" x2="1040" y2="490"/>
            <line x1="1028" y1="512" x2="1040" y2="512"/>
            <line x1="1028" y1="540" x2="1040" y2="540"/>
            <line x1="1028" y1="568" x2="1040" y2="568"/>
            <line x1="1028" y1="590" x2="1040" y2="590"/>
            <line x1="1028" y1="610" x2="1040" y2="610"/>
          </g>

          <!-- Inner dot grid — pixel/AI matrix look -->
          <g class="cg-core-dots">
            <!-- Row 1 (y=476) -->
            <circle cx="916" cy="476" r="2.2" fill="#ff5555" opacity="0.6"/>
            <circle cx="934" cy="476" r="2.2" fill="#ff5555" opacity="0.6"/>
            <circle cx="952" cy="476" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="970" cy="476" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="988" cy="476" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="1006" cy="476" r="2.2" fill="#ff5555" opacity="0.6"/>
            <circle cx="1024" cy="476" r="2.2" fill="#ff5555" opacity="0.6"/>
            <!-- Row 2 (y=494) -->
            <circle cx="916" cy="494" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="934" cy="494" r="3" fill="#ff7777" opacity="0.8"/>
            <circle cx="952" cy="494" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="970" cy="494" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="988" cy="494" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="1006" cy="494" r="3" fill="#ff7777" opacity="0.8"/>
            <circle cx="1024" cy="494" r="2.5" fill="#ff6666" opacity="0.7"/>
            <!-- Row 3 (y=512) -->
            <circle cx="916" cy="512" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="934" cy="512" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="952" cy="512" r="4" fill="#ff9999" opacity="0.9"/>
            <circle cx="970" cy="512" r="4.5" fill="#ffaaaa" opacity="0.95"/>
            <circle cx="988" cy="512" r="4" fill="#ff9999" opacity="0.9"/>
            <circle cx="1006" cy="512" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="1024" cy="512" r="2.5" fill="#ff6666" opacity="0.7"/>
            <!-- Row 4 (y=530) — center row, biggest -->
            <circle cx="916" cy="530" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="934" cy="530" r="3.5" fill="#ff8888" opacity="0.85"/>
            <circle cx="952" cy="530" r="4.5" fill="#ffaaaa" opacity="0.95"/>
            <circle cx="970" cy="530" r="6" fill="#ffcccc" opacity="1"/>
            <circle cx="988" cy="530" r="4.5" fill="#ffaaaa" opacity="0.95"/>
            <circle cx="1006" cy="530" r="3.5" fill="#ff8888" opacity="0.85"/>
            <circle cx="1024" cy="530" r="2.5" fill="#ff6666" opacity="0.7"/>
            <!-- Row 5 (y=548) -->
            <circle cx="916" cy="548" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="934" cy="548" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="952" cy="548" r="4" fill="#ff9999" opacity="0.9"/>
            <circle cx="970" cy="548" r="4.5" fill="#ffaaaa" opacity="0.95"/>
            <circle cx="988" cy="548" r="4" fill="#ff9999" opacity="0.9"/>
            <circle cx="1006" cy="548" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="1024" cy="548" r="2.5" fill="#ff6666" opacity="0.7"/>
            <!-- Row 6 (y=566) -->
            <circle cx="916" cy="566" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="934" cy="566" r="3" fill="#ff7777" opacity="0.8"/>
            <circle cx="952" cy="566" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="970" cy="566" r="3.5" fill="#ff8888" opacity="0.85"/>
            <circle cx="988" cy="566" r="3" fill="#ff8888" opacity="0.85"/>
            <circle cx="1006" cy="566" r="3" fill="#ff7777" opacity="0.8"/>
            <circle cx="1024" cy="566" r="2.5" fill="#ff6666" opacity="0.7"/>
            <!-- Row 7 (y=584) -->
            <circle cx="916" cy="584" r="2.2" fill="#ff5555" opacity="0.6"/>
            <circle cx="934" cy="584" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="952" cy="584" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="970" cy="584" r="2.8" fill="#ff7777" opacity="0.75"/>
            <circle cx="988" cy="584" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="1006" cy="584" r="2.5" fill="#ff6666" opacity="0.7"/>
            <circle cx="1024" cy="584" r="2.2" fill="#ff5555" opacity="0.6"/>
            <!-- Row 8 (y=600) -->
            <circle cx="916" cy="600" r="2" fill="#ff4444" opacity="0.5"/>
            <circle cx="934" cy="600" r="2" fill="#ff4444" opacity="0.5"/>
            <circle cx="952" cy="600" r="2.2" fill="#ff5555" opacity="0.6"/>
            <circle cx="970" cy="600" r="2.5" fill="#ff6666" opacity="0.65"/>
            <circle cx="988" cy="600" r="2.2" fill="#ff5555" opacity="0.6"/>
            <circle cx="1006" cy="600" r="2" fill="#ff4444" opacity="0.5"/>
            <circle cx="1024" cy="600" r="2" fill="#ff4444" opacity="0.5"/>
          </g>

          <!-- Core glow (brightest point) -->
          <ellipse cx="960" cy="530" rx="70" ry="70"
                   fill="url(#cf-chip-core)" filter="url(#cf-md)"
                   class="cg-core-glow"/>
        </svg>
      </div>

      <!-- Login card -->
      <div class="login-card animate-in">
        <div class="login-header">
          <div class="login-logo">
            <div class="logo-icon" style="color:white;width:48px;height:48px;border-radius:var(--radius-lg);background:linear-gradient(135deg,var(--accent),var(--accent-dark));display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px var(--accent-glow);">
              ${icon('crosshair', 24)}
            </div>
            <div>
              <h1 style="font-size:24px;font-weight:800;margin:0;">ClickAngles</h1>
              <span class="version-badge" style="font-size:10px;">v2.0</span>
            </div>
          </div>
          <p class="text-sm text-muted" style="margin-top:var(--space-md);text-align:center;">
            Plataforma de Ingeniería de CTR para Creadores de Contenido
          </p>
        </div>

        <div class="login-tabs">
          <button class="login-tab active">Iniciar Sesión</button>
        </div>

        ${errorMsg ? `<div class="login-error">${icon('alertTriangle', 14)} ${errorMsg}</div>` : ''}

        <form id="auth-form" class="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="input-email" placeholder="tu@email.com" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contraseña</label>
            <div style="position:relative;">
              <input type="password" class="form-input" id="input-password" placeholder="••••••••" minlength="6" required style="padding-right:44px;" />
              <button type="button" id="toggle-password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px 6px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);transition:color 0.2s;" title="Mostrar contraseña">
                ${icon('eye', 18)}
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:var(--space-md);font-size:15px;font-weight:700;" ${loading ? 'disabled' : ''}>
            ${loading ? `<span class="animate-pulse">${icon('clock', 16)}</span> Ingresando...` : `${icon('bolt', 16)} Ingresar`}
          </button>
        </form>

        <div class="text-xs text-muted" style="text-align:center;margin-top:var(--space-lg);">
          ¿No tenés cuenta? Contactá al administrador para obtener acceso.
        </div>
      </div>
    </div>`;

    document.getElementById('toggle-password')?.addEventListener('click', () => {
      const pwInput = document.getElementById('input-password');
      const toggleBtn = document.getElementById('toggle-password');
      if (pwInput.type === 'password') {
        pwInput.type = 'text';
        toggleBtn.innerHTML = icon('eyeOff', 18);
        toggleBtn.title = 'Ocultar contraseña';
        toggleBtn.style.color = 'var(--accent-light)';
      } else {
        pwInput.type = 'password';
        toggleBtn.innerHTML = icon('eye', 18);
        toggleBtn.title = 'Mostrar contraseña';
        toggleBtn.style.color = 'var(--text-muted)';
      }
    });

    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('input-email').value;
      const password = document.getElementById('input-password').value;
      loading = true;
      errorMsg = '';
      render();
      try {
        await signIn(email, password);
      } catch (err) {
        console.error('Login attempt failed:', err);
        errorMsg = err.message === 'Timeout de autenticación (30s)'
          ? 'La conexión está lenta. Reintentá en unos segundos.'
          : (err.message || 'Error de autenticación');
        loading = false;
        render();
      }
    });
  }

  render();
}
