// src/core/events/EventStore.ts
import Dexie, { type Table } from 'dexie';
import { DomainEvent } from './Event';
import { createLogger } from '@/core/logging/Logger';

const logger = createLogger('EventStore');

export interface EventRecord {
  id: string;
  aggregateId: string;
  eventType: string;
  data: any; // Serialized DomainEvent
  timestamp: string;
  version: number;
}

class EventDatabase extends Dexie {
  events!: Table<EventRecord, string>;

  constructor() {
    super('GMAO_EVENT_SOURCING_DB');
    this.version(1).stores({
      events: 'id, aggregateId, eventType, timestamp, version',
    });
  }
}

const eventDb = new EventDatabase();

export class EventStore {
  async append(event: DomainEvent, aggregateId: string): Promise<void> {
    try {
      const latestVersion = await this.getLatestVersion(aggregateId);
      const newVersion = latestVersion + 1;

      const record: EventRecord = {
        id: event.id,
        aggregateId,
        eventType: event.getEventType(),
        data: JSON.parse(JSON.stringify(event)), // Plain object serialization
        timestamp: event.occurredAt.toISOString(),
        version: newVersion,
      };

      await eventDb.events.add(record);

      logger.info(`Event appended: ${event.getEventType()} (Version: ${newVersion})`, {
        aggregateId,
        eventId: event.id,
      });
    } catch (error) {
      logger.error('Failed to append event to EventStore', error, { aggregateId, eventType: event.getEventType() });
      throw error;
    }
  }

  async getEvents(aggregateId: string): Promise<EventRecord[]> {
    try {
      return await eventDb.events
        .where('aggregateId')
        .equals(aggregateId)
        .sortBy('version');
    } catch (error) {
      logger.error('Failed to retrieve events from EventStore', error, { aggregateId });
      throw error;
    }
  }

  async getLatestVersion(aggregateId: string): Promise<number> {
    try {
      const events = await eventDb.events
        .where('aggregateId')
        .equals(aggregateId)
        .toArray();
      return events.length;
    } catch {
      return 0;
    }
  }

  /**
   * Replays events for a given aggregate using a state reducer function.
   */
  async replay<T>(aggregateId: string, reducer: (state: T, event: any) => T, initialState: T): Promise<T> {
    try {
      const eventRecords = await this.getEvents(aggregateId);
      let currentState = initialState;

      for (const record of eventRecords) {
        currentState = reducer(currentState, record.data);
      }

      logger.debug(`Replayed ${eventRecords.length} events for aggregate: ${aggregateId}`);
      return currentState;
    } catch (error) {
      logger.error('Failed to replay events', error, { aggregateId });
      throw error;
    }
  }
}

export const eventStore = new EventStore();
