# -*- coding: utf-8 -*-
import io
p = "build_resume.py"
s = io.open(p, encoding="utf-8").read()
subs = [("LINE = 1.08", "LINE = 1.03"),
        ("sec.top_margin = Cm(1.25)", "sec.top_margin = Cm(1.2)"),
        ("sec.bottom_margin = Cm(1.0)", "sec.bottom_margin = Cm(0.85)")]
for a, b in subs:
    assert a in s, a
    s = s.replace(a, b)
io.open(p, "w", encoding="utf-8").write(s)
print("patched")
