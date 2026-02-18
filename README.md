# gnome-clipboard-signaler

A minimal GNOME Shell extension that emits D-Bus signals when the clipboard
changes.

> [!NOTE]
> This extension was written entirely by AI. The code itself is trivial, but
> also I don't know GNOME Shell extensions so I can't review it meaningfully
> other than to confirm it works.

## Motivation

In GNOME/mutter, there's no way for things outside of GNOME Shell to watch for
clipboard events. So this bridges that gap by adding a proxy on D-Bus. See also
https://gitlab.gnome.org/GNOME/mutter/-/issues/524.

## D-Bus Interface

- **Bus name:** `dev.local.ClipboardSignaler`
- **Object path:** `/dev/local/ClipboardSignaler`
- **Interface:** `dev.local.ClipboardSignaler`
- **Signal:** `Changed(s type, s text)` where `type` is `"clipboard"` or `"primary"`

## Installation

```sh
gnome-extensions pack -f .
gnome-extensions install -f clipboard-signaler@dev.local.shell-extension.zip
```

Then reboot/soft-reboot your computer and enable:

```sh
gnome-extensions enable clipboard-signaler@dev.local
```

## Listening for signals

```sh
busctl --user monitor dev.local.ClipboardSignaler
```

Or:

```sh
gdbus monitor --session --dest dev.local.ClipboardSignaler \
  --object-path /dev/local/ClipboardSignaler
```

## Compatibility

GNOME Shell 46, 47, 48, 49.
