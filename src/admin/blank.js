// Пустая запись по схеме - для кнопки «Добавить»
export function blank(spec) {
  switch (spec.kind) {
    case 'str':
      return spec.default ?? ''
    case 'num':
      return spec.nullable || spec.optional ? null : (spec.min ?? 0)
    case 'bool':
      return spec.default ?? false
    case 'enum':
      return spec.values[0].value
    case 'ref':
      return ''
    case 'list':
      return spec.min ? Array.from({ length: spec.min }, () => blank(spec.of)) : []
    case 'obj':
      return Object.fromEntries(Object.entries(spec.fields).map(([k, f]) => [k, blank(f)]))
    case 'union': {
      const [type, variant] = Object.entries(spec.variants)[0]
      return blankVariant(type, variant)
    }
    default:
      return null
  }
}

export const blankVariant = (type, variant) => ({ type, ...blank({ kind: 'obj', fields: variant.fields }) })

export const randomId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`
