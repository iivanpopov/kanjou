import type { Locale, Message, RichComponents } from '@kanjou/react'
import type { ReactNode } from 'react'

import { KanjouProvider } from '@kanjou/react'
import { useState } from 'react'

import { loader } from '#/utils/locale'

import { IntlContext } from './intl-context'

// fix ai slop
const defaultComponents: RichComponents = {
  b: ({ children, ...props }) => <strong {...props}>{children}</strong>,
  i: ({ children, ...props }) => <em {...props}>{children}</em>,
  link: ({ children, href = 'https://github.com/iivanpopov/kanjou', ...props }) => (
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  ),
  badge: (props) => (
    <span
      style={{
        padding: '2px 6px',
        borderRadius: '4px',
        background: '#6366f1',
        color: '#ffffff',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }}
      {...props}
    >
      VIP
    </span>
  ),
  card: ({ children, ...props }) => (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        marginTop: '8px',
        backgroundColor: '#f8fafc',
      }}
      {...props}
    >
      {children}
    </div>
  ),
}

export function IntlProvider({
  children,
  initialLocale,
  initialMessages,
  components = defaultComponents,
}: {
  children: ReactNode
  initialLocale: Locale
  initialMessages: Record<string, Message>
  components?: RichComponents
}) {
  const [_locale, _setLocale] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Record<string, Message>>(() => initialMessages)

  const setLocale = async (newLocale: Locale) => {
    const newMessages = await loader(newLocale)
    setMessages(newMessages)
    _setLocale(newLocale)
  }

  return (
    <IntlContext value={{ locale: _locale, setLocale, messages, setMessages }}>
      {/* kanjou provider only needs the current locale and raw messages object */}
      <KanjouProvider locale={_locale} messages={messages} components={components}>
        {children}
      </KanjouProvider>
    </IntlContext>
  )
}
