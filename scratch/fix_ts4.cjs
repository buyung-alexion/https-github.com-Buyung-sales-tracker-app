const fs = require('fs');

function fix(file, replaces) {
    let content = fs.readFileSync(file, 'utf8');
    replaces.forEach(r => content = content.replace(r.from, r.to));
    fs.writeFileSync(file, content);
}

fix('C:/Sales Tracker/src/pages/mobile/ActivityHistory.tsx', [
    {from: /import \{ useState, useEffect \} from 'react';/, to: "import { useState } from 'react';"},
    {from: /ArrowLeft, Search, /, to: ""},
    {from: /const navigate = useNavigate\(\);/, to: ""},
    {from: /import \{ useNavigate \} from 'react-router-dom';/, to: ""},
    {from: /a\.foto_bukti/g, to: "(a as any).foto_bukti"},
    {from: /interface Props \{ salesId: string; \}/, to: "interface Props { salesId: string; onClose?: () => void; }"}
]);

fix('C:/Sales Tracker/src/pages/mobile/CustomerMaintenance.tsx', [
    {from: /import \{ Phone, MessageCircle, FileText, User, Store, Clock, MapPin, Search, Plus, ArrowRight, Activity, Filter, Map, CheckCheck \} from 'lucide-react';/, to: "import { Phone, MessageCircle, FileText, User, Store, Clock, MapPin, Search, Plus, ArrowRight, Activity, Filter } from 'lucide-react';"},
    {from: /const getAreaName =.*?\n/, to: ""},
    {from: /c\.target_penjualan/g, to: "(c as any).target_penjualan"},
    {from: /setEditForm\(\{/g, to: "setEditForm({ ...c,"},
    {from: /nama_pic: c\.nama_pic \|\| '',/g, to: "nama_pic: c.nama_pic || '',"}
]);

fix('C:/Sales Tracker/src/pages/mobile/OrderHistory.tsx', [
    {from: /import \{ useState, useEffect \} from 'react';/, to: "import { useState } from 'react';"},
    {from: /ArrowLeft, /, to: ""},
    {from: /ChevronDown, /, to: ""},
    {from: /ChevronRight, /, to: ""},
    {from: /Edit3, /, to: ""},
    {from: /BarChart2, /, to: ""},
    {from: /FileText, /, to: ""},
    {from: /const navigate = useNavigate\(\);/, to: ""},
    {from: /import \{ useNavigate \} from 'react-router-dom';/, to: ""}
]);

fix('C:/Sales Tracker/src/pages/mobile/ProspectingTool.tsx', [
    {from: /Map, /, to: ""},
    {from: /Phone, /, to: ""},
    {from: /const getAreaName =.*?\n/, to: ""},
    {from: /statusOverride:/g, to: "// statusOverride:"}
]);

console.log("Fixed standard TS errors");
