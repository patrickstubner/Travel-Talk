#!/usr/bin/env bash
# Idempotentes Install-Skript für Cursor Cloud Agent VMs.
# Aufruf aus der Repo-Wurzel: bash .cursor/install-dev-tools.sh
# Kein curl|bash, keine Secrets, keine Agent-Configs ändern.
# Weitere Tools: unten im Block «Weitere Tools (Erweiterung)» Version, URL und SHA-256 ergänzen.
set -euo pipefail

ROOT="$(pwd)"
PREFIX="${HOME}/.local"
BIN="${PREFIX}/bin"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$BIN"
export PATH="${BIN}:${PATH}"

# --- Gepinnte Versionen (offizielle GitHub-Releases, Stand der Box 15./16.11.2026) ---
RG_VERSION="14.1.1"
RG_URL="https://github.com/BurntSushi/ripgrep/releases/download/14.1.1/ripgrep-14.1.1-x86_64-unknown-linux-musl.tar.gz"
RG_SHA256="4cf9f2741e6c465ffdb7c26f38056a59e2a2544b51f7cc128ef28337eeae4d8e"

ASTGREP_VERSION="0.51.2"
ASTGREP_URL="https://github.com/ast-grep/ast-grep/releases/download/0.51.2/app-x86_64-unknown-linux-musl.zip"
ASTGREP_SHA256="7263b2f3dbfa4a4ae4512932ffa75ccd86451db17646bd1640a4b21e4b3558d8"

CBM_VERSION="0.12.1"
CBM_SUMS_URL="https://github.com/DeusData/codebase-memory-mcp/releases/download/v0.12.1/checksums.txt"
CBM_SUMS_SHA256="103ddf75ccbe4e4de9faa57f074ee5f16b88edab6fd2f7dfd34e50d147dddffe"
CBM_ARCHIVE="codebase-memory-mcp-linux-amd64-portable.tar.gz"
CBM_URL="https://github.com/DeusData/codebase-memory-mcp/releases/download/v0.12.1/${CBM_ARCHIVE}"
CBM_SHA256="8c3d0341064301e78ecc84cf7348d4e2c6562a0f57448243ea560aaa34de36c1"

download_https() {
  local url="$1" dest="$2"
  case "$url" in
    https://*) ;;
    *) echo "error: nur HTTPS erlaubt: $url" >&2; return 1 ;;
  esac
  curl -fsSL --proto '=https' --proto-redir '=https' --max-redirs 5 --retry 3 --retry-delay 2 -o "$dest" "$url"
}

verify_sha256() {
  local file="$1" expected="$2"
  local actual
  actual="$(sha256sum "$file" | awk '{print $1}')"
  if [[ "$actual" != "$expected" ]]; then
    echo "error: Prüfsumme stimmt nicht für $file" >&2
    echo "erwartet: $expected" >&2
    echo "ist:      $actual" >&2
    return 1
  fi
}

install_binary() {
  local src="$1" name="$2"
  install -m 0755 "$src" "${BIN}/${name}"
  if sudo -n true 2>/dev/null && [[ -d /usr/local/bin ]]; then
    sudo -n install -m 0755 "$src" "/usr/local/bin/${name}" || true
  fi
}

ensure_path() {
  local line='export PATH="$HOME/.local/bin:$PATH"'
  local marker='# cursor-cloud-dev-tools'
  for rc in "${HOME}/.profile" "${HOME}/.bashrc"; do
    if [[ -f "$rc" ]] && grep -q 'cursor-cloud-dev-tools' "$rc"; then
      continue
    fi
    printf '\n%s\n%s\n' "$marker" "$line" >> "$rc"
  done
}

tool_ok() {
  local cmd="$1" version="$2"
  command -v "$cmd" >/dev/null 2>&1 || return 1
  "$cmd" --version 2>/dev/null | grep -Fq "$version"
}

extract_named_bin() {
  # $1=archive dir root, $2=desired name
  find "$1" -type f -name "$2" ! -name '*.md' ! -name '*.txt' | head -n 1
}

# --- ripgrep ---
if tool_ok rg "$RG_VERSION"; then
  echo "ripgrep ${RG_VERSION} bereits vorhanden, übersprungen."
else
  echo "Installiere ripgrep ${RG_VERSION}…"
  download_https "$RG_URL" "${TMP}/rg.tar.gz"
  verify_sha256 "${TMP}/rg.tar.gz" "$RG_SHA256"
  mkdir -p "${TMP}/rg"
  tar -xzf "${TMP}/rg.tar.gz" -C "${TMP}/rg"
  RG_BIN="$(extract_named_bin "${TMP}/rg" rg)"
  [[ -n "$RG_BIN" && -x "$RG_BIN" ]] || { echo "error: rg nicht im Archiv" >&2; exit 1; }
  install_binary "$RG_BIN" rg
fi

# --- ast-grep (Befehl ast-grep, nicht sg) ---
if tool_ok ast-grep "$ASTGREP_VERSION"; then
  echo "ast-grep ${ASTGREP_VERSION} bereits vorhanden, übersprungen."
else
  echo "Installiere ast-grep ${ASTGREP_VERSION}…"
  download_https "$ASTGREP_URL" "${TMP}/ast-grep.zip"
  verify_sha256 "${TMP}/ast-grep.zip" "$ASTGREP_SHA256"
  mkdir -p "${TMP}/ast-grep"
  python3 -c '
import zipfile
from pathlib import Path
dest = Path("'"${TMP}/ast-grep"'")
with zipfile.ZipFile("'"${TMP}/ast-grep.zip"'") as zf:
    for info in zf.infolist():
        name = Path(info.filename).name
        if name in {"ast-grep", "sg"} and not info.is_dir():
            target = dest / name
            target.write_bytes(zf.read(info))
            target.chmod(0o755)
'
  if [[ -x "${TMP}/ast-grep/ast-grep" ]]; then
    install_binary "${TMP}/ast-grep/ast-grep" ast-grep
  elif [[ -x "${TMP}/ast-grep/sg" ]]; then
    install_binary "${TMP}/ast-grep/sg" ast-grep
  else
    echo "error: ast-grep nicht im Archiv" >&2
    exit 1
  fi
fi

# --- codebase-memory-mcp (portable Linux-Build, ohne offizielles install.sh) ---
if tool_ok codebase-memory-mcp "$CBM_VERSION"; then
  echo "codebase-memory-mcp ${CBM_VERSION} bereits vorhanden, übersprungen."
else
  echo "Installiere codebase-memory-mcp ${CBM_VERSION}…"
  download_https "$CBM_SUMS_URL" "${TMP}/checksums.txt"
  verify_sha256 "${TMP}/checksums.txt" "$CBM_SUMS_SHA256"
  if ! awk -v f="$CBM_ARCHIVE" -v h="$CBM_SHA256" '$2==f && $1==h {found=1} END{exit found?0:1}' "${TMP}/checksums.txt"; then
    echo "error: Archiv-Hash steht so nicht in checksums.txt" >&2
    exit 1
  fi
  download_https "$CBM_URL" "${TMP}/${CBM_ARCHIVE}"
  verify_sha256 "${TMP}/${CBM_ARCHIVE}" "$CBM_SHA256"
  mkdir -p "${TMP}/cbm"
  tar -xzf "${TMP}/${CBM_ARCHIVE}" -C "${TMP}/cbm"
  CBM_BIN="$(extract_named_bin "${TMP}/cbm" codebase-memory-mcp)"
  [[ -n "$CBM_BIN" && -x "$CBM_BIN" ]] || { echo "error: codebase-memory-mcp nicht im Archiv" >&2; exit 1; }
  install_binary "$CBM_BIN" codebase-memory-mcp
fi

# UI und Auto-Index aus (keine Netz-Modelle, keine Agent-Configs).
# Nicht «codebase-memory-mcp install» oder «update» ausführen.
codebase-memory-mcp --ui=false >/dev/null 2>&1 || true
codebase-memory-mcp config set ui_enabled false >/dev/null
codebase-memory-mcp config set auto_index false >/dev/null

# --- Repo-Abhängigkeiten ---
if [[ -f "${ROOT}/package-lock.json" ]]; then
  if ! command -v node >/dev/null 2>&1; then
    echo "error: Node.js fehlt. Travel Talk braucht Node 22 (engines: >=22). Node nicht in diesem Skript nachinstallieren." >&2
    exit 1
  fi
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [[ "$NODE_MAJOR" -lt 22 ]]; then
    echo "error: Node ${NODE_MAJOR} ist zu alt, nötig ist >= 22." >&2
    exit 1
  fi
  echo "Installiere npm-Abhängigkeiten mit npm ci --ignore-scripts…"
  npm ci --ignore-scripts
else
  echo "Kein package-lock.json, npm ci übersprungen."
fi

# --- Index bauen (gehört zum Build-Snapshot) ---
echo "Baue codebase-memory-mcp Index für ${ROOT}…"
codebase-memory-mcp cli --quiet index_repository "{\"repo_path\":\"${ROOT}\"}"
codebase-memory-mcp cli --quiet list_projects '{}' || true

# --- Weitere Tools (Erweiterung) ---
# Beispiel: weiteres CLI mit gepinnter Version und SHA-256 hier ergänzen,
# analog zu ripgrep/ast-grep. Keine unversionierten npm-i -g / uv tool install
# ohne Pin und Prüfung. Kein curl|bash.

ensure_path

echo "Fertig. Werkzeuge:"
rg --version | head -n 1
ast-grep --version
codebase-memory-mcp --version
