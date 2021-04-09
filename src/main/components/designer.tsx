import { define, createRef, h } from 'js-element'
import { useEffect } from 'js-element/hooks'
import { createMobxHooks } from 'js-element/utils'
import { makeObservable, action, computed, observable } from 'mobx'
import Color from 'color'
import { AppLayout, HLayout, VLayout } from './layouts'
import { Text } from './typography'
import { Customizing } from '../theming/types'

import {
  createCustomizedTheme,
  fromThemeToCss,
  fromThemeToJson,
  serializeCustomization
} from '../theming/theme-utils'

import {
  getBaseThemeById,
  getBaseThemeNameById,
  getAllBaseThemeIds
} from '../theming/base-themes'

import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js'
import SlButton from '@shoelace-style/shoelace/dist/components/button/button.js'
import SlIcon from '@shoelace-style/shoelace/dist/components/icon/icon.js'
import SlColorPicker from '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js'
import SlInput from '@shoelace-style/shoelace/dist/components/input/input.js'
import SlTab from '@shoelace-style/shoelace/dist/components/tab/tab.js'
import SlTabGroup from '@shoelace-style/shoelace/dist/components/tab-group/tab-group'
import SlTabPanel from '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel'
import { Showcases } from './showcases'

// === exports =======================================================

export { Designer }

// === store ==========================================================

const defaultTheme = getBaseThemeById('light')

class Store {
  baseThemeId = 'light'
  shareThemeMessageVisible = false
  exportDrawerVisible = false

  customizing: Customizing = {
    colorPrimary: defaultTheme['color-primary-500'],
    colorSuccess: defaultTheme['color-success-500'],
    colorInfo: defaultTheme['color-info-500'],
    colorWarning: defaultTheme['color-warning-500'],
    colorDanger: defaultTheme['color-danger-500'],
    colorFront: defaultTheme['color-black'],
    colorBack: defaultTheme['color-white'],

    textPrimary: 'default',
    textInfo: 'default',
    textSuccess: 'default',
    textWarning: 'default',
    textDanger: 'default',

    inverted: false
  }

  get customizedTheme() {
    return createCustomizedTheme(
      this.customizing,
      getBaseThemeById(this.baseThemeId)
    )
  }

  get customizedCss() {
    return fromThemeToCss(this.customizedTheme)
  }

  get customizedJson() {
    return fromThemeToJson(this.customizedTheme)
  }

  constructor() {
    makeObservable(this, {
      baseThemeId: observable,
      customizedCss: computed,
      customizedJson: computed,
      customizedTheme: computed,
      customize: action,
      customizing: observable.ref,
      invertTheme: action,
      resetTheme: action,
      setBaseThemeId: action,
      setExportDrawerVisible: action,
      setShareThemeMessageVisible: action,
      shareThemeMessageVisible: observable,
      exportDrawerVisible: observable
    })
  }

  setBaseThemeId(id: string) {
    this.baseThemeId = id
  }

  setShareThemeMessageVisible(value: boolean) {
    this.shareThemeMessageVisible = value
  }

  setExportDrawerVisible(value: boolean) {
    this.exportDrawerVisible = value
  }

  customize(values: Partial<Customizing>) {
    this.customizing = Object.assign({}, this.customizing, values)
  }

  invertTheme() {
    const colorFront = this.customizing.colorFront
    const colorBack = this.customizing.colorBack

    this.customizing = {
      ...this.customizing,
      colorFront: colorBack,
      colorBack: colorFront,
      inverted: !this.customizing.inverted
    }
  }

  resetTheme() {
    const baseTheme = getBaseThemeById(this.baseThemeId)

    this.customizing = {
      colorPrimary: baseTheme['color-primary-500'],
      colorSuccess: baseTheme['color-success-500'],
      colorInfo: baseTheme['color-info-500'],
      colorWarning: baseTheme['color-warning-500'],
      colorDanger: baseTheme['color-danger-500'],
      colorFront: baseTheme['color-black'],
      colorBack: baseTheme['color-white'],

      textPrimary: 'default',
      textInfo: 'default',
      textSuccess: 'default',
      textWarning: 'default',
      textDanger: 'default',

      inverted: false
    }
  }

  copyToClipboard() {
    const base64String = serializeCustomization({
      baseThemeId: this.baseThemeId,
      customizing: this.customizing
    })

    const url = `${location.href.split('#')[0]}#${base64String}`
    navigator.clipboard.writeText(url)
  }
}

// === store hooks ===================================================

const [useStoreProvider, useStore] = createMobxHooks<Store>()

// === components =====================================================

const Designer = define({
  name: 'sx-designer',
  slots: ['showcases'],
  styles: () => styles.designer,
  uses: [SlAlert],

  props: class {
    initialBaseThemeId?: string
    initialCustomizing?: Customizing
  }
}).main((p) => {
  const store = useStoreProvider(new Store())

  if (p.initialBaseThemeId) {
    store.setBaseThemeId(p.initialBaseThemeId)
  }

  if (p.initialCustomizing) {
    store.customize(p.initialCustomizing)
  }

  return () => (
    <div>
      <style>
        {':host {'}
        {store.customizedCss}
        font-family: var(--sl-font-sans); color: var(--sl-color-black);
        {'}'}
      </style>
      <ThemeExportDrawer />
      <AppLayout>
        <div
          slot="header"
          class={
            Color(store.customizing.colorBack).isDark()
              ? 'header'
              : 'header header-with-shadow'
          }
        >
          <Header />
        </div>
        <div slot="sidebar" class="sidebar">
          <Sidebar />
        </div>
        <div slot="main" class="showcases">
          <sl-alert
            class="share-theme-message"
            type="success"
            open={store.shareThemeMessageVisible}
          >
            <sl-icon slot="icon" name="check2-circle"></sl-icon>
            URL has been copied to clipboard
          </sl-alert>
          <Showcases />
        </div>
      </AppLayout>
    </div>
  )
})

const Header = define({
  name: 'sx-designer--header',
  uses: [SlIcon, SlButton],
  styles: () => styles.header
}).main(() => {
  const store = useStore()

  const onShareClick = () => {
    store.copyToClipboard()
    store.setShareThemeMessageVisible(true)

    setTimeout(() => {
      store.setShareThemeMessageVisible(false)
    }, 2000)
  }

  const onExportClick = () => {
    if (!store.exportDrawerVisible) {
      store.setExportDrawerVisible(true)
    }
  }

  return () => (
    <div class="base">
      <div class="brand">Shoelace Theme Designer</div>
      <div class="actions">
        <HLayout gap="small">
          <sl-button type="default" onclick={onShareClick}>
            Share theme
          </sl-button>
          <sl-button type="default" onclick={onExportClick}>
            Export theme
          </sl-button>
        </HLayout>
      </div>
    </div>
  )
})

const Sidebar = define({
  name: 'sx-designer--sidebar',
  styles: () => styles.sidebar
}).main(() => {
  const store = useStore()
  const invertTheme = () => store.invertTheme()
  const resetTheme = () => store.resetTheme()

  const onBaseThemeChange = (ev: any) => {
    const selectedBaseThemeId = ev.target.value

    if (store.baseThemeId === selectedBaseThemeId) {
      return
    }

    store.setBaseThemeId(selectedBaseThemeId)
    store.resetTheme()
  }

  return () => {
    const customizing = store.customizing

    const createColorListener = (type: string) => {
      return (ev: any) => {
        const newCustomizing: any = { ...customizing }
        newCustomizing[type] = ev.detail.value
        store.customize(newCustomizing)
      }
    }

    return (
      <VLayout class="base">
        <br />
        <HLayout gap="small">
          <Text>Base theme:</Text>
          <sl-select
            class="theme-selector"
            onsl-change={onBaseThemeChange}
            value={store.baseThemeId}
          >
            {getAllBaseThemeIds().map((id) => (
              <sl-menu-item value={id}>{getBaseThemeNameById(id)}</sl-menu-item>
            ))}
          </sl-select>
        </HLayout>
        <sl-tab-group class="sidebar-tabs">
          <sl-tab slot="nav" panel="theme-colors">
            Theme colors
          </sl-tab>
          <sl-tab slot="nav" panel="text-colors">
            Text colors
          </sl-tab>
          <sl-tab-panel name="theme-colors">
            <VLayout>
              <ColorControl
                colorName="primary"
                label="Primary color"
                value={customizing.colorPrimary}
              />
              <ColorControl
                colorName="info"
                label="Info color"
                value={customizing.colorInfo}
              />
              <ColorControl
                colorName="success"
                label="Success color"
                value={customizing.colorSuccess}
              />
              <ColorControl
                colorName="warning"
                label="Warning color"
                value={customizing.colorWarning}
              />
              <ColorControl
                colorName="danger"
                label="Danger color"
                value={customizing.colorDanger}
              />
              <ColorControl
                colorName="front"
                label="Front color"
                value={customizing.colorFront}
              />
              <ColorControl
                colorName="back"
                label="Back color"
                value={customizing.colorBack}
              />
            </VLayout>
          </sl-tab-panel>
          <sl-tab-panel name="text-colors">
            <VLayout gap="small">
              <Text size="small">
                Please select whether the default text colors shall be used or
                whether front or back color shall be enforced instead.
              </Text>
              <br />
              <TextColorControl
                colorName="primary"
                label="Primary text"
                value={customizing.textPrimary}
              />
              <TextColorControl
                colorName="info"
                label="Info text"
                value={customizing.textInfo}
              />
              <TextColorControl
                colorName="success"
                label="Success text"
                value={customizing.textSuccess}
              />
              <TextColorControl
                colorName="warning"
                label="Warning text"
                value={customizing.textWarning}
              />
              <TextColorControl
                colorName="danger"
                label="Danger text"
                value={customizing.textDanger}
              />
            </VLayout>
          </sl-tab-panel>
        </sl-tab-group>
        <HLayout class="color-actions" gap="small">
          <sl-button onclick={invertTheme}>Invert theme</sl-button>
          <sl-button onclick={resetTheme}>Reset theme</sl-button>
        </HLayout>
      </VLayout>
    )
  }
})

const ColorControl = define({
  name: 'sx-designer--color-field',
  uses: [SlColorPicker, SlInput],
  styles: () => styles.colorControl,

  props: class {
    label?: string
    value?: string

    colorName?:
      | 'primary'
      | 'info'
      | 'success'
      | 'warning'
      | 'danger'
      | 'front'
      | 'back'
  }
}).main((p) => {
  const store = useStore()

  const onChange = (ev: any) => {
    if (p.colorName) {
      const propName =
        'color' + p.colorName[0].toUpperCase() + p.colorName.substr(1)

      store.customize({ [propName]: ev.target.value })
    }
  }

  return () => (
    <HLayout>
      <label>{p.label}:</label>
      <span>{p.value}</span>
      <sl-color-picker
        format="hex"
        no-format-toggle
        size="small"
        value={p.value}
        hoist
        onsl-change={onChange}
      ></sl-color-picker>
    </HLayout>
  )
})

const TextColorControl = define({
  name: 'sx-designer--text-color-control',
  styles: () => styles.textColorControl,

  props: class {
    colorName?: string
    label?: string
    value?: 'default' | 'back' | 'front'
  }
}).main((p) => {
  const store = useStore()

  const onChange = (ev: any) => {
    if (p.colorName) {
      const propName =
        'text' + p.colorName[0].toUpperCase() + p.colorName.substr(1)

      store.customize({ [propName]: ev.target.value })
    }
  }

  return () => {
    return (
      <HLayout>
        <label class="label">{p.label}:</label>
        <sl-select value={p.value} size="small" onsl-change={onChange}>
          <sl-menu-item value="default">default</sl-menu-item>
          <sl-menu-item value="back">back color</sl-menu-item>
          <sl-menu-item value="front">front color</sl-menu-item>
        </sl-select>
      </HLayout>
    )
  }
})

const ThemeExportDrawer = define({
  name: 'sx-designer--theme-export-drawer',
  uses: [SlTab, SlTabGroup, SlTabPanel],
  styles: () => styles.themeExportDrawer
}).main(() => {
  const store = useStore()
  const drawerRef = createRef<any>()
  const closeDrawer = () => store.setExportDrawerVisible(false)

  useEffect(
    () => {
      if (!drawerRef.current) {
        return
      }

      if (store.exportDrawerVisible) {
        drawerRef.current!.show()
      } else {
        drawerRef.current!.hide()
      }
    },
    () => [store.exportDrawerVisible]
  )

  return () => (
    <sl-drawer
      id="drawer"
      label="Export theme"
      class="drawer"
      open={store.exportDrawerVisible}
      onsl-hide={closeDrawer}
    >
      <sl-tab-group>
        <sl-tab slot="nav" panel="css">
          CSS properties
        </sl-tab>
        <sl-tab slot="nav" panel="json">
          JSON
        </sl-tab>
        <sl-tab-panel name="css">
          <pre>{store.customizedCss}</pre>
        </sl-tab-panel>
        <sl-tab-panel name="json">
          <pre>{store.customizedJson}</pre>
        </sl-tab-panel>
      </sl-tab-group>
      <sl-button slot="footer" type="primary" onclick={closeDrawer}>
        Close
      </sl-button>
    </sl-drawer>
  )
})

// === styles ========================================================

const styles = {
  designer: `
    :host {
      position: absolute;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      margin: 0;
      overflow: hidden;
    }

    .base {
      color: var(--sl-color-black);
      background-color: var(--sl-color-white);
    }

    .header {
      padding: 5px 10px 6px 10px;
      height: 51px;
      width: 100%;
      box-sizing: border-box;
      border-width: 0 0 1px 0;
      border-style: solid;
      border-color: var(--sl-color-gray-200);
      background-color: var(--sl-color-white);
    }

    .header-with-shadow {
      box-shadow: var(--sl-color-gray-300) 0px 8px 24px;
    }

    .sidebar {
      height: 100%;
      padding: 10px 30px 10px 20px;
      box-sizing: border-box;
      border: 1px solid var(--sl-color-gray-200);
      border-width: 0 1px 0 0;
      background-color: var(--sl-color-white);
    }

    .share-theme-message {
      position: fixed;
      top: 3.5em;
      right: 2em;
      display: inline-block;
      width: 19em;
      text-align: right;
      z-index: 20000;
    }

    .showcases {
      position: relative;
      padding: 10px 30px;
      background-color: var(--sl-color-white);
    }
  `,

  header: `
    .base {
      position: relative;
      display: flex;
      align-items: center;
    }

    .brand {
      font-weight: normal;
      font-size: var(--sl-font-size-large);
      background-image: url('https://www.svgrepo.com/show/221575/pantone-color-palette.svg');
      background-repeat: no-repeat;
      padding: 0 0 0 38px;
      flex-grow: 1;
    }
  `,

  sidebar: `
    .base {
      color: var(--sl-color-black)
    }

    .theme-selector {
      width: 12em;
    }

    .sidebar-tabs {
      margin-top: 1.5em;
      width: 18em;
      height: 370px;
    }

    .color-actions {
      margin: 10px 18px 0 0;
      text-align: right;
    }
  `,

  colorControl: `
    label {
      width: 9em;
      height: 2.3em;
      padding: 0 0 0 0.5em;
    }

    span {
      width: 4.5em;
    }

    sl-color-picker {
      margin-top: -4px;
    }
  `,

  textColorControl: `
    .label {
      margin: 0 0 0 1em;
      width: 7em;
    }

    sl-select {
      width: 8em;
    }
  `,

  themeExportDrawer: `
    .drawer {
      --size: 500px;
    }

    pre {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      right 0;
      height: 500px;
      width: 100%;
      overflow: auto; 
      border: 1px solid var(--sl-color-gray-400);
    }
  `
}
