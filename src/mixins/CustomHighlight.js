import javascript from 'highlight.js/lib/languages/javascript'

export default function customJavaScript(hljs){
  const base = javascript(hljs)

  base.contains.unshift(
    {
      className: 'operator',
      match: /(===|!==|==|!=|!|<=|>=|=>|--|\+|-|\*|\/|%|=|<|>|\||&|\^|~|\?)/
    },
    {
      className: 'variable',
      match: /(_)/
    },
    {
      className: 'keyword',
      match: /this/
    }
  )

  return base
}
