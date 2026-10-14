import { useHomeScreen } from '../pwa/use-home-screen'

export function AddToHomeScreen({ label, iosHint }: { label: string; iosHint: string }) {
  const { offer, prompt } = useHomeScreen()
  if (offer === 'hidden') return null
  if (offer === 'ios') {
    return (
      <div data-testid="add-home">
        <p>{label}</p>
        <p className="hint">{iosHint}</p>
      </div>
    )
  }
  return (
    <button type="button" data-testid="add-home" onClick={() => void prompt()}>
      {label}
    </button>
  )
}
