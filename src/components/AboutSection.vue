<script setup>
const points = [
  { title: 'Стаканчик вместо вазы', text: 'И вместо плёнки, и вместо коробки. Цветы сразу стоят в воде.' },
  { title: 'Платите за цветы', text: 'Без пластика и лишней упаковки букет обходится дешевле.' },
  { title: 'Вторая жизнь', text: 'На дне - семечко. Отцвёл букет - посадите стаканчик.' },
]
</script>

<template>
  <section id="about" class="about wrap" aria-labelledby="about-title">
    <h2 id="about-title" class="visually-hidden">О нас</h2>
    <p v-reveal class="about__statement">
      Мы делаем букеты, которые чуть
      <span class="mark">добрее<svg viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 8 C 30 3, 70 2, 118 6" /></svg></span>
      к планете - и чуть дешевле для вас, потому что не тратимся на пластик и упаковку.
    </p>
    <dl class="about__points">
      <div v-for="(p, i) in points" :key="p.title" v-reveal="i * 80" class="about__point">
        <dt>{{ p.title }}</dt>
        <dd>{{ p.text }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.about {
  display: grid;
  grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
  gap: var(--space-2xl);
  align-items: end;
  padding-block: var(--space-2xl) var(--space-4xl);
}

.about__statement {
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

.about__points {
  margin: 0;
}

.about__point {
  padding-block: var(--space-md);
  border-top: var(--rule-hair);
}

.about__point dt {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  line-height: 1.15;
}

.about__point dd {
  margin: var(--space-2xs) 0 0;
  font-size: var(--text-sm);
  color: var(--color-ink-muted);
  max-width: 32ch;
}

@media (max-width: 56rem) {
  .about {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-xl);
    padding-block: var(--space-xl) var(--space-3xl);
  }
}
</style>
