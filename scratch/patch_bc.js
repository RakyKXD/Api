const fs = require('fs');
const file = 'public/assets/bc09a629f509a816.js';
let c = fs.readFileSync(file, 'utf8');

const target1 = '(0,p.jsx)(eg.$,{variant:"primary",text:el.intl.string(el.t.ElKTeb),onClick:function(){cI.open()},disabled:!o})';
const repl1 = '(0,p.jsx)(eg.$,{variant:"primary",text:el.intl.string(el.t.ElKTeb),onClick:async function(){try{let f=new Set(t.features||[]);f.add(ei.GuildFeatures.COMMUNITY);let ch=Array.from(f);let rules=t.rulesChannelId||t.systemChannelId||null;let updates=t.publicUpdatesChannelId||t.systemChannelId||null;await et.A.saveGuild(t.id,{features:ch,rulesChannelId:rules,publicUpdatesChannelId:updates},{throwErr:!0});et.A.updateGuild({features:f,rulesChannelId:rules,publicUpdatesChannelId:updates})}catch(err){console.error("Error activating community:",err)}},disabled:!1})';

const target2 = 'className:cS.vK,ref:e=>a(e)';
const repl2 = 'className:cS.vK,style:{pointerEvents:"none"},ref:e=>a(e)';

c = c.replace(target1, repl1).replace(target2, repl2);
fs.writeFileSync(file, c, 'utf8');
console.log('Successfully patched bc09a629f509a816.js for Community Enable button & SVG overlay!');
