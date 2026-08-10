// src/core/cqrs/index.ts
import { CommandBus } from './CommandBus';
import { QueryBus } from './QueryBus';

import {
  CreatePdrBlueprintCommand,
  AdjustStockCommand,
} from '@/features/pdr-engine/cqrs/PdrCommands';

import {
  GetPdrBlueprintsByTemplateQuery,
  GetStockItemByBlueprintQuery,
} from '@/features/pdr-engine/cqrs/PdrQueries';

export const commandBus = new CommandBus();
export const queryBus = new QueryBus();

// --- Register PDR Commands Handlers ---
commandBus.register(CreatePdrBlueprintCommand, async (cmd) => {
  return await cmd.execute();
});

commandBus.register(AdjustStockCommand, async (cmd) => {
  return await cmd.execute();
});

// --- Register PDR Queries Handlers ---
queryBus.register(GetPdrBlueprintsByTemplateQuery, async (qry) => {
  return await qry.execute();
});

queryBus.register(GetStockItemByBlueprintQuery, async (qry) => {
  return await qry.execute();
});
