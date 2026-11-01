<script setup>
import CupStage from './art/CupStage.vue'

const stages = [
  {
    title: 'Стоит как в вазе',
    text: 'Наливаете воду прямо в стаканчик. Плотный крафт держит её всю жизнь букета - ваза не нужна.',
  },
  {
    title: 'Букет отцвёл',
    text: 'Цветы - в компост, воду - в раковину. Стаканчик не выбрасывайте: самое интересное впереди.',
  },
  {
    title: 'Семечко на дне',
    text: 'Под цветами лежит бумажный конвертик с семенами. Насыпьте в стаканчик землю и посейте их.',
  },
  {
    title: 'Прямо в землю',
    text: 'Окрепший росток сажайте в горшок или в грунт вместе со стаканчиком: картон размокнет и станет частью почвы.',
    note: 'корни не тревожим',
  },
]
</script>

<template>
  <section id="cups" class="cups" aria-labelledby="cups-title">
    <div class="wrap">
      <header class="cups__head">
        <h2 id="cups-title" v-reveal>Биоразлагаемый стаканчик, в котором можно прорастить семечко</h2>
        <p v-reveal="100">Один стаканчик проживает четыре жизни. Вот как это выглядит у вас дома.</p>
      </header>

      <ol class="stages">
        <li v-for="(s, i) in stages" :key="s.title" v-reveal class="stage" :style="{ '--step': i }">
          <span class="stage__n num" aria-hidden="true">{{ i + 1 }}.0</span>
          <CupStage class="stage__art" :stage="i + 1" />
          <div class="stage__body">
            <h3>{{ s.title }}</h3>
            <p>{{ s.text }}</p>
            <p v-if="s.note" class="stage__note hand">{{ s.note }}</p>
          </div>
        </li>
      </ol>

      <div class="cups__foot">
        <RouterLink class="btn btn--light" :to="{ hash: '#seeds' }">Выбрать семечко <span class="arrow">→</span></RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cups {
  background: var(--color-forest);
  color: var(--color-on-forest);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
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

.stages {
  counter-reset: stage;
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

.cups__foot {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-xl);
  border-top: 3px solid var(--color-forest-rule);
}

@media (max-width: 56rem) {
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

  .cups__foot {
    justify-content: flex-start;
  }
}
</style>
