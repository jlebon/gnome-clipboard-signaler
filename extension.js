import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import St from "gi://St";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

const BUS_NAME = "dev.local.ClipboardSignaler";
const OBJECT_PATH = "/dev/local/ClipboardSignaler";
const IFACE_NAME = "dev.local.ClipboardSignaler";

const IFACE_XML = `
<node>
  <interface name="${IFACE_NAME}">
    <signal name="Changed">
      <arg name="type" type="s"/>
      <arg name="text" type="s"/>
    </signal>
  </interface>
</node>`;

const Clipboard = St.Clipboard.get_default();
const ifaceInfo = Gio.DBusNodeInfo.new_for_xml(IFACE_XML).interfaces[0];

export default class ClipboardSignaler extends Extension {
  enable() {
    this._busId = Gio.bus_own_name(
      Gio.BusType.SESSION,
      BUS_NAME,
      Gio.BusNameOwnerFlags.NONE,
      this._onBusAcquired.bind(this),
      null,
      null,
    );

    this._lastText = { clipboard: null, primary: null };

    const selection = Shell.Global.get().get_display().get_selection();
    this._selection = selection;
    this._selectionChangedId = selection.connect(
      "owner-changed",
      (_, selectionType) => {
        if (selectionType === Meta.SelectionType.SELECTION_CLIPBOARD) {
          this._onClipboardChanged("clipboard");
        } else if (selectionType === Meta.SelectionType.SELECTION_PRIMARY) {
          this._onClipboardChanged("primary");
        }
      },
    );
  }

  disable() {
    if (this._selectionChangedId) {
      this._selection.disconnect(this._selectionChangedId);
      this._selection = null;
      this._selectionChangedId = null;
      this._lastText = null;
    }

    if (this._exportId) {
      this._connection.unregister_object(this._exportId);
      this._exportId = null;
      this._connection = null;
    }

    if (this._busId) {
      Gio.bus_unown_name(this._busId);
      this._busId = null;
    }
  }

  _onBusAcquired(connection) {
    this._connection = connection;
    this._exportId = connection.register_object(
      OBJECT_PATH,
      ifaceInfo,
      null,
      null,
      null,
    );
  }

  _onClipboardChanged(type) {
    const clipType =
      type === "clipboard"
        ? St.ClipboardType.CLIPBOARD
        : St.ClipboardType.PRIMARY;

    Clipboard.get_text(clipType, (_, text) => {
      if (text === null || !this._connection) return;
      if (text === this._lastText[type]) return;
      this._lastText[type] = text;
      this._connection.emit_signal(
        null,
        OBJECT_PATH,
        IFACE_NAME,
        "Changed",
        new GLib.Variant("(ss)", [type, text]),
      );
    });
  }
}
