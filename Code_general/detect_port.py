import os
Import("env")
import serial.tools.list_ports

def get_esp_port():
    ports = list(serial.tools.list_ports.comports())
    
    # 1. Recherche prioritaire des convertisseurs USB-Série connus (CH340, CP210x, FTDI, ESP CDC)
    for p in ports:
        hwid = (p.hwid or "").upper()
        desc = (p.description or "").upper()
        if "BTHENUM" in hwid or "BLUETOOTH" in desc:
            continue
        if any(chip in desc for chip in ["CH340", "CP210", "FTDI", "UART", "USB-SERIAL", "ESPRESSIF", "CH341"]) or \
           any(vid in hwid for vid in ["1A86", "10C4", "0403", "303A"]):
            return p.device, p.description

    # 2. Deuxième passe : n'importe quel port série USB non-Bluetooth
    for p in ports:
        hwid = (p.hwid or "").upper()
        desc = (p.description or "").upper()
        if "BTHENUM" in hwid or "BLUETOOTH" in desc:
            continue
        if "USB" in hwid or "VID" in hwid:
            return p.device, p.description

    return None, None

detected_port, desc = get_esp_port()
if detected_port:
    print(f"[AutoPort] ESP32 d\xe9tect\xe9 automatiquement sur {detected_port} ({desc})")
    env.Replace(UPLOAD_PORT=detected_port)
    env.Replace(MONITOR_PORT=detected_port)
else:
    # Si aucun port USB n'est détecté, on laisse PlatformIO utiliser son scan natif
    print("[AutoPort] Aucun port USB-S\xe9rie d\xe9tect\xe9 pour l'instant (les ports Bluetooth ont \xe9t\xe9 ignor\xe9s).")

