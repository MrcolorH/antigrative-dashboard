# Antigrative Dashboard v0.8.7

## Support modern Antigravity v2.34.0+ and credential discovery

- **Antigravity v2.34.0+ Compatibility**: Antigravity no longer passes `--csrf_token` via `language_server` command-line flags. Dashboard now discovers the active HTTP/HTTPS ports and CSRF token from the daemon Hub descriptor file (`~/.gemini/<app_data_dir>/daemon/hub_*.json`), with correlation to the running PID and owned ports.
- **Full Backwards Compatibility**: Legacy command-line flag discovery remains intact as a fallback for older Antigravity versions (2.21.x / 2.22.x).
- **IDE Adapter Parity**: Standalone Antigravity IDE adapter also gains daemon Hub discovery when `--csrf_token` is absent from process arguments.
- **Streamlined Metric Cards**: Simplified context card and token/cache card layouts with clean typography, responsive layout, and zero noise.

## Downloads and update

- Desktop App / CLI: `antigrative-dashboard-0.8.7.zip` and `.zip.sha256`. Verify, extract, and run `python manage.py install` for App, or `python manage.py install-cli` for CLI; Linux/macOS use `python3`.
- Standalone Antigravity IDE: `antigrative-dashboard-ide-0.8.7.vsix` and `.vsix.sha256`. Install from VSIX and retain the documented debugging launch flags.

Fully quit and reopen the host after installation so the updated collector loads. Saved language preferences, conversation statistics and usage records are retained. Both App and IDE include the shared fix; CLI accounting is unchanged.

## Verification

Regression coverage includes modern daemon hub file parsing, PID/port correlation, fallback handling when log files or daemon files are missing, and full test suite passing on macOS, Linux, and Windows.
