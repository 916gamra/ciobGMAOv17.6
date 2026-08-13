const fs = require('fs');
let file = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');

file = file.replace(
  /before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-indigo-400"\n                                              : "bg-white\/\[0\.005\] border-transparent hover:bg-white\/\[0\.02\] hover:border-white\/5 text-slate-300 hover:text-white"\n                                          \)}\n                                        >\n                                          <Hash className="w-3 h-3 text-slate-400 shrink-0" \/>\n                                          <span className="text-\[11px\] font-mono tracking-tight truncate pr-2 flex-1">\n                                            {bp\.reference}\n                                          <\/span>\n                                        <\/div>/g,
  `before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-400"
                                              : "bg-white/[0.005] border-transparent hover:bg-white/[0.02] hover:border-white/5 text-slate-300 hover:text-white"
                                          )}
                                        >
                                          <div className="flex items-center gap-1.5 overflow-hidden w-full">
                                            <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="text-xs font-mono tracking-tight truncate flex-1 pl-1">
                                              {bp.reference}
                                            </span>
                                          </div>
                                        </div>`
);

// Also fix Blueprint children indent:
file = file.replace(
  /<div className="pr-4 border-r border-white\/5 mr-2 space-y-1 py-0\.5">/g,
  '<div className="pl-4 border-l border-white/5 ml-2 space-y-1 py-0.5">'
);

fs.writeFileSync('src/features/organization/views/EngineeringLabView.tsx', file);
