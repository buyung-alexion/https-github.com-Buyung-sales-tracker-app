
const fs = require('fs');
let file = 'C:/Sales Tracker/src/pages/mobile/HomepageV3.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'import { Search, MapPin, MessageSquare, BarChart3, Users, Target, Clock, Trophy, Menu, ChevronLeft, ChevronRight, Timer } from \\'lucide-react\\';',
  'import { Search, MapPin, MessageSquare, BarChart3, Users, Target, Clock, Trophy, Menu, ChevronLeft, ChevronRight, Timer, ShoppingCart } from \\'lucide-react\\';'
);
fs.writeFileSync(file, content);
console.log('HomepageV3 fixed');

