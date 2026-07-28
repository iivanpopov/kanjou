import { useKanjou } from '@kanjou/react'
import { use } from 'react'

import { IntlContext } from './intl-context'

export function useIntl() {
  return { ...use(IntlContext), ...useKanjou() }
}
