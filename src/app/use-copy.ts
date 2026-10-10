import { dictionaries } from '../i18n/dictionary'
import { defaultSettings } from '../storage/types'
import { interfaceLang } from './labels'
import { useApp } from './state'

export function useCopy() {
  const { snapshot } = useApp()
  const settings = snapshot?.settings ?? defaultSettings
  return dictionaries[interfaceLang(settings)]
}

export function useSettings() {
  const { snapshot } = useApp()
  return snapshot?.settings ?? defaultSettings
}
