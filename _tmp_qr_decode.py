import sys
from urllib.parse import quote

files = [r'd:\\项目\\newszgroupapple\\pages\\index\\images\\二维码登录4.png', r'd:\\项目\\newszgroupapple\\pages\\index\\images\\小程序新登录图.png']

try:
    import cv2
    import numpy as np
except Exception as e:
    print('IMPORT_ERROR', repr(e))
    sys.exit(2)

det = cv2.QRCodeDetector()
for f in files:
    print('FILE', f)
    arr = np.fromfile(f, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        print('ERROR read_failed')
        continue
    text, pts, _ = det.detectAndDecode(img)
    if not text:
        print('DECODE FAILED')
        continue
    print('TEXT', text)
    print('FIRST_CODEPOINT', ord(text[0]))
    print('HAS_BOM_PREFIX', text.startswith('\ufeff'))
    b = text.encode('utf-8', errors='replace')
    print('UTF8_HEX_PREFIX', b[:12].hex())
    print('URL_ENCODE_PREFIX', quote(text)[:80])
