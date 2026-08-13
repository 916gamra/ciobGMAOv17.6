const fs = require('fs');
let file = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');

// Level 1: Family
file = file.replace(
  /before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-indigo-400" \n                            : "bg-white\/\[0\.01\] border-white\/5 hover:border-white\/10 hover:bg-white\/\[0\.03\]"\n                        \)}\n                      >\n                        <div className="flex items-center gap-1\.5">\n                          <button \n                            onClick={\(e\) => toggleFamilyExpansion\(fam\.id, e\)}\n                            className="p-1 hover:bg-white\/5 rounded text-slate-400 hover:text-white"\n                          >\n                            {isExpanded \? <ChevronDown className="w-3\.5 h-3\.5" \/> : <ChevronRight className="w-3\.5 h-3\.5" \/>}\n                          <\/button>\n                          <span className="text-\[10px\] font-mono bg-white\/10 text-white border-white\/15 px-1\.5 py-0\.5 rounded border">\n                            {fam\.code}\n                          <\/span>\n                        <\/div>\n                        <span className="text-xs font-bold text-slate-200 truncate pr-2 flex-1 text-left">\n                          {fam\.name}\n                        <\/span>\n                      <\/div>/g,
  `before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-400" 
                            : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                        )}
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <button 
                            onClick={(e) => toggleFamilyExpansion(fam.id, e)}
                            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white shrink-0"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {fam.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-white/10 text-white border-white/15 px-1.5 py-0.5 rounded border shrink-0">
                          {fam.code}
                        </span>
                      </div>`
);

// Level 2: Template Indentation
file = file.replace(
  /<div className="pr-4 border-r border-white\/5 mr-2\.5 space-y-1 py-1">/g,
  '<div className="pl-4 border-l border-white/5 ml-2.5 space-y-1 py-1">'
);

// Level 2: Template
file = file.replace(
  /before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-indigo-400"\n                                      : "bg-white\/\[0\.01\] border-white\/5 hover:bg-white\/\[0\.03\] hover:border-white\/10"\n                                  \)}\n                                >\n                                  <div className="flex items-center gap-1">\n                                    <button\n                                      onClick={\(e\) => toggleTemplateExpansion\(tpl\.id, e\)}\n                                      className="p-1 hover:bg-white\/5 rounded text-slate-400 hover:text-white"\n                                    >\n                                      {isTplExpanded \? <ChevronDown className="w-3\.5 h-3\.5" \/> : <ChevronRight className="w-3\.5 h-3\.5" \/>}\n                                    <\/button>\n                                    <span className="text-\[9px\] font-mono text-white bg-white\/10 px-1\.5 py-0\.5 rounded border border-white\/15">\n                                      {tpl\.skuBase}\n                                    <\/span>\n                                  <\/div>\n                                  <span className="text-xs font-semibold text-slate-200 truncate pr-2 flex-1">\n                                    {tpl\.name}\n                                  <\/span>\n                                <\/div>/g,
  `before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-400"
                                      : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                                  )}
                                >
                                  <div className="flex items-center gap-1 overflow-hidden">
                                    <button
                                      onClick={(e) => toggleTemplateExpansion(tpl.id, e)}
                                      className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white shrink-0"
                                    >
                                      {isTplExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                    <span className="text-xs font-semibold text-slate-200 truncate">
                                      {tpl.name}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-mono text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/15 shrink-0">
                                    {tpl.skuBase}
                                  </span>
                                </div>`
);

// Level 3: Blueprint
file = file.replace(
  /before:absolute before:inset-y-0 before:right-0 before:w-1 before:bg-indigo-400"\n                                                : "bg-transparent border-transparent hover:bg-white\/\[0\.02\]"\n                                            \)}\n                                          >\n                                            <div className="flex items-center gap-2">\n                                              <Component className="w-3\.5 h-3\.5 opacity-50" \/>\n                                              <span className="text-\[10px\] font-mono opacity-80 uppercase tracking-widest bg-white\/5 px-1\.5 py-0\.5 rounded">\n                                                {bp\.reference}\n                                              <\/span>\n                                            <\/div>\n                                            <span className="text-\[10px\] truncate max-w-\[100px\] font-medium opacity-70 flex-1 pl-2 text-right">\n                                              {bp\.model}\n                                            <\/span>\n                                          <\/div>/g,
  `before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-400"
                                                : "bg-transparent border-transparent hover:bg-white/[0.02]"
                                            )}
                                          >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                              <Component className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                              <span className="text-[10px] truncate font-medium opacity-70">
                                                {bp.model}
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-mono opacity-80 uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                                              {bp.reference}
                                            </span>
                                          </div>`
);

fs.writeFileSync('src/features/organization/views/EngineeringLabView.tsx', file);
