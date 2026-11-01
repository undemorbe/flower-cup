<script setup>
// Один цветок/лист в локальных координатах: (0,0) - точка, куда приходит стебель.
const props = defineProps({
  type: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  s: { type: Number, default: 1 },
  r: { type: Number, default: 0 },
})

const ring = (n, offset = 0) => Array.from({ length: n }, (_, i) => offset + (360 / n) * i)
const transform = `translate(${props.x} ${props.y}) rotate(${props.r}) scale(${props.s})`
</script>

<template>
  <g :transform="transform">
    <!-- ромашка -->
    <g v-if="type === 'daisy'">
      <ellipse
        v-for="a in ring(13)"
        :key="a"
        class="a-petal"
        cx="0"
        cy="-8.5"
        rx="2.9"
        ry="7.4"
        :transform="`rotate(${a})`"
      />
      <circle class="a-pollen" r="5" />
      <circle class="a-pollen-dark" r="2.1" cx="-1" cy="-1" opacity=".35" />
    </g>

    <!-- подсолнух -->
    <g v-else-if="type === 'sunflower'">
      <ellipse
        v-for="a in ring(20, 9)"
        :key="'b' + a"
        class="a-sunflower-back"
        cx="0"
        cy="-17"
        rx="4.4"
        ry="10"
        :transform="`rotate(${a})`"
      />
      <ellipse
        v-for="a in ring(18)"
        :key="a"
        class="a-sunflower"
        cx="0"
        cy="-15.5"
        rx="4.6"
        ry="10.5"
        :transform="`rotate(${a})`"
      />
      <circle class="a-seedhead" r="11.5" />
      <circle
        v-for="a in ring(12)"
        :key="'d' + a"
        class="a-seedhead-dot"
        r="1.1"
        cx="0"
        cy="-7"
        :transform="`rotate(${a})`"
      />
      <circle
        v-for="a in ring(7, 20)"
        :key="'e' + a"
        class="a-seedhead-dot"
        r="1"
        cx="0"
        cy="-3.4"
        :transform="`rotate(${a})`"
      />
    </g>

    <!-- роза -->
    <g v-else-if="type === 'rose'">
      <circle
        v-for="a in ring(6, 15)"
        :key="a"
        class="a-rose"
        r="8.5"
        cx="0"
        cy="-8"
        :transform="`rotate(${a})`"
      />
      <circle class="a-rose" r="10.5" />
      <path
        class="a-rose-line"
        d="M0 0 c3 -1 4 -5 0 -6.5 c-5 -1.5 -8 3 -6 7 c2.5 5 10 5 12 -1 c2 -6 -3 -12 -10 -10.5"
      />
    </g>

    <!-- василёк -->
    <g v-else-if="type === 'cornflower'">
      <polygon
        v-for="a in ring(11)"
        :key="a"
        class="a-cornflower"
        points="-3,-3 0,-13 3,-3"
        :transform="`rotate(${a})`"
      />
      <polygon
        v-for="a in ring(11, 16)"
        :key="'i' + a"
        class="a-cornflower-dark"
        points="-2,-2 0,-8 2,-2"
        :transform="`rotate(${a})`"
      />
      <circle class="a-cornflower-dark" r="3" />
    </g>

    <!-- лаванда: колос растёт вверх от точки стебля -->
    <g v-else-if="type === 'lavender'">
      <ellipse
        v-for="i in 9"
        :key="i"
        class="a-lavender"
        :cx="i % 2 ? -2 : 2"
        :cy="-4 - i * 4.2"
        rx="2.6"
        :ry="3.6 - i * 0.12"
        :transform="`rotate(${i % 2 ? -18 : 18} ${i % 2 ? -2 : 2} ${-4 - i * 4.2})`"
      />
      <ellipse class="a-lavender" cx="0" cy="-43" rx="1.8" ry="3" />
    </g>

    <!-- лагурус -->
    <g v-else-if="type === 'lagurus'">
      <ellipse class="a-lagurus" cx="0" cy="-11" rx="5.5" ry="11" />
      <path class="a-lagurus-line" d="M0 -22 v-5 M-2 -4 l-2 3 M2 -4 l2 3" />
    </g>

    <!-- танацетум -->
    <g v-else-if="type === 'tansy'">
      <circle class="a-tansy" r="3.6" cx="0" cy="0" />
      <circle class="a-tansy" r="3.2" cx="-6" cy="2" />
      <circle class="a-tansy" r="3.2" cx="6" cy="1.5" />
      <circle class="a-tansy" r="3" cx="-3" cy="-5.5" />
      <circle class="a-tansy" r="3" cx="4" cy="-5.5" />
      <circle class="a-pollen-dark" r="1" cx="0" cy="0" opacity=".4" />
    </g>

    <!-- гипсофила -->
    <g v-else-if="type === 'gyps'">
      <path class="a-thin-stem" d="M0 0 L-8 -10 M0 0 L7 -12 M0 0 L1 -16 M-8 -10 L-13 -14 M7 -12 L12 -15" />
      <circle
        v-for="(p, i) in [[-8,-10],[7,-12],[1,-16],[-13,-14],[12,-15],[-4,-17],[5,-19],[-10,-5],[10,-6],[-1,-9]]"
        :key="i"
        class="a-gyps"
        :cx="p[0]"
        :cy="p[1]"
        r="2"
      />
    </g>

    <!-- эвкалипт -->
    <g v-else-if="type === 'eucalyptus'">
      <path class="a-thin-stem" d="M0 0 C 2 -14 -2 -30 3 -46" />
      <circle
        v-for="(p, i) in [[-4,-8],[5,-15],[-4,-23],[6,-30],[-3,-37],[4,-44]]"
        :key="i"
        class="a-eucalyptus"
        :cx="p[0]"
        :cy="p[1]"
        :r="5.6 - i * 0.45"
      />
    </g>

    <!-- лист -->
    <g v-else-if="type === 'leaf'">
      <path class="a-leaf" d="M0 0 C 10 -10 10 -28 0 -40 C -10 -28 -10 -10 0 0 Z" />
      <path class="a-leaf-line" d="M0 -2 V-36" />
    </g>

    <!-- базилик -->
    <g v-else-if="type === 'basil'">
      <path class="a-leaf" d="M0 0 C 12 -6 14 -20 4 -28 C -6 -22 -6 -8 0 0 Z" transform="rotate(-38)" />
      <path class="a-leaf" d="M0 0 C 12 -6 14 -20 4 -28 C -6 -22 -6 -8 0 0 Z" transform="rotate(32) scale(-1 1)" />
      <path class="a-leaf-light" d="M0 0 C 9 -6 10 -16 2 -24 C -6 -18 -6 -6 0 0 Z" transform="translate(0 -12)" />
      <path class="a-leaf-line" d="M0 -14 V-32" />
    </g>

    <!-- настурция -->
    <g v-else-if="type === 'nasturtium'">
      <ellipse
        v-for="a in ring(5, 10)"
        :key="a"
        class="a-nasturtium"
        cx="0"
        cy="-8"
        rx="6.4"
        ry="8"
        :transform="`rotate(${a})`"
      />
      <circle class="a-pollen" r="3" />
      <path class="a-nasturtium-line" d="M0 -3 V-12 M-3 -2 L-8 -8 M3 -2 L8 -8" />
    </g>

    <!-- круглый лист настурции -->
    <g v-else-if="type === 'padleaf'">
      <circle class="a-leaf-light" r="11" cx="0" cy="-11" />
      <path class="a-leaf-line" d="M0 -11 l0 -9 M0 -11 l8 -5 M0 -11 l8 5 M0 -11 l-8 5 M0 -11 l-8 -5" />
    </g>
  </g>
</template>
