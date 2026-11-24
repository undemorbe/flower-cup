// Глубокая копия JSON-данных. structuredClone не подходит: падает на reactive-прокси Vue.
export const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))
