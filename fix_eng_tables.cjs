const fs = require('fs');
let file = fs.readFileSync('src/features/organization/views/EngineeringLabView.tsx', 'utf8');

// Fix the blueprint table rows
file = file.replace(
  /<td className="p-4" onClick={\(e\) => e.stopPropagation\(\)}>\s*<button[\s\S]*?<\/button>\s*<\/td>\s*<td className="p-4 font-mono">{bp.powerOrForce \|\| 'N\/A'}<\/td>\s*<td className="p-4 font-mono">{bp.model \|\| 'N\/A'}<\/td>\s*<td className="p-4 font-mono font-bold text-white uppercase">{bp.reference}<\/td>/g,
  `<td className="p-4 font-mono font-bold text-white uppercase">{bp.reference}</td>
                                        <td className="p-4 font-mono">{bp.model || 'N/A'}</td>
                                        <td className="p-4 font-mono">{bp.powerOrForce || 'N/A'}</td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                          <button 
                                            onClick={(e) => handleDelete('blueprint', bp.id, e)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>`
);

// Fix the template table rows
file = file.replace(
  /<td className="p-4" onClick={\(e\) => e.stopPropagation\(\)}>\s*<button[\s\S]*?<\/button>\s*<\/td>\s*<td className="p-4 font-mono">{blueprintCounts.get\(tpl.id\) \|\| 0} طراز<\/td>\s*<td className="p-4 font-mono font-bold text-white uppercase">{tpl.skuBase}<\/td>\s*<td className="p-4 font-bold text-slate-200">{tpl.name}<\/td>/g,
  `<td className="p-4 font-bold text-slate-200">{tpl.name}</td>
                                        <td className="p-4 font-mono font-bold text-white uppercase">{tpl.skuBase}</td>
                                        <td className="p-4 font-mono">{blueprintCounts.get(tpl.id) || 0} طراز</td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                          <button 
                                            onClick={(e) => handleDelete('template', tpl.id, e)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>`
);

fs.writeFileSync('src/features/organization/views/EngineeringLabView.tsx', file);
