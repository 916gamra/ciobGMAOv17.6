import re

fixes = {
    503: "prrComponents",
    793: "scmComponents",
    958: "poaComponents",
    1154: "poaV2Components",
    1407: "poaV3Components",
    1658: "poaV4Components",
    1775: "pomComponents",
    3142: "rvaComponents",
    3776: "rvaComponentsV2",
    3841: "rvaComponentsV4",
    4074: "rvmComponents",
    4307: "rvmComponentsV2",
    4403: "rvmComponentsV3",
    4580: "detComponents",
    4631: "detV2Components",
    4720: "detV3Components",
    4788: "detV4Components",
    4904: "sat2Components",
}

with open('src/core/db/sandboxSeed.ts', 'r') as f:
    lines = f.readlines()

for idx, var_name in fixes.items():
    if "await db.standardComponents.bulkAdd(;" in lines[idx-1]:
        lines[idx-1] = lines[idx-1].replace("await db.standardComponents.bulkAdd(;", f"await db.standardComponents.bulkAdd({var_name});")
    elif "await db.standardComponents.bulkAddV2(;" in lines[idx-1]:
        lines[idx-1] = lines[idx-1].replace("await db.standardComponents.bulkAddV2(;", f"await db.standardComponents.bulkAdd({var_name});")
    elif "await db.standardComponents.bulkAddV3(;" in lines[idx-1]:
        lines[idx-1] = lines[idx-1].replace("await db.standardComponents.bulkAddV3(;", f"await db.standardComponents.bulkAdd({var_name});")
    elif "await db.standardComponents.bulkAddV4(;" in lines[idx-1]:
        lines[idx-1] = lines[idx-1].replace("await db.standardComponents.bulkAddV4(;", f"await db.standardComponents.bulkAdd({var_name});")
    else:
        # Just hardcode the line
        lines[idx-1] = f"      await db.standardComponents.bulkAdd({var_name});\n"

lines[3775] = f"      await db.standardComponents.bulkAdd(rvaComponentsV2);\n"
lines[3840] = f"      await db.standardComponents.bulkAdd(rvaComponentsV4);\n"
lines[4306] = f"      await db.standardComponents.bulkAdd(rvmComponentsV2);\n"
lines[4402] = f"      await db.standardComponents.bulkAdd(rvmComponentsV3);\n"

with open('src/core/db/sandboxSeed.ts', 'w') as f:
    f.writelines(lines)
