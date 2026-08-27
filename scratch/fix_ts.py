import re

with open(r'C:\Sales Tracker\src\pages\mobile\DashboardTarget.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import \{ useState, useEffect \} from \'react\';\n', '', content)
content = re.sub(r'import \{ Trophy, Menu, ChevronLeft, ChevronRight, Clock \} from \'lucide-react\';', 'import { Trophy, Menu, ChevronLeft } from \'lucide-react\';', content)
content = re.sub(r'<ChevronRight[^\>]*>', '', content)
content = re.sub(r'<Clock[^\>]*>', '', content)

with open(r'C:\Sales Tracker\src\pages\mobile\DashboardTarget.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open(r'C:\Sales Tracker\src\pages\mobile\HomepageV3.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import \{ useState, useEffect \} from \'react\';\n', '', content)
content = re.sub(r'import \{ Bell, ', 'import { ', content)
content = re.sub(r'const salesAchievedPct =.*?\n', '', content)
content = re.sub(r'const activityAchievedPct =.*?\n', '', content)

with open(r'C:\Sales Tracker\src\pages\mobile\HomepageV3.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
