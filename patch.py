import os, re, shutil

SRC, BAK = "dino.html", "dino.html.bak"

# Always rebuild from the untouched original, so re-running is safe.
# (To start from a new version of the game, delete dino.html.bak first.)
if not os.path.exists(BAK):
    shutil.copy(SRC, BAK)
html = open(BAK, encoding="utf-8").read()

# Blank the "Press space to play" / "Tap to play" heading text
INSTRUCTIONS = re.compile(r'("dinoGameInstructions(?:Touch|Keyboard|Hybrid)"\s*:\s*)"[^"]*"')

count = 0
def extract(match):
    global count
    attrs, body = match.group(1), match.group(2)
    if "src=" in attrs or not body.strip():
        return match.group(0)  # leave external/empty scripts alone
    count += 1
    body = INSTRUCTIONS.sub(r'\1""', body)
    name = f"dino-{count}.js"
    with open(name, "w", encoding="utf-8") as f:
        f.write(body.strip() + "\n")
    return f'<script src="{name}"></script>'

html = re.sub(r"<script([^>]*)>(.*?)</script>", extract, html,
              flags=re.DOTALL | re.IGNORECASE)

# Load our own scripts last, just before the final </body>
tag = ('<script src="highscore.js"></script>\n'
       '<script src="offline-info.js"></script>\n')
i = html.rfind("</body>")
html = html[:i] + tag + html[i:]

with open(SRC, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Extracted {count} inline script(s). Original kept as {BAK}.")
