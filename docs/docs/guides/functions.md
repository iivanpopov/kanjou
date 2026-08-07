---
title: Functions
render_with_liquid: false
---

# Functions

In MessageFormat 2, **functions** are used to format variables or data into localized strings. They are invoked by prefixing the function name with a colon, such as `:number`.

## Built-in Kanjou Functions

Kanjou comes pre-configured with several standard formatting functions to handle common localization needs out of the box:

- `:string` - Standard string interpolation.
- `:number` - Formats numeric values using `Intl.NumberFormat` (supports `select` for plurals).
- `:integer` - Formats numbers as integers.
- `:currency` - Formats numbers as monetary values.
- `:percent` - Formats numbers as percentages.
- `:offset` - Specialized number formatter with addition/subtraction offsets.

### Usage in Locale Files

You can apply functions to variables directly in your MF2 syntax. You can also pass options to these functions to customize their output.

```txt
.input {$price :currency currency="USD"}
{{The total is {$price}.}}
```

```txt
.input {$progress :percent}
{{You are {$progress} complete!}}
```

## Custom Functions

You can also define and provide custom functions to the `KanjouProvider` to handle app-specific formatting logic (e.g., a `:datetime` or `:userlink` formatter).

```tsx
import { KanjouProvider } from '@kanjou/react'
import type { MessageFunction } from '@kanjou/react'

const customDateFormatter: MessageFunction = (context, options, input) => {
  if (input instanceof Date) {
    return input.toLocaleDateString()
  }
  return String(input)
}

function App() {
  return (
    <KanjouProvider
      locale="en"
      messages={messages}
      functions={{
        datetime: customDateFormatter,
      }}
    >
      <AppContent />
    </KanjouProvider>
  )
}
```

When you generate types via the Kanjou CLI, your custom functions and their expected input types will be strictly typed in your components!
