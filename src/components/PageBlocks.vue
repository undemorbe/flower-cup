<script setup>
// Блоки раздела из админки: крупная фраза, текст, тезисы, этапы, кнопка
import { computed } from 'vue'
import CupStage from './art/CupStage.vue'

const props = defineProps({ blocks: { type: Array, required: true } })

const STAGE = { water: 1, faded: 2, seed: 3, ground: 4 }
const CTA = {
  home: { name: 'home' },
  bouquets: { name: 'bouquets' },
  plants: { name: 'plants' },
  faq: { name: 'faq' },
  reviews: { name: 'reviews' },
  contacts: { name: 'contacts' },
}

// «...чуть добрее к планете...» -> [до, акцент, после]
function splitAccent(text, accent) {
  const at = accent ? text.indexOf(accent) : -1
  return at < 0 ? [text, '', ''] : [text.slice(0, at), accent, text.slice(at + accent.length)]
}

const paragraphs = (text) => text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

const items = computed(() =>
  props.blocks.map((b, i) => ({ ...b, key: `${b.type}-${i}`, parts: b.type === 'statement' ? splitAccent(b.text, b.accent) : null })),
)
</script>

<template>
  <div class="blocks">
    <template v-for="b in items" :key="b.key">
      <div v-if="b.type === 'statement'" class="wrap">
        <p v-reveal class="statement">
          {{ b.parts[0] }}<span v-if="b.parts[1]" class="mark">{{ b.parts[1] }}<svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 C 30 3, 70 2, 118 6" /></svg></span>{{ b.parts[2] }}
        </p>
      </div>

      <section v-else-if="b.type === 'text'" class="text wrap">
        <h2 v-if="b.heading" v-reveal>{{ b.heading }}</h2>
        <p v-for="(p, i) in paragraphs(b.text)" :key="i" v-reveal>{{ p }}</p>
      </section>

      <section v-else-if="b.type === 'points'" class="points wrap">
        <h2 v-if="b.heading" v-reveal>{{ b.heading }}</h2>
        <dl>
          <div v-for="(p, i) in b.items" :key="p.title" v-reveal="i * 80" class="point">
            <dt>{{ p.title }}</dt>
            <dd>{{ p.text }}</dd>
          </div>
        </dl>
      </section>

      <section v-else-if="b.type === 'stages'" class="cups">
        <div class="wrap">
          <header v-if="b.heading || b.lead" class="cups__head">
            <h2 v-if="b.heading" v-reveal>{{ b.heading }}</h2>
            <p v-if="b.lead" v-reveal="100">{{ b.lead }}</p>
          </header>
          <ol class="stages">
            <li v-for="(s, i) in b.items" :key="s.title" v-reveal class="stage" :style="{ '--step': i }">
              <span class="stage__n num" aria-hidden="true">{{ i + 1 }}.0</span>
              <CupStage class="stage__art" :stage="STAGE[s.art]" />
              <div class="stage__body">
                <h3>{{ s.title }}</h3>
                <p>{{ s.text }}</p>
                <p v-if="s.note" class="stage__note hand">{{ s.note }}</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <div v-else-if="b.type === 'cta'" class="cta wrap">
        <RouterLink class="btn" :to="CTA[b.to]">{{ b.label }} <span class="arrow">→</span></RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.blocks {
  display: grid;
  gap: var(--space-2xl);
  padding-bottom: var(--space-3xl);
}

/* --- крупная фраза --- */
.statement {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.01em;
  max-width: 22ch;
  text-wrap: balance;
}

.mark {
  position: relative;
  white-space: nowrap;
  font-family: var(--font-hand);
  font-weight: 400;
  font-size: 1.1em;
  letter-spacing: 0;
  color: var(--color-accent-ink);
}

.mark svg {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.12em;
  width: 100%;
  height: 0.28em;
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2.4;
  stroke-linecap: round;
}

/* --- текст --- */
.text {
  display: grid;
  gap: var(--space-sm);
}

.text h2,
.points h2 {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-2xs);
}

.text p {
  max-width: 62ch;
  font-size: var(--text-md);
}

/* --- тезисы --- */
.points dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0 var(--space-lg);
  margin: 0;
}

.point {
  padding-block: var(--space-md);
  border-top: var(--rule-hair);
}

.point dt {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.15;
}

.point dd {
  margin: var(--space-2xs) 0 0;
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  max-width: 32ch;
}

/* --- этапы стаканчика --- */
.cups {
  background: var(--color-forest);
  color: var(--color-on-forest);
  border-radius: var(--radius-lg);
  padding-block: var(--space-3xl);
}

.cups__head {
  display: grid;
  grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
  gap: var(--space-xl);
  align-items: end;
  margin-bottom: var(--space-2xl);
}

.cups__head h2 {
  font-size: var(--text-3xl);
  max-width: 22ch;
}

.cups__head p {
  color: var(--color-on-forest-muted);
  max-width: 30ch;
}

.stage {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) minmax(0, 5fr);
  gap: var(--space-xl);
  align-items: center;
  padding-block: var(--space-lg);
  border-top: 3px solid var(--color-forest-rule);
  margin-inline-start: calc(var(--step) * 5%);
}

.stage__n {
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 400;
  line-height: 0.85;
  color: var(--color-kraft);
}

.stage__art {
  max-width: 10rem;
}

.stage__body {
  display: grid;
  gap: var(--space-2xs);
  max-width: 40ch;
}

.stage__body h3 {
  font-size: var(--text-2xl);
}

.stage__body p {
  color: var(--color-on-forest-muted);
}

.stage__body .stage__note {
  font-size: var(--text-xl);
  color: var(--color-peach);
  transform: rotate(-2deg);
  transform-origin: left;
}

.cta {
  display: flex;
}

@media (max-width: 56rem) {
  .blocks {
    gap: var(--space-xl);
  }

  .cups {
    padding-block: var(--space-2xl);
  }

  .cups__head {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
  }

  .stage {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-md);
    margin-inline-start: 0;
  }

  .stage__body {
    grid-column: 1 / -1;
  }

  .stage__art {
    justify-self: end;
    max-width: 7.5rem;
  }
}
</style>
