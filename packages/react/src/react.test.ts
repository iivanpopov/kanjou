/// <reference types="node" />

import type { Message, MessageFunctions, MessageValue } from '@kanjou/core'
import type { ReactNode } from 'react'

import { createTranslate, createTranslateCache, rtFn, rtParts } from '@kanjou/core'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createElement, use } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import type { ReactTranslate, TranslateProviderProps } from '../dist/index.mjs'

import {
  enrich,
  KanjouReactError,
  TranslateContext,
  TranslateProvider,
  useTranslate,
} from '../dist/index.mjs'
import { defineTranslate } from '../dist/server.mjs'

function providerElement(
  props: Omit<TranslateProviderProps, 'children'>,
  children: ReactNode,
): ReactNode {
  // oxlint-disable-next-line react/no-children-prop
  return createElement(TranslateProvider, { ...props, children })
}

function fnMessage(name: string): Message {
  return {
    parts: (_values, runtime) => (runtime ? rtParts(rtFn(runtime, name, undefined)) : []),
  }
}

await describe('TranslateContext and useTranslate', async () => {
  await it('Should export TranslateContext and consume a custom context value in useTranslate()', () => {
    function ContextReader() {
      const fromContext = use(TranslateContext)
      const fromHook = useTranslate()
      assert.equal(fromContext, fromHook)
      return createElement('span', null, fromContext ? fromContext('hello') : 'missing')
    }

    const providerHtml = renderToStaticMarkup(
      providerElement(
        {
          locale: 'en',
          messages: { hello: 'Hello from provider' },
        },
        createElement(ContextReader),
      ),
    )
    assert.equal(providerHtml, '<span>Hello from provider</span>')

    const customTranslate: ReactTranslate = enrich(
      createTranslate({
        locale: 'en',
        messages: { hello: 'Hello from custom context' },
      }),
    )
    const customHtml = renderToStaticMarkup(
      createElement(TranslateContext, { value: customTranslate }, createElement(ContextReader)),
    )
    assert.equal(customHtml, '<span>Hello from custom context</span>')
  })

  await it('Should throw KanjouReactError when useTranslate() is called outside TranslateProvider', () => {
    function Outside() {
      const t = useTranslate()
      return createElement('span', null, t('hello'))
    }

    assert.throws(() => renderToStaticMarkup(createElement(Outside)), KanjouReactError)
  })

  await it('Should throw KanjouReactError when root TranslateProvider omits locale', () => {
    assert.throws(
      () =>
        renderToStaticMarkup(
          providerElement({ messages: { hello: 'Hello' } }, createElement('span', null, 'child')),
        ),
      KanjouReactError,
    )
  })

  await it('Should inherit locale and cache while shallow-merging messages, functions, and components', () => {
    let numberCacheGets = 0
    let numberCacheSets = 0
    const baseCache = createTranslateCache()
    const sharedCache = {
      ...baseCache,
      number: {
        get(key: string) {
          numberCacheGets++
          return baseCache.number.get(key)
        },
        set(key: string, value: unknown) {
          numberCacheSets++
          baseCache.number.set(key, value)
        },
      },
    }

    let seenLocale = ''
    let seenLocaleInRich = ''

    const parentFunctions: MessageFunctions = {
      shout: ({ locale }) => {
        seenLocale = locale
        return {
          type: 'shout',
          value: `parent:${locale}`,
          toParts: () => [{ type: 'shout', value: `parent:${locale}` }],
        }
      },
      keep: () => 'kept',
    }

    const childFunctions: MessageFunctions = {
      shout: ({ locale }) => {
        seenLocaleInRich = locale
        return {
          type: 'shout',
          value: `child:${locale}`,
          toParts: () => [{ type: 'shout', value: `child:${locale}` }],
        }
      },
    }

    function Consumer() {
      const t = useTranslate()
      assert.equal(t.locale, 'uk')
      assert.equal(t('parentOnly'), 'From parent')
      assert.equal(t('shared'), 'From child')
      assert.equal(t('keptFn'), 'kept')
      assert.equal(t('overriddenFn'), 'child:uk')
      assert.equal(typeof t.number(42), 'string')
      assert.equal(typeof t.number(43), 'string')

      return createElement(
        'div',
        null,
        t.rich('richMsg'),
        createElement('span', null, t.rich('overriddenFn')),
      )
    }

    const html = renderToStaticMarkup(
      providerElement(
        {
          locale: 'uk',
          cache: sharedCache,
          messages: {
            parentOnly: 'From parent',
            shared: 'From parent',
            keptFn: fnMessage('keep'),
            overriddenFn: fnMessage('shout'),
            richMsg: {
              parts: () => [
                { type: 'markup', kind: 'open', name: 'b' },
                { type: 'text', value: 'B' },
                { type: 'markup', kind: 'close', name: 'b' },
                { type: 'text', value: ' ' },
                { type: 'markup', kind: 'open', name: 'em' },
                { type: 'text', value: 'E' },
                { type: 'markup', kind: 'close', name: 'em' },
              ],
            },
          },
          functions: parentFunctions,
          components: { b: 'b', em: 'em' },
        },
        providerElement(
          {
            messages: {
              shared: 'From child',
            },
            functions: childFunctions,
            components: { em: 'i' },
          },
          createElement(Consumer),
        ),
      ),
    )

    assert.equal(seenLocale, '')
    assert.equal(seenLocaleInRich, 'uk')
    assert.equal(html, '<div><b>B</b> <i>E</i><span>child:uk</span></div>')
    assert.ok(numberCacheGets >= 2)
    assert.ok(numberCacheSets >= 1)
  })

  await it('Should render markup, nested markup, custom function parts, and empty-parts MessageValue in t.rich()', () => {
    const functions: MessageFunctions = {
      badge: (_ctx, _opts, operand) => {
        const text =
          typeof operand === 'string' || typeof operand === 'number' ? String(operand) : ''
        return {
          type: 'badge',
          value: `[${text}]`,
          toParts: () => [{ type: 'badge', value: `[${text}]` }],
        }
      },
      emptyPartsWithValue: () =>
        ({
          type: 'custom',
          value: 'fallback-value',
          toParts: () => [{ type: 'custom', value: 'fallback-value', parts: [] }],
        }) satisfies MessageValue,
      emptyPartsNoValue: () =>
        ({
          type: 'custom',
          toParts: () => [{ type: 'custom', parts: [] }],
        }) satisfies MessageValue,
    }

    function RichConsumer() {
      const t = useTranslate()
      assert.equal(t('emptyVal'), 'fallback-value')
      assert.equal(t('emptyNoVal'), '')

      return createElement(
        'section',
        null,
        createElement('p', null, t.rich('nested')),
        createElement('p', null, t.rich('withFn', { label: 'new' })),
        createElement('p', null, t.rich('emptyVal')),
        createElement('p', null, t.rich('emptyNoVal')),
      )
    }

    const html = renderToStaticMarkup(
      providerElement(
        {
          locale: 'en',
          messages: {
            nested: {
              parts: () => [
                { type: 'text', value: 'Hello ' },
                { type: 'markup', kind: 'open', name: 'strong' },
                { type: 'markup', kind: 'open', name: 'em' },
                { type: 'text', value: 'world' },
                { type: 'markup', kind: 'close', name: 'em' },
                { type: 'markup', kind: 'close', name: 'strong' },
                { type: 'text', value: '!' },
              ],
            },
            withFn: {
              parts: (v, r) => [
                { type: 'text', value: 'Item: ' },
                ...(r ? rtParts(rtFn(r, 'badge', v?.label)) : []),
              ],
            },
            emptyVal: fnMessage('emptyPartsWithValue'),
            emptyNoVal: fnMessage('emptyPartsNoValue'),
          },
          functions,
          components: { strong: 'strong', em: 'em' },
        },
        createElement(RichConsumer),
      ),
    )

    assert.equal(
      html,
      '<section><p>Hello <strong><em>world</em></strong>!</p><p>Item: [new]</p><p>fallback-value</p><p></p></section>',
    )
  })

  await it('Should omit options from TranslateProviderProps at compile time', () => {
    type AssertNoOptions = 'options' extends keyof TranslateProviderProps ? false : true
    const assertNoOptions: AssertNoOptions = true
    assert.equal(assertNoOptions, true)
  })
})

await describe('defineTranslate', async () => {
  await it('Should render strings and t.rich() and throw on unknown locale', () => {
    const getTranslate = defineTranslate({
      resources: {
        en: {
          greeting: {
            parts: (v) => [
              { type: 'text', value: 'Hi, ' },
              { type: 'markup', kind: 'open', name: 'strong' },
              {
                type: 'text',
                value:
                  typeof v?.name === 'string' || typeof v?.name === 'number' ? String(v.name) : '',
              },
              { type: 'markup', kind: 'close', name: 'strong' },
              { type: 'text', value: '!' },
            ],
          },
        },
      },
      components: { strong: 'strong' },
    })

    const t = getTranslate('en')
    assert.equal(t('greeting', { name: 'Ada' }), 'Hi, Ada!')
    assert.equal(
      renderToStaticMarkup(createElement('p', null, t.rich('greeting', { name: 'Ada' }))),
      '<p>Hi, <strong>Ada</strong>!</p>',
    )

    assert.throws(() => getTranslate('fr'), KanjouReactError)
  })
})
